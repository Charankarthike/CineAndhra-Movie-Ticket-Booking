const express = require('express');
const {
  createBooking,
  getBooking,
  cancelBooking,
  listMyBookings,
} = require('../controllers/bookingController');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.get('/my-bookings', auth(true), listMyBookings);
router.post('/book', auth(true), createBooking);
router.get('/booking/:id', auth(true), getBooking);
router.post('/cancel-booking', auth(true), cancelBooking);

module.exports = router;
