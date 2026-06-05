const pool = require('../config/db');

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COLS = 10;

function normalizePosterUrl(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s.length > 512) return { error: 'poster_url must be at most 512 characters' };
  if (!/^https?:\/\/.+/i.test(s)) {
    return { error: 'poster_url must be a valid http(s) URL' };
  }
  return { value: s };
}

async function addMovie(req, res) {
  try {
    const { title, duration, description, poster_url } = req.body;
    if (!title || duration == null) {
      return res.status(400).json({ error: 'title and duration are required' });
    }
    const poster = normalizePosterUrl(poster_url);
    if (poster && poster.error) return res.status(400).json({ error: poster.error });
    const posterVal = poster ? poster.value : null;
    const [r] = await pool.query(
      'INSERT INTO Movies (title, duration, description, poster_url) VALUES (?, ?, ?, ?)',
      [title, Number(duration), description || '', posterVal]
    );
    res.status(201).json({ message: 'Movie added', movie_id: r.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add movie' });
  }
}

async function updateMovie(req, res) {
  try {
    const { movie_id, title, duration, description, poster_url } = req.body;
    if (!movie_id) return res.status(400).json({ error: 'movie_id is required' });
    const fields = [];
    const vals = [];
    if (title != null) {
      fields.push('title = ?');
      vals.push(title);
    }
    if (duration != null) {
      fields.push('duration = ?');
      vals.push(Number(duration));
    }
    if (description != null) {
      fields.push('description = ?');
      vals.push(description);
    }
    if (poster_url !== undefined) {
      const poster = normalizePosterUrl(poster_url);
      if (poster && poster.error) return res.status(400).json({ error: poster.error });
      fields.push('poster_url = ?');
      vals.push(poster ? poster.value : null);
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(movie_id);
    const [result] = await pool.query(
      `UPDATE Movies SET ${fields.join(', ')} WHERE movie_id = ?`,
      vals
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Movie not found' });
    res.json({ message: 'Movie updated', movie_id: Number(movie_id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update movie' });
  }
}

async function deleteMovie(req, res) {
  try {
    const movieId = req.body.movie_id ?? req.query.movie_id;
    if (!movieId) return res.status(400).json({ error: 'movie_id is required' });
    const [result] = await pool.query('DELETE FROM Movies WHERE movie_id = ?', [movieId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Movie not found' });
    res.json({ message: 'Movie deleted', movie_id: Number(movieId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete movie' });
  }
}

async function addShow(req, res) {
  const { movie_id, theater_id, show_time, ticket_price } = req.body;
  if (!movie_id || !theater_id || !show_time) {
    return res.status(400).json({ error: 'movie_id, theater_id, and show_time are required' });
  }
  const price = ticket_price != null ? Number(ticket_price) : 165.0;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [ins] = await conn.query(
      `INSERT INTO Shows (movie_id, theater_id, show_time, ticket_price)
       VALUES (?, ?, ?, ?)`,
      [movie_id, theater_id, show_time, price]
    );
    const showId = ins.insertId;

    const seatValues = [];
    for (const r of ROWS) {
      for (let c = 1; c <= COLS; c++) {
        seatValues.push([showId, `${r}${c}`, 'available']);
      }
    }
    await conn.query('INSERT INTO Seats (show_id, seat_number, status) VALUES ?', [seatValues]);

    await conn.commit();
    res.status(201).json({
      message: 'Show added with seat layout',
      show_id: showId,
      seats_created: seatValues.length,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Could not add show' });
  } finally {
    conn.release();
  }
}

async function listBookings(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT b.booking_id, b.user_id, u.name AS customer_name, u.email,
              b.show_id, m.title AS movie_title, t.name AS theater_name,
              s.show_time, b.total_price, b.status, b.created_at
       FROM Bookings b
       JOIN Users u ON u.user_id = b.user_id
       JOIN Shows s ON s.show_id = b.show_id
       JOIN Movies m ON m.movie_id = s.movie_id
       JOIN Theaters t ON t.theater_id = s.theater_id
       ORDER BY b.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load bookings' });
  }
}

async function listTheaters(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM Theaters ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load theaters' });
  }
}

module.exports = {
  addMovie,
  updateMovie,
  deleteMovie,
  addShow,
  listBookings,
  listTheaters,
};
