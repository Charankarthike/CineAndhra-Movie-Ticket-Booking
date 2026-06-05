const pool = require('../config/db');

async function listShowsForMovie(req, res) {
  try {
    const movieId = req.params.movie_id;
    const [rows] = await pool.query(
      `SELECT s.show_id, s.movie_id, s.theater_id, s.show_time, s.ticket_price,
              t.name AS theater_name, t.location AS theater_location,
              m.title AS movie_title
       FROM Shows s
       JOIN Theaters t ON t.theater_id = s.theater_id
       JOIN Movies m ON m.movie_id = s.movie_id
       WHERE s.movie_id = ?
       ORDER BY s.show_time`,
      [movieId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load shows' });
  }
}

module.exports = { listShowsForMovie };
