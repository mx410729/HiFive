const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Protect API

router.get('/search', userController.searchUsers);

module.exports = router;
