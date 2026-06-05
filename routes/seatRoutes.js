const express = require('express');
const { listSeats, selectSeats } = require('../controllers/seatController');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.get('/seats/:show_id', auth(false), listSeats);
router.post('/select-seats', auth(true), selectSeats);

module.exports = router;
