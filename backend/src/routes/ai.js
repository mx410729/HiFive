const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.get('/icebreaker', aiController.getIcebreaker);

module.exports = router;
