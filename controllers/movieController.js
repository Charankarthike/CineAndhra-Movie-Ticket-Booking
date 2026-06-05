const pool = require('../config/db');

async function listMovies(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT movie_id, title, duration, description, poster_url FROM Movies ORDER BY title'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load movies' });
  }
}

async function getMovie(req, res) {
  try {
    const id = req.params.id;
    const [rows] = await pool.query(
      'SELECT movie_id, title, duration, description, poster_url FROM Movies WHERE movie_id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Movie not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load movie' });
  }
}

module.exports = { listMovies, getMovie };
