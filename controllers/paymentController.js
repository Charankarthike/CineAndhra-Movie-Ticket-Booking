const pool = require('../config/db');
const { releaseExpiredReservations } = require('../utils/seatMaintenance');

async function releaseBookingSeats(conn, bookingId) {
  const [seatRows] = await conn.query('SELECT seat_id FROM Booking_Seats WHERE booking_id = ?', [
    bookingId,
  ]);
  const ids = seatRows.map((r) => r.seat_id);
  if (!ids.length) return;
  const ph = ids.map(() => '?').join(',');
  await conn.query(
    `UPDATE Seats SET status = 'available', reserved_by_user_id = NULL, reserved_at = NULL
     WHERE seat_id IN (${ph})`,
    ids
  );
}

async function confirmBookingSeats(conn, bookingId) {
  const [seatRows] = await conn.query('SELECT seat_id FROM Booking_Seats WHERE booking_id = ?', [
    bookingId,
  ]);
  const ids = seatRows.map((r) => r.seat_id);
  if (!ids.length) return;
  const ph = ids.map(() => '?').join(',');
  await conn.query(
    `UPDATE Seats SET status = 'booked', reserved_by_user_id = NULL, reserved_at = NULL
     WHERE seat_id IN (${ph})`,
    ids
  );
}

async function pay(req, res) {
  const userId = req.user.userId;
  const { booking_id, simulate_failure } = req.body;
  if (!booking_id) return res.status(400).json({ error: 'booking_id is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await releaseExpiredReservations(conn);

    const [brows] = await conn.query(
      `SELECT b.* FROM Bookings b WHERE b.booking_id = ? FOR UPDATE`,
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
    if (booking.status !== 'pending_payment') {
      await conn.rollback();
      return res.status(400).json({ error: 'Booking is not awaiting payment' });
    }

    const fail = simulate_failure === true || simulate_failure === 'true';

    const [payIns] = await conn.query(
      'INSERT INTO Payments (booking_id, amount, status) VALUES (?, ?, ?)',
      [booking_id, booking.total_price, fail ? 'failed' : 'completed']
    );

    if (fail) {
      await conn.query(`UPDATE Bookings SET status = 'payment_failed' WHERE booking_id = ?`, [
        booking_id,
      ]);
      await releaseBookingSeats(conn, booking_id);
      await conn.commit();
      return res.status(402).json({
        error: 'Payment failed (simulated). Seats released.',
        booking_id: Number(booking_id),
        payment_id: payIns.insertId,
      });
    }

    await conn.query(`UPDATE Bookings SET status = 'confirmed' WHERE booking_id = ?`, [booking_id]);
    await confirmBookingSeats(conn, booking_id);

    await conn.commit();
    res.json({
      message: 'Payment successful (simulated). Booking confirmed.',
      booking_id: Number(booking_id),
      payment_id: payIns.insertId,
      amount: Number(booking.total_price),
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Payment processing error' });
  } finally {
    conn.release();
  }
}

module.exports = { pay };
