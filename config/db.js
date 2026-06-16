const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movie_booking',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

module.exports = pool;
