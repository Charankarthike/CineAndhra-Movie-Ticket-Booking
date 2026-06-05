const express = require('express');
const { listMovies, getMovie } = require('../controllers/movieController');

const router = express.Router();
router.get('/movies', listMovies);
router.get('/movies/:id', getMovie);

module.exports = router;
