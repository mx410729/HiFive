const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Protect API

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/search', userController.searchUsers);
router.delete('/profile', userController.deleteAccount);

module.exports = router;
