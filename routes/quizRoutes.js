const express = require('express');
const router = express.Router();
const { getAllQuizzes, getQuizzesByChapter, getExamQuestions, submitQuiz, createQuiz, updateQuiz, deleteQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Quizzes
 *     description: Quiz management and exam simulation endpoints
 */

/**
 * @swagger
 * /api/quizzes:
 *   get:
 *     summary: Get all quizzes grouped by chapter
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quizzes grouped by chapter title
 */
router.get('/', protect, getAllQuizzes);

/**
 * @swagger
 * /api/quizzes/exam:
 *   get:
 *     summary: Get 10 random exam simulation questions
 *     description: Returns questions without correct answers for exam mode
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of 10 random questions
 */
router.get('/exam', protect, getExamQuestions);

/**
 * @swagger
 * /api/quizzes/chapter/{chapterTitle}:
 *   get:
 *     summary: Get quizzes for a specific chapter
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterTitle
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter title (e.g. "Traffic Signs")
 *     responses:
 *       200:
 *         description: List of quiz questions for the chapter
 *       404:
 *         description: No quizzes found for this chapter
 */
router.get('/chapter/:chapterTitle', protect, getQuizzesByChapter);

/**
 * @swagger
 * /api/quizzes/submit:
 *   post:
 *     summary: Submit quiz answers and get score
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - selectedAnswer
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       example: "60f7b2c5e1b2c3d4e5f6a7b8"
 *                     selectedAnswer:
 *                       type: string
 *                       example: "Stop completely"
 *     responses:
 *       200:
 *         description: Quiz results with score and per-question feedback
 *       400:
 *         description: Answers array is required
 */
router.post('/submit', protect, submitQuiz);

/**
 * @swagger
 * /api/quizzes:
 *   post:
 *     summary: Create a new quiz question (Admin only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - options
 *               - correctAnswer
 *               - chapterTitle
 *             properties:
 *               question:
 *                 type: string
 *                 example: "What does a yellow triangle sign indicate?"
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Warning", "Stop", "Speed limit", "Parking"]
 *               correctAnswer:
 *                 type: string
 *                 example: "Warning"
 *               chapterTitle:
 *                 type: string
 *                 example: "Traffic Signs"
 *               explanation:
 *                 type: string
 *                 example: "Yellow triangle signs are warning signs."
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 example: "easy"
 *     responses:
 *       201:
 *         description: Quiz question created
 *       403:
 *         description: Admin only
 */
router.post('/', protect, adminOnly, createQuiz);

/**
 * @swagger
 * /api/quizzes/{id}:
 *   put:
 *     summary: Update a quiz question (Admin only)
 *     tags: [Quizzes]
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
 *               question:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correctAnswer:
 *                 type: string
 *               chapterTitle:
 *                 type: string
 *               explanation:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *     responses:
 *       200:
 *         description: Quiz question updated
 *       404:
 *         description: Quiz question not found
 */
router.put('/:id', protect, adminOnly, updateQuiz);

/**
 * @swagger
 * /api/quizzes/{id}:
 *   delete:
 *     summary: Delete a quiz question (Admin only)
 *     tags: [Quizzes]
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
 *         description: Quiz question deleted
 *       404:
 *         description: Quiz question not found
 */
router.delete('/:id', protect, adminOnly, deleteQuiz);

module.exports = router;
