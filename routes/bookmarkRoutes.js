const express = require('express');
const router = express.Router();
const {
    listBookmarks,
    createBookmark,
    deleteBookmark,
    deleteBookmarkByLocation
} = require('../controllers/bookmarkController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Bookmarks
 *     description: User lesson bookmark endpoints
 */

/**
 * @swagger
 * /api/lessons/bookmarks:
 *   get:
 *     summary: List the authenticated user's lesson bookmarks
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of bookmarks (most recent first)
 */
router.get('/', protect, listBookmarks);

/**
 * @swagger
 * /api/lessons/bookmarks:
 *   post:
 *     summary: Add a lesson bookmark for the authenticated user
 *     tags: [Bookmarks]
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
 *       201:
 *         description: Bookmark created (or returned if it already exists)
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Lesson or sub-lesson not found
 */
router.post('/', protect, createBookmark);

/**
 * @swagger
 * /api/lessons/bookmarks:
 *   delete:
 *     summary: Remove a bookmark by chapter + subLessonIndex
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: subLessonIndex
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Bookmark removed
 *       404:
 *         description: Bookmark not found
 */
router.delete('/', protect, deleteBookmarkByLocation);

/**
 * @swagger
 * /api/lessons/bookmarks/{id}:
 *   delete:
 *     summary: Remove a bookmark by id
 *     tags: [Bookmarks]
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
 *       404:
 *         description: Bookmark not found
 */
router.delete('/:id', protect, deleteBookmark);

module.exports = router;
