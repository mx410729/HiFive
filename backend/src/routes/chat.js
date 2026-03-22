const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateToken = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Protect all chat routes

router.get('/sessions', chatController.getConversations);
router.post('/sessions', chatController.createSession);
router.get('/:conversationId/history', chatController.getChatHistory);

module.exports = router;
