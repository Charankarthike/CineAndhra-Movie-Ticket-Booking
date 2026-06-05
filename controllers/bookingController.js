const pool = require('../config/db');
const { releaseExpiredReservations } = require('../utils/seatMaintenance');

async function createBooking(req, res) {
  const userId = req.user.userId;
  const { show_id } = req.body;
  if (!show_id) return res.status(400).json({ error: 'show_id is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await releaseExpiredReservations(conn);

    const [reserved] = await conn.query(
      `SELECT seat_id FROM Seats
       WHERE show_id = ? AND status = 'reserved' AND reserved_by_user_id = ?
       FOR UPDATE`,
      [show_id, userId]
    );

    if (!reserved.length) {
      await conn.rollback();
      return res.status(400).json({
        error: 'No reserved seats for this show. Select seats first.',
      });
    }

    const [showRows] = await conn.query(
      'SELECT ticket_price FROM Shows WHERE show_id = ?',
      [show_id]
    );
    if (!showRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Show not found' });
    }

    const unit = Number(showRows[0].ticket_price);
    const total = +(unit * reserved.length).toFixed(2);

    const [ins] = await conn.query(
      `INSERT INTO Bookings (user_id, show_id, total_price, status)
       VALUES (?, ?, ?, 'pending_payment')`,
      [userId, show_id, total]
    );
    const bookingId = ins.insertId;

    const values = reserved.map((r) => [bookingId, r.seat_id]);
    await conn.query('INSERT INTO Booking_Seats (booking_id, seat_id) VALUES ?', [values]);

    await conn.commit();

    res.status(201).json({
      message: 'Booking created. Proceed to payment.',
      booking_id: bookingId,
      show_id: Number(show_id),
      seat_count: reserved.length,
      total_price: total,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Could not create booking' });
  } finally {
    conn.release();
  }
}

async function getBooking(req, res) {
  try {
    const bookingId = req.params.id;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    const [rows] = await pool.query(
      `SELECT b.*, m.title AS movie_title, t.name AS theater_name, s.show_time,
              u.name AS customer_name, u.email AS customer_email
       FROM Bookings b
       JOIN Shows s ON s.show_id = b.show_id
       JOIN Movies m ON m.movie_id = s.movie_id
       JOIN Theaters t ON t.theater_id = s.theater_id
       JOIN Users u ON u.user_id = b.user_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
    const booking = rows[0];
    if (!isAdmin && booking.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [seats] = await pool.query(
      `SELECT st.seat_number, st.seat_id, st.status AS seat_status
       FROM Booking_Seats bs
       JOIN Seats st ON st.seat_id = bs.seat_id
       WHERE bs.booking_id = ?`,
      [bookingId]
    );

    const [payments] = await pool.query(
      'SELECT payment_id, amount, status, created_at FROM Payments WHERE booking_id = ? ORDER BY payment_id DESC',
      [bookingId]
    );

    res.json({ booking, seats, payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load booking' });
  }
}

async function cancelBooking(req, res) {
  const userId = req.user.userId;
  const { booking_id } = req.body;
  if (!booking_id) return res.status(400).json({ error: 'booking_id is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [brows] = await conn.query(
      'SELECT * FROM Bookings WHERE booking_id = ? FOR UPDATE',
      [booking_id]
    );
    if (!brows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = brows[0];
    if (booking.user_id !== userId) {
      await conn.rollback();
      return res.status(403).json({ error: 'Access denied' });
    }
    if (booking.status !== 'confirmed') {
      await conn.rollback();
      return res.status(400).json({
        error: 'Only confirmed bookings can be cancelled for a refund',
      });
    }

    await conn.query(
      `UPDATE Bookings SET status = 'cancelled' WHERE booking_id = ?`,
      [booking_id]
    );

    const [seatRows] = await conn.query(
      `SELECT seat_id FROM Booking_Seats WHERE booking_id = ?`,
      [booking_id]
    );
    const ids = seatRows.map((r) => r.seat_id);
    if (ids.length) {
      const ph = ids.map(() => '?').join(',');
      await conn.query(
        `UPDATE Seats SET status = 'available', reserved_by_user_id = NULL, reserved_at = NULL
         WHERE seat_id IN (${ph})`,
        ids
      );
    }

    await conn.query(
      `UPDATE Payments SET status = 'refunded'
       WHERE booking_id = ? AND status = 'completed'`,
      [booking_id]
    );

    await conn.commit();
    res.json({
      message: 'Booking cancelled. Refund processed (simulated).',
      booking_id: Number(booking_id),
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Could not cancel booking' });
  } finally {
    conn.release();
  }
}

async function listMyBookings(req, res) {
  try {
    const userId = req.user.userId;
    const [rows] = await pool.query(
      `SELECT b.booking_id, b.show_id, b.status, b.total_price, b.created_at,
              m.title AS movie_title,
              t.name AS theater_name,
              t.location AS theater_location,
              s.show_time,
              (SELECT COUNT(*) FROM Booking_Seats x WHERE x.booking_id = b.booking_id) AS ticket_count,
              (SELECT GROUP_CONCAT(st2.seat_number ORDER BY st2.seat_number SEPARATOR ', ')
               FROM Booking_Seats bs2
               JOIN Seats st2 ON st2.seat_id = bs2.seat_id
               WHERE bs2.booking_id = b.booking_id) AS seats
       FROM Bookings b
       JOIN Shows s ON s.show_id = b.show_id
       JOIN Movies m ON m.movie_id = s.movie_id
       JOIN Theaters t ON t.theater_id = s.theater_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load your bookings' });
  }
}

module.exports = { createBooking, getBooking, cancelBooking, listMyBookings };
