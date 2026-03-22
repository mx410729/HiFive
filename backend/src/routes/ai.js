const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authenticateToken = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Protect API

router.get('/icebreaker', aiController.getIcebreaker);

module.exports = router;
