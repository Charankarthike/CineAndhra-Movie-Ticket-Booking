const express = require('express');
const {
  addMovie,
  updateMovie,
  deleteMovie,
  addShow,
  listBookings,
  listTheaters,
} = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

const router = express.Router();
const guard = [auth(true), adminOnly];

router.post('/add-movie', guard, addMovie);
router.put('/update-movie', guard, updateMovie);
router.delete('/delete-movie', guard, deleteMovie);
router.post('/add-show', guard, addShow);
router.get('/admin/bookings', guard, listBookings);
router.get('/admin/theaters', guard, listTheaters);

module.exports = router;
