const express = require('express');
const router = express.Router();
const { runSetup } = require('../controllers/setupController');

router.get('/setup', runSetup);

module.exports = router;
