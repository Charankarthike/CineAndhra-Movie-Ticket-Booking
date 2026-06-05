-- Online Movie Ticket Booking System — MySQL schema
-- Charset: utf8mb4 for full Unicode support

CREATE DATABASE IF NOT EXISTS movie_booking;
USE movie_booking;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS Booking_Seats;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Seats;
DROP TABLE IF EXISTS Shows;
DROP TABLE IF EXISTS Movies;
DROP TABLE IF EXISTS Theaters;
DROP TABLE IF EXISTS Users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Movies (
  movie_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  duration INT UNSIGNED NOT NULL COMMENT 'Runtime in minutes',
  description TEXT,
  poster_url VARCHAR(512) NULL COMMENT 'HTTPS image URL for poster',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Theaters (
  theater_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  location VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Shows (
  show_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  movie_id INT UNSIGNED NOT NULL,
  theater_id INT UNSIGNED NOT NULL,
  show_time DATETIME NOT NULL,
  ticket_price DECIMAL(10, 2) NOT NULL DEFAULT 165.00 COMMENT 'Amount in INR',
  FOREIGN KEY (movie_id) REFERENCES Movies(movie_id) ON DELETE CASCADE,
  FOREIGN KEY (theater_id) REFERENCES Theaters(theater_id) ON DELETE CASCADE,
  INDEX idx_shows_movie (movie_id),
  INDEX idx_shows_time (show_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Seats (
  seat_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  show_id INT UNSIGNED NOT NULL,
  seat_number VARCHAR(16) NOT NULL,
  status ENUM('available', 'reserved', 'booked') NOT NULL DEFAULT 'available',
  reserved_by_user_id INT UNSIGNED NULL,
  reserved_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (show_id) REFERENCES Shows(show_id) ON DELETE CASCADE,
  FOREIGN KEY (reserved_by_user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
  UNIQUE KEY uk_show_seat (show_id, seat_number),
  INDEX idx_seats_show_status (show_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Bookings (
  booking_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  show_id INT UNSIGNED NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status ENUM('pending_payment', 'confirmed', 'cancelled', 'payment_failed') NOT NULL DEFAULT 'pending_payment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (show_id) REFERENCES Shows(show_id) ON DELETE CASCADE,
  INDEX idx_bookings_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Booking_Seats (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  seat_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id) REFERENCES Seats(seat_id) ON DELETE CASCADE,
  UNIQUE KEY uk_booking_seat (booking_id, seat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Payments (
  payment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
  INDEX idx_payments_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
