const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');

router.post('/api/ai/chat', chatWithAI);

module.exports = router;
