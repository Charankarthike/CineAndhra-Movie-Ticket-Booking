/**
 * Loads sample data after schema.sql has been applied.
 * Run: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = 12;

async function main() {

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('DELETE FROM Booking_Seats');
    await conn.query('DELETE FROM Payments');
    await conn.query('DELETE FROM Bookings');
    await conn.query('DELETE FROM Seats');
    await conn.query('DELETE FROM Shows');
    await conn.query('DELETE FROM Movies');
    await conn.query('DELETE FROM Theaters');
    await conn.query('DELETE FROM Users');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    await conn.query('ALTER TABLE Users AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE Theaters AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE Movies AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE Shows AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE Seats AUTO_INCREMENT = 1');

    const adminHash = await bcrypt.hash('Admin@123', 10);
    const userHash = await bcrypt.hash('User@123', 10);

    await conn.query(
      `INSERT INTO Users (name, email, password, role) VALUES 
       ('System Admin', 'admin@movies.com', ?, 'admin'),
       ('Ravi Teja', 'ravi@example.com', ?, 'customer')`,
      [adminHash, userHash]
    );

    // Famous Hyderabad / Telugu theaters
    await conn.query(
      `INSERT INTO Theaters (name, location) VALUES
       ('Prasads IMAX', 'Lower Tank Bund Road, Hyderabad'),
       ('Devi 70MM', 'SD Road, Secunderabad'),
       ('Asian Cinemas', 'Kukatpally, Hyderabad')`
    );

    // 6 Popular Telugu Blockbusters
    await conn.query(
      `INSERT INTO Movies (title, duration, description, poster_url) VALUES
       ('Pushpa 2: The Rule',       190,
        'Pushpa Raj continues his rise in the red sandalwood smuggling syndicate, locking horns with a ruthless cop in an epic showdown of power. A mass action spectacle starring Allu Arjun.',
        '/images/pushpa2.jpg'),
       ('Kalki 2898 AD',            180,
        'Set in a dystopian future, a reluctant hero rises to fulfill an ancient prophecy and protect the last hope of humanity. A mythological sci-fi epic starring Prabhas, Deepika Padukone & Amitabh Bachchan.',
        '/images/kalki.jpg'),
       ('RRR',                      182,
        'A fictional tale of two legendary freedom fighters, Alluri Sitarama Raju and Komaram Bheem, and their journey before they began their struggle against British rule. Starring Ram Charan & Jr NTR.',
        '/images/rrr.jpg'), 
       ('Baahubali 2: The Conclusion', 167,
        'The thrilling conclusion to the saga — Mahendra Baahubali learns about the past and his father Amarendra''s story, ultimately waging war against the treacherous Bhallaladeva. Starring Prabhas.',
        '/images/baahubali2.jpg'),
       ('Vikram Vedha',             147,
        'A tough police officer sets out to track down and kill an encounter-proof gangster. A neo-noir crime thriller of morality and grey characters, starring Hrithik Roshan & Saif Ali Khan.',
        '/images/vikram.jpg'),
       ('Akhanda',                  175,
        'A fierce and fearless man with divine powers takes on a powerful crime lord who terrorises a village. A high-voltage mass entertainer starring Nandamuri Balakrishna in a double role.',
        '/images/akhanda.jpg')`
    );

    // Helper to build a Date for a given day-offset and HH:MM
    function showAt(dayOffset, hours, minutes = 0) {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      d.setHours(hours, minutes, 0, 0);
      return d;
    }

    // Create shows for each movie for the current date and next 3 days
    const showRows = [];

    for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
      // Pushpa 2 (movie_id = 1)
      showRows.push([1, 1, showAt(dayOffset, 10, 0), 200.00]);
      showRows.push([1, 1, showAt(dayOffset, 18, 30), 200.00]);
      showRows.push([1, 2, showAt(dayOffset, 21, 0), 220.00]);
      // Kalki 2898 AD (movie_id = 2)
      showRows.push([2, 1, showAt(dayOffset, 11, 30), 250.00]);
      showRows.push([2, 2, showAt(dayOffset, 19, 0), 250.00]);
      showRows.push([2, 3, showAt(dayOffset, 15, 0), 230.00]);
      // RRR (movie_id = 3)
      showRows.push([3, 2, showAt(dayOffset, 10, 0), 180.00]);
      showRows.push([3, 3, showAt(dayOffset, 17, 30), 180.00]);
      // Baahubali 2 (movie_id = 4)
      showRows.push([4, 1, showAt(dayOffset, 12, 0), 175.00]);
      showRows.push([4, 2, showAt(dayOffset, 19, 30), 175.00]);
      // Vikram Vedha (movie_id = 5)
      showRows.push([5, 3, showAt(dayOffset, 10, 30), 165.00]);
      showRows.push([5, 1, showAt(dayOffset, 21, 0), 165.00]);
      // Akhanda (movie_id = 6)
      showRows.push([6, 2, showAt(dayOffset, 11, 0), 155.00]);
      showRows.push([6, 3, showAt(dayOffset, 18, 0), 155.00]);
    }

    for (const [mid, tid, stime, price] of showRows) {
      await conn.query(
        'INSERT INTO Shows (movie_id, theater_id, show_time, ticket_price) VALUES (?, ?, ?, ?)',
        [mid, tid, stime, price]
      );
    }

    const [shows] = await conn.query('SELECT show_id FROM Shows ORDER BY show_id');
    const seatValues = [];
    for (const row of shows) {
      for (const r of ROWS) {
        for (let c = 1; c <= COLS; c++) {
          seatValues.push([row.show_id, `${r}${c}`, 'available']);
        }
      }
    }

    // Insert seats in chunks of 5000 to prevent 'packet too large' errors
    const chunkSize = 5000;
    for (let i = 0; i < seatValues.length; i += chunkSize) {
      const chunk = seatValues.slice(i, i + chunkSize);
      await conn.query(
        'INSERT INTO Seats (show_id, seat_number, status) VALUES ?',
        [chunk]
      );
    }

    await conn.commit();
    console.log('✅ Seed completed!');
    console.log('   Admin  → admin@movies.com  / Admin@123');
    console.log('   User   → ravi@example.com  / User@123');
    console.log('   Movies → 6 Telugu blockbusters seeded');
  } catch (err) {
    await conn.rollback();
    console.error(err);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
