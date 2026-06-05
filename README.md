# Online Movie Ticket Booking System

Full-stack web app: customers browse movies, pick a show, select seats on a grid, book, and pay (simulated). Admins manage movies, schedules, and view bookings.

## Stack

- **Frontend:** HTML, CSS, Bootstrap 5, JavaScript (fetch API)
- **Backend:** Node.js, Express (MVC-style: routes → controllers → MySQL)
- **Auth:** JWT (Bearer token), bcrypt password hashing
- **Database:** MySQL 8+ (InnoDB, transactions + row locking for seats)

All ticket and booking amounts are stored and shown as **Indian Rupees (INR)** with the **₹** symbol and `en-IN` number grouping (e.g. ₹1,20,000 style for large values).

## Project structure

```
├── server.js                 # Express entry
├── package.json
├── .env.example              # Copy to .env
├── config/
│   ├── db.js                 # mysql2 pool
│   └── constants.js          # max seats per booking, reservation TTL
├── middleware/
│   ├── auth.js               # JWT (required / optional)
│   └── admin.js
├── controllers/              # Business logic
├── routes/
├── utils/
│   └── seatMaintenance.js    # expire stale “reserved” seats
├── database/
│   ├── schema.sql            # Tables + DB create
│   ├── migration_add_poster_url.sql  # Add poster_url to existing DBs
│   ├── seed.sql              # Optional SQL sample data
│   └── seed.js               # Recommended seed (npm run seed)
└── public/                   # Static UI
    ├── css/style.css
    ├── js/api.js
    ├── index.html
    ├── login.html              # Customer-only standalone login
    ├── register.html
    ├── my-bookings.html         # Logged-in customer booking history
    ├── movie-detail.html
    ├── seats.html
    ├── payment.html
    ├── confirmation.html
    └── admin/
        ├── login.html          # Admin-only standalone login
        └── dashboard.html
```

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|---------------|
| POST | `/register` | — | Register customer |
| POST | `/login` | — | Login, returns JWT |
| GET | `/movies` | — | List movies |
| GET | `/movies/:id` | — | Movie details |
| GET | `/shows/:movie_id` | — | Shows for a movie |
| GET | `/seats/:show_id` | Optional | Seat grid + show info |
| POST | `/select-seats` | User | Reserve seats (transaction, max per booking) |
| POST | `/book` | User | Create booking from current reservation |
| GET | `/my-bookings` | User | Current user’s bookings (show, ticket count, seats, total, status) |
| GET | `/booking/:id` | User/Admin | Booking + seats + payments |
| POST | `/cancel-booking` | User | Cancel confirmed booking, refund (simulated) |
| POST | `/payment` | User | Simulated gateway (`simulate_failure` optional) |
| POST | `/add-movie` | Admin | Add movie (optional `poster_url` https) |
| PUT | `/update-movie` | Admin | Body: `movie_id`, fields… (`poster_url` to change/clear) |
| DELETE | `/delete-movie` | Admin | Query or body: `movie_id` |
| POST | `/add-show` | Admin | Add show + generated seat grid |
| GET | `/admin/bookings` | Admin | All bookings |
| GET | `/admin/theaters` | Admin | Theaters (for show form) |

## Seat selection flow (implemented)

1. Login → browse movies → movie details → choose show → **seat grid**.
2. Available seats are clickable; booked or another user’s reservation is disabled.
3. Selected seats are highlighted; **total price** updates from show `ticket_price`.
4. **Reserve selection** calls `POST /select-seats` (row locks, prevents double booking).
5. **Create booking & pay** calls `POST /book`, then redirect to payment.
6. **Pay** calls `POST /payment`; failure releases seats and marks booking `payment_failed`.
7. Stale reservations expire after `RESERVATION_TTL_MINUTES` (see `config/constants.js`).

## Setup

### Prerequisites

- Node.js 18+
- MySQL 8+ (server running, user with CREATE privileges)

### 1. Database

```bash
mysql -u root -p < database/schema.sql
```

This creates database `movie_booking` and tables.

If you already have an older database without movie posters, add the column:

```bash
mysql -u root -p movie_booking < database/migration_add_poster_url.sql
```

### Movie posters

Movies store an optional **`poster_url`** (direct `http`/`https` image link). The listing and detail pages show it; if the image fails to load, the UI falls back to the title block. Sample seed data uses royalty-free photos from [Unsplash](https://unsplash.com). Admins can set or change the URL when adding or editing a movie.

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`: set `DB_USER`, `DB_PASSWORD`, `DB_NAME` if different, and a strong `JWT_SECRET` for production.

### 3. Sample data (recommended)

```bash
npm install
npm run seed
```

This wipes dependent rows, resets `AUTO_INCREMENT` on core tables (so IDs line up with the sample shows), and inserts theaters, movies, shows, seats, and two users:

| Email | Password | Role |
|--------|----------|------|
| `admin@movies.com` | `Admin@123` | admin |
| `alex@example.com` | `User@123` | customer |

Alternative (SQL only, after `schema.sql`):

```bash
mysql -u root -p < database/seed.sql
```

Do **not** run `seed.sql` twice without truncating; it will duplicate users (email unique error).

### 4. Run

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) (or the port in `.env`).

- **Customer login (standalone page):** [http://localhost:3000/login.html](http://localhost:3000/login.html)
- **Admin login (separate page):** [http://localhost:3000/admin/login.html](http://localhost:3000/admin/login.html)

Customer flow: home → details → seats → reserve → create booking → payment → confirmation (cancel/refund from confirmation when status is `confirmed`). Admins sign in on the admin login page, then open the [dashboard](http://localhost:3000/admin/dashboard.html).

## Simulated payment

On the payment page, check **Simulate payment failure** to trigger a failed payment (HTTP 402 + seats released). Unchecked completes payment and confirms the booking.

## Error handling (examples)

- **Invalid login:** `401` with message from `/login`.
- **Seat conflict:** `409` from `/select-seats` if another booking/reservation wins the race.
- **Payment failure:** `402` from `/payment` when simulated failure is enabled.

## License

Educational / demonstration use.
