const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/sessions', chatController.getConversations);
router.post('/sessions', chatController.createSession);
router.get('/:conversationId/history', chatController.getChatHistory);

module.exports = router;
