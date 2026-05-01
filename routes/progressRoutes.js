const express = require('express');
const router = express.Router();
const { getProgress, getLessonProgress, completeLessonProgress, getProgressSummary, resetProgress } = require('../controllers/progressController');
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
 * /api/progress/lessons:
 *   get:
 *     summary: Get completed lesson progress for the authenticated user
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Completed lesson entries
 */
router.get('/lessons', protect, getLessonProgress);

/**
 * @swagger
 * /api/progress/lessons/complete:
 *   post:
 *     summary: Mark a chapter sub-lesson as completed
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chapterId
 *               - subLessonIndex
 *             properties:
 *               chapterId:
 *                 type: string
 *               subLessonIndex:
 *                 type: number
 *     responses:
 *       200:
 *         description: Sub-lesson marked as completed
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Lesson or sub-lesson not found
 */
router.post('/lessons/complete', protect, completeLessonProgress);

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
