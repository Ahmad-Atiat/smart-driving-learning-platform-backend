const express = require('express');
const router = express.Router();
const { getProgress, getProgressSummary, resetProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Progress
 *     description: User progress tracking endpoints
 */

/**
 * @swagger
 * /api/progress:
 *   get:
 *     summary: Get full progress data for the authenticated user
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User progress document
 */
router.get('/', protect, getProgress);

/**
 * @swagger
 * /api/progress/summary:
 *   get:
 *     summary: Get progress summary with lesson statuses and quiz stats
 *     description: Returns overall progress %, per-lesson status (Not Started/In Progress/Completed), and quiz statistics
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress summary with overallProgress, lessons array, and quizStats
 */
router.get('/summary', protect, getProgressSummary);

/**
 * @swagger
 * /api/progress/reset:
 *   delete:
 *     summary: Reset all progress for the authenticated user
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress reset successfully
 *       404:
 *         description: No progress found to reset
 */
router.delete('/reset', protect, resetProgress);

module.exports = router;
