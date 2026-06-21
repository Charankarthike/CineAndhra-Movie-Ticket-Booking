/**
 * ONE-TIME SETUP ROUTE — Creates tables and seeds data on the remote database.
 * Call: GET /setup?secret=cineinit2024
 * DELETE this file after setup is complete.
 */
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const SETUP_SECRET = 'cineinit2024';
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = 12;

async function runSetup(req, res) {
  if (req.query.secret !== SETUP_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const conn = await pool.getConnection();
  const log = [];

  try {
    await conn.beginTransaction();

    // ── Create Tables ──────────────────────────────────────────────
    await conn.query(`CREATE TABLE IF NOT EXISTS Users (
      user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    log.push('✅ Table: Users');

    await conn.query(`CREATE TABLE IF NOT EXISTS Movies (
      movie_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      duration INT UNSIGNED NOT NULL,
      description TEXT,
      poster_url VARCHAR(512) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    log.push('✅ Table: Movies');

    await conn.query(`CREATE TABLE IF NOT EXISTS Theaters (
      theater_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      location VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    log.push('✅ Table: Theaters');

    await conn.query(`CREATE TABLE IF NOT EXISTS Shows (
      show_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      movie_id INT UNSIGNED NOT NULL,
      theater_id INT UNSIGNED NOT NULL,
      show_time DATETIME NOT NULL,
      ticket_price DECIMAL(10,2) NOT NULL DEFAULT 165.00,
      FOREIGN KEY (movie_id) REFERENCES Movies(movie_id) ON DELETE CASCADE,
      FOREIGN KEY (theater_id) REFERENCES Theaters(theater_id) ON DELETE CASCADE,
      INDEX idx_shows_movie (movie_id),
      INDEX idx_shows_time (show_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    log.push('✅ Table: Shows');

    await conn.query(`CREATE TABLE IF NOT EXISTS Seats (
      seat_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      show_id INT UNSIGNED NOT NULL,
      seat_number VARCHAR(16) NOT NULL,
      status ENUM('available','reserved','booked') NOT NULL DEFAULT 'available',
      reserved_by_user_id INT UNSIGNED NULL,
      reserved_at TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (show_id) REFERENCES Shows(show_id) ON DELETE CASCADE,
      FOREIGN KEY (reserved_by_user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
      UNIQUE KEY uk_show_seat (show_id, seat_number),
      INDEX idx_seats_show_status (show_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    log.push('✅ Table: Seats');

    await conn.query(`CREATE TABLE IF NOT EXISTS Bookings (
      booking_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      show_id INT UNSIGNED NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      status ENUM('pending_payment','confirmed','cancelled','payment_failed') NOT NULL DEFAULT 'pending_payment',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (show_id) REFERENCES Shows(show_id) ON DELETE CASCADE,
      INDEX idx_bookings_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    log.push('✅ Table: Bookings');

    await conn.query(`CREATE TABLE IF NOT EXISTS Booking_Seats (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      booking_id INT UNSIGNED NOT NULL,
      seat_id INT UNSIGNED NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
      FOREIGN KEY (seat_id) REFERENCES Seats(seat_id) ON DELETE CASCADE,
      UNIQUE KEY uk_booking_seat (booking_id, seat_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    log.push('✅ Table: Booking_Seats');

    await conn.query(`CREATE TABLE IF NOT EXISTS Payments (
      payment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      booking_id INT UNSIGNED NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
      INDEX idx_payments_booking (booking_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    log.push('✅ Table: Payments');

    // ── Check if already seeded ─────────────────────────────────────
    const [[{ cnt }]] = await conn.query('SELECT COUNT(*) AS cnt FROM Movies');
    if (cnt > 0) {
      await conn.rollback();
      return res.json({ message: 'Already seeded — skipped.', tables: log });
    }

    // ── Seed Users ──────────────────────────────────────────────────
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const userHash  = await bcrypt.hash('User@123', 10);
    await conn.query(
      `INSERT INTO Users (name, email, password, role) VALUES
       ('System Admin', 'admin@movies.com', ?, 'admin'),
       ('Ravi Teja',    'ravi@example.com', ?, 'customer')`,
      [adminHash, userHash]
    );
    log.push('✅ Seeded: Users (admin + customer)');

    // ── Seed Theaters ───────────────────────────────────────────────
    await conn.query(
      `INSERT INTO Theaters (name, location) VALUES
       ('Prasads IMAX',  'Lower Tank Bund Road, Hyderabad'),
       ('Devi 70MM',     'SD Road, Secunderabad'),
       ('Asian Cinemas', 'Kukatpally, Hyderabad')`
    );
    log.push('✅ Seeded: 3 Theaters');

    // ── Seed Movies ─────────────────────────────────────────────────
    await conn.query(
      `INSERT INTO Movies (title, duration, description, poster_url) VALUES
       ('Pushpa 2: The Rule', 190,
        'Pushpa Raj continues his rise in the red sandalwood smuggling syndicate, locking horns with a ruthless cop.',
        '/images/pushpa2.jpg'),
       ('Kalki 2898 AD', 180,
        'Set in a dystopian future, a reluctant hero rises to fulfill an ancient prophecy.',
        '/images/kalki.jpg'),
       ('RRR', 182,
        'A fictional tale of two legendary freedom fighters before they began their struggle against British rule.',
        '/images/rrr.jpg'),
       ('Baahubali 2: The Conclusion', 167,
        'The thrilling conclusion — Mahendra Baahubali learns about his father Amarendra''s story.',
        '/images/baahubali2.jpg'),
       ('Vikram Vedha', 147,
        'A tough police officer sets out to track down an encounter-proof gangster.',
        '/images/vikram.jpg'),
       ('Akhanda', 175,
        'A fierce man with divine powers takes on a powerful crime lord who terrorises a village.',
        '/images/akhanda.jpg')`
    );
    log.push('✅ Seeded: 6 Movies');

    // ── Seed Shows ──────────────────────────────────────────────────
    function showAt(dayOffset, hours, minutes = 0) {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      d.setHours(hours, minutes, 0, 0);
      return d;
    }

    const showRows = [];
    for (let day = 0; day <= 3; day++) {
      showRows.push([1,1,showAt(day,10,0),200],[1,1,showAt(day,18,30),200],[1,2,showAt(day,21,0),220],
                    [2,1,showAt(day,11,30),250],[2,2,showAt(day,19,0),250],[2,3,showAt(day,15,0),230],
                    [3,2,showAt(day,10,0),180],[3,3,showAt(day,17,30),180],
                    [4,1,showAt(day,12,0),175],[4,2,showAt(day,19,30),175],
                    [5,3,showAt(day,10,30),165],[5,1,showAt(day,21,0),165],
                    [6,2,showAt(day,11,0),155],[6,3,showAt(day,18,0),155]);
    }
    for (const [mid, tid, stime, price] of showRows) {
      await conn.query(
        'INSERT INTO Shows (movie_id, theater_id, show_time, ticket_price) VALUES (?,?,?,?)',
        [mid, tid, stime, price]
      );
    }
    log.push(`✅ Seeded: ${showRows.length} Shows`);

    // ── Seed Seats ──────────────────────────────────────────────────
    const [shows] = await conn.query('SELECT show_id FROM Shows ORDER BY show_id');
    const seatValues = [];
    for (const { show_id } of shows) {
      for (const r of ROWS) {
        for (let c = 1; c <= COLS; c++) {
          seatValues.push([show_id, `${r}${c}`, 'available']);
        }
      }
    }
    const chunkSize = 500;
    for (let i = 0; i < seatValues.length; i += chunkSize) {
      await conn.query('INSERT INTO Seats (show_id, seat_number, status) VALUES ?', [seatValues.slice(i, i + chunkSize)]);
    }
    log.push(`✅ Seeded: ${seatValues.length} Seats`);

    await conn.commit();
    log.push('🎉 Setup complete! Delete /setup route before going to production.');
    res.json({ success: true, log });

  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message, log });
  } finally {
    conn.release();
  }
}

module.exports = { runSetup };
