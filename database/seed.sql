-- Sample data (use after database/schema.sql).
-- Logins: admin@movies.com / Admin@123 | alex@example.com / User@123
-- Recommended: `npm run seed` (clears and reloads with fresh bcrypt hashes).

CREATE DATABASE IF NOT EXISTS movie_booking;
USE movie_booking;

INSERT INTO Users (name, email, password, role) VALUES
('System Admin', 'admin@movies.com', '$2a$10$J92ojUfFPCx7QwXvNB9VROZ5IvAikcXgSz0SspPGHZj4BvF0OdRj6', 'admin'),
('Alex Customer', 'alex@example.com', '$2a$10$borS7rFIu41qyTQPMfj86eSSpv5B38kfx5jJt8npaimgFk17oSEu2', 'customer');

INSERT INTO Theaters (name, location) VALUES
('Grand Cinema Downtown', '12 Main Street'),
('Starplex Mall', 'Mall Level 3, West Wing');

INSERT INTO Movies (title, duration, description, poster_url) VALUES
('The Silent Horizon', 142, 'A sci-fi drama about the last signal from a lost colony.',
 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&fit=crop&q=80'),
('Laugh Track', 98, 'A feel-good comedy about a failing podcast that goes viral.',
 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&fit=crop&q=80'),
('Midnight Express', 118, 'A thriller set entirely on a cross-country night train.',
 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&fit=crop&q=80');

INSERT INTO Shows (movie_id, theater_id, show_time, ticket_price) VALUES
(1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 18 HOUR, 165.00),
(1, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 21 HOUR + INTERVAL 30 MINUTE, 165.00),
(2, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 15 HOUR, 165.00),
(3, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 19 HOUR, 165.00);

INSERT INTO Seats (show_id, seat_number, status)
SELECT s.show_id, CONCAT(CHAR(64 + r.n), c.n), 'available'
FROM Shows s
CROSS JOIN (
  SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
) r
CROSS JOIN (
  SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
  UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
) c;
