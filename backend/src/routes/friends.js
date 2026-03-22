const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const authenticateToken = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Protect API

router.post('/request', friendController.sendRequest);
router.post('/accept', friendController.acceptRequest);
router.post('/decline', friendController.declineRequest);
router.post('/unfriend', friendController.unfriend);
router.get('/', friendController.getFriends);

module.exports = router;
