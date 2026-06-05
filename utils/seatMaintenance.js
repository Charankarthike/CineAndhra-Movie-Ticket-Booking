const pool = require('../config/db');
const { RESERVATION_TTL_MINUTES } = require('../config/constants');

async function releaseExpiredReservations(connection = null) {
  const mins = Number(RESERVATION_TTL_MINUTES) || 15;
  const sql = `
    UPDATE Seats
    SET status = 'available', reserved_by_user_id = NULL, reserved_at = NULL
    WHERE status = 'reserved'
      AND reserved_at IS NOT NULL
      AND reserved_at < (NOW() - INTERVAL ${mins} MINUTE)
  `;
  if (connection) {
    await connection.query(sql);
  } else {
    await pool.query(sql);
  }
}

module.exports = { releaseExpiredReservations };
