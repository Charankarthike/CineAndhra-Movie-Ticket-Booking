-- Run once if you already created the DB without poster_url:
-- mysql -u root -p movie_booking < database/migration_add_poster_url.sql

USE movie_booking;

ALTER TABLE Movies
  ADD COLUMN poster_url VARCHAR(512) NULL COMMENT 'HTTPS image URL for poster' AFTER description;
