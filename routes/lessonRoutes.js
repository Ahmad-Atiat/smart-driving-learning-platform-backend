const express = require('express');
const router = express.Router();
const { getAllLessons, getLessonById, completeSubLesson, createLesson, updateLesson, deleteLesson } = require('../controllers/lessonController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Lessons
 *     description: Lesson/chapter management endpoints
 */

/**
 * @swagger
 * /api/lessons:
 *   get:
 *     summary: Get all lessons (chapters)
 *     description: Students see published lessons only. Admins see all.
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of lessons
 *       401:
 *         description: Not authorized
 */
router.get('/', protect, getAllLessons);

/**
 * @swagger
 * /api/lessons/{id}:
 *   get:
 *     summary: Get a single lesson by ID
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Lesson details with sub-lessons
 *       404:
 *         description: Lesson not found
 */
router.get('/:id', protect, getLessonById);

/**
 * @swagger
 * /api/lessons/{id}/complete:
 *   post:
 *     summary: Mark a sub-lesson as completed
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson (chapter) ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subLessonTitle
 *             properties:
 *               subLessonTitle:
 *                 type: string
 *                 example: "Warning Signs"
 *     responses:
 *       200:
 *         description: Sub-lesson marked as completed
 *       400:
 *         description: subLessonTitle is required
 *       404:
 *         description: Lesson or sub-lesson not found
 */
router.post('/:id/complete', protect, completeSubLesson);

/**
 * @swagger
 * /api/lessons:
 *   post:
 *     summary: Create a new lesson (Admin only)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - order
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Parking Rules"
 *               description:
 *                 type: string
 *                 example: "Learn proper parking techniques"
 *               order:
 *                 type: number
 *                 example: 6
 *               isPublished:
 *                 type: boolean
 *                 example: true
 *               lessons:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *     responses:
 *       201:
 *         description: Lesson created
 *       403:
 *         description: Admin only
 */
router.post('/', protect, adminOnly, createLesson);

/**
 * @swagger
 * /api/lessons/{id}:
 *   put:
 *     summary: Update a lesson (Admin only)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               order:
 *                 type: number
 *               isPublished:
 *                 type: boolean
 *               lessons:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Lesson updated
 *       404:
 *         description: Lesson not found
 */
router.put('/:id', protect, adminOnly, updateLesson);

/**
 * @swagger
 * /api/lessons/{id}:
 *   delete:
 *     summary: Delete a lesson (Admin only)
 *     tags: [Lessons]
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
 *         description: Lesson deleted
 *       404:
 *         description: Lesson not found
 */
router.delete('/:id', protect, adminOnly, deleteLesson);

module.exports = router;
