const express = require('express');
const router = express.Router();
const {
    getChapterBookmarks,
    toggleBookmark,
    deleteBookmark
} = require('../controllers/quizBookmarkController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: QuizBookmarks
 *     description: Chapter quiz bookmark endpoints
 */

/**
 * @swagger
 * /api/quiz-bookmarks/toggle:
 *   post:
 *     summary: Toggle a chapter quiz bookmark for the authenticated user
 *     tags: [QuizBookmarks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chapterKey
 *               - questionId
 *             properties:
 *               chapterKey:
 *                 type: string
 *                 description: chapterKey or chapter title
 *               questionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Toggle result with new bookmarked state
 */
router.post('/toggle', protect, toggleBookmark);

/**
 * @swagger
 * /api/quiz-bookmarks/{id}:
 *   delete:
 *     summary: Remove a chapter quiz bookmark by id
 *     tags: [QuizBookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bookmark removed
 */
router.delete('/:id', protect, deleteBookmark);

/**
 * @swagger
 * /api/quiz-bookmarks/{chapterKey}:
 *   get:
 *     summary: List chapter quiz bookmarks for the authenticated user (for one chapter)
 *     tags: [QuizBookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterKey
 *         required: true
 *         description: chapterKey or chapter title
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of bookmarks for this chapter
 */
router.get('/:chapterKey', protect, getChapterBookmarks);

module.exports = router;
