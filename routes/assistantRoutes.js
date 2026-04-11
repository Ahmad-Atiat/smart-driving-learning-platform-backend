const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/assistantController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Assistant
 *     description: AI-powered driving education assistant
 */

/**
 * @swagger
 * /api/assistant/chat:
 *   post:
 *     summary: Send a message to the AI driving assistant
 *     description: Powered by Google Gemini AI. Only answers driving-related questions.
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "What does a stop sign mean?"
 *               conversationHistory:
 *                 type: array
 *                 description: Previous messages for context (optional)
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: AI assistant response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   example: "A stop sign means you must bring your vehicle to a complete stop..."
 *       400:
 *         description: Message is required
 *       503:
 *         description: AI assistant not configured
 */
router.post('/chat', protect, chat);

module.exports = router;
