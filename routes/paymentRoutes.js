const express = require('express');
const { pay } = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.post('/payment', auth(true), pay);

module.exports = router;
