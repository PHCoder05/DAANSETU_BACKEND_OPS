const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/chat/history/{recipientId}:
 *   get:
 *     summary: Get chat history with a user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat history retrieved
 */
router.get('/history/:recipientId', authenticate, chatController.getChatHistory);

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get list of conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/conversations', authenticate, chatController.getConversations);

module.exports = router;
