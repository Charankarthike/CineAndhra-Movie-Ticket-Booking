const pool = require('../config/db');
const { MAX_SEATS_PER_BOOKING } = require('../config/constants');
const { releaseExpiredReservations } = require('../utils/seatMaintenance');

async function listSeats(req, res) {
  try {
    await releaseExpiredReservations();
    const showId = req.params.show_id;
    const userId = req.user ? req.user.userId : null;

    const [showRows] = await pool.query(
      `SELECT s.show_id, s.ticket_price, m.title, t.name AS theater_name, s.show_time
       FROM Shows s
       JOIN Movies m ON m.movie_id = s.movie_id
       JOIN Theaters t ON t.theater_id = s.theater_id
       WHERE s.show_id = ?`,
      [showId]
    );
    if (!showRows.length) return res.status(404).json({ error: 'Show not found' });

    const [seats] = await pool.query(
      `SELECT seat_id, show_id, seat_number, status, reserved_by_user_id
       FROM Seats WHERE show_id = ?
       ORDER BY SUBSTRING(seat_number, 1, 1),
                CAST(SUBSTRING(seat_number, 2) AS UNSIGNED)`,
      [showId]
    );

    const enriched = seats.map((s) => ({
      seat_id: s.seat_id,
      seat_number: s.seat_number,
      status: s.status,
      reserved_by_me: userId && s.reserved_by_user_id === userId,
      selectable:
        s.status === 'available' ||
        (s.status === 'reserved' && userId && s.reserved_by_user_id === userId),
      disabled: s.status === 'booked' || (s.status === 'reserved' && (!userId || s.reserved_by_user_id !== userId)),
    }));

    res.json({
      show: showRows[0],
      max_seats_per_booking: MAX_SEATS_PER_BOOKING,
      seats: enriched,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load seats' });
  }
}

async function selectSeats(req, res) {
  const userId = req.user.userId;
  const { show_id, seat_ids } = req.body;

  if (!show_id || !Array.isArray(seat_ids) || seat_ids.length === 0) {
    return res.status(400).json({ error: 'show_id and non-empty seat_ids array are required' });
  }
  if (seat_ids.length > MAX_SEATS_PER_BOOKING) {
    return res.status(400).json({
      error: `You can select at most ${MAX_SEATS_PER_BOOKING} seats per booking`,
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await releaseExpiredReservations(conn);

    const [showCheck] = await conn.query('SELECT show_id FROM Shows WHERE show_id = ?', [show_id]);
    if (!showCheck.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Show not found' });
    }

    await conn.query(
      `UPDATE Seats
       SET status = 'available', reserved_by_user_id = NULL, reserved_at = NULL
       WHERE show_id = ? AND reserved_by_user_id = ? AND status = 'reserved'`,
      [show_id, userId]
    );

    const placeholders = seat_ids.map(() => '?').join(',');
    const [locked] = await conn.query(
      `SELECT seat_id, status, reserved_by_user_id FROM Seats
       WHERE show_id = ? AND seat_id IN (${placeholders}) FOR UPDATE`,
      [show_id, ...seat_ids]
    );

    if (locked.length !== seat_ids.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'One or more seats are invalid for this show' });
    }

    for (const row of locked) {
      const ok =
        row.status === 'available' ||
        (row.status === 'reserved' && row.reserved_by_user_id === userId);
      if (!ok) {
        await conn.rollback();
        return res.status(409).json({
          error: 'Seat already booked or held by another user',
          seat_id: row.seat_id,
        });
      }
    }

    await conn.query(
      `UPDATE Seats
       SET status = 'reserved', reserved_by_user_id = ?, reserved_at = NOW()
       WHERE show_id = ? AND seat_id IN (${placeholders})`,
      [userId, show_id, ...seat_ids]
    );

    await conn.commit();

    const [priceRow] = await pool.query('SELECT ticket_price FROM Shows WHERE show_id = ?', [show_id]);
    const unit = Number(priceRow[0]?.ticket_price || 0);
    res.json({
      message: 'Seats reserved temporarily. Complete booking and payment to confirm.',
      show_id: Number(show_id),
      seat_ids: seat_ids.map(Number),
      seat_count: seat_ids.length,
      unit_price: unit,
      total_price: +(unit * seat_ids.length).toFixed(2),
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Could not reserve seats' });
  } finally {
    conn.release();
  }
}

module.exports = { listSeats, selectSeats };
