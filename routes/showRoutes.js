const express = require('express');
const { listShowsForMovie } = require('../controllers/showController');

const router = express.Router();
router.get('/shows/:movie_id', listShowsForMovie);

module.exports = router;
