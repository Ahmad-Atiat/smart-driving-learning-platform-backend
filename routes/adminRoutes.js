const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');
const { getAllUsers, deleteUser, updateUser } = require('../controllers/userController');
const { uploadDocument, getAllDocuments, deleteDocument } = require('../controllers/documentController');
const { getDashboardStats, getChapterReport, getRecentActivity } = require('../controllers/dashboardController');

// ========================
// USER MANAGEMENT ROUTES
// ========================

/**
 * @swagger
 * tags:
 *   - name: Admin - Users
 *     description: Admin user management endpoints
 *   - name: Admin - Documents
 *     description: Admin document/knowledge base management
 *   - name: Admin - Dashboard
 *     description: Admin dashboard and reporting endpoints
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users
 *     description: Returns all registered users (passwords excluded). Admin only.
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of user objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "664a1b2c3d4e5f6a7b8c9d0e"
 *                   name:
 *                     type: string
 *                     example: "Student User"
 *                   email:
 *                     type: string
 *                     example: "student@driving.com"
 *                   role:
 *                     type: string
 *                     enum: [student, admin]
 *                     example: "student"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Not authorized — missing or invalid token
 *       403:
 *         description: Forbidden — admin only
 */
router.get('/users', protect, adminOnly, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update a user's email or password
 *     description: Admin can change any user's email and/or password. Provide at least one field.
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to update
 *         example: "664a1b2c3d4e5f6a7b8c9d0f"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: New email address (optional)
 *                 example: "newemail@example.com"
 *               password:
 *                 type: string
 *                 description: New password, min 6 characters (optional)
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Updated user object (password excluded)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "664a1b2c3d4e5f6a7b8c9d0f"
 *                 name:
 *                   type: string
 *                   example: "Student User"
 *                 email:
 *                   type: string
 *                   example: "newemail@example.com"
 *                 role:
 *                   type: string
 *                   example: "student"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: "Validation error: email already in use, password too short, or no fields provided"
 *       404:
 *         description: User not found
 */
router.put('/users/:id', protect, adminOnly, updateUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes the user and their progress data. Cannot delete the primary admin (admin@driving.com).
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *         example: "664a1b2c3d4e5f6a7b8c9d0f"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       403:
 *         description: Cannot delete the primary admin account
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', protect, adminOnly, deleteUser);

// ========================
// DOCUMENT MANAGEMENT ROUTES
// ========================

/**
 * @swagger
 * /api/admin/documents:
 *   post:
 *     summary: Upload a document for AI knowledge base
 *     description: |
 *       Upload a PDF, DOC, DOCX, or TXT file (max 10MB). The AI assistant will extract
 *       text from this document and use it as reference material when answering student questions.
 *     tags: [Admin - Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "Allowed types: PDF, DOC, DOCX, TXT. Max size: 10MB."
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "665a1b2c3d4e5f6a7b8c9d10"
 *                 filename:
 *                   type: string
 *                   example: "1713000000000-traffic-law.pdf"
 *                 originalName:
 *                   type: string
 *                   example: "traffic-law.pdf"
 *                 mimeType:
 *                   type: string
 *                   example: "application/pdf"
 *                 size:
 *                   type: number
 *                   example: 1245678
 *                 path:
 *                   type: string
 *                   example: "uploads/1713000000000-traffic-law.pdf"
 *                 uploadedBy:
 *                   type: string
 *                   example: "664a1b2c3d4e5f6a7b8c9d0e"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: "No file uploaded, invalid file type, or file exceeds 10MB"
 *       403:
 *         description: Admin only
 */
router.post('/documents', protect, adminOnly, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File size exceeds 10MB limit' });
            }
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, uploadDocument);

/**
 * @swagger
 * /api/admin/documents:
 *   get:
 *     summary: List all uploaded documents
 *     description: Returns all documents in the AI knowledge base with uploader info.
 *     tags: [Admin - Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of document objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "665a1b2c3d4e5f6a7b8c9d10"
 *                   filename:
 *                     type: string
 *                     example: "1713000000000-traffic-law.pdf"
 *                   originalName:
 *                     type: string
 *                     example: "traffic-law.pdf"
 *                   mimeType:
 *                     type: string
 *                     example: "application/pdf"
 *                   size:
 *                     type: number
 *                     example: 1245678
 *                   path:
 *                     type: string
 *                     example: "uploads/1713000000000-traffic-law.pdf"
 *                   uploadedBy:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "664a1b2c3d4e5f6a7b8c9d0e"
 *                       name:
 *                         type: string
 *                         example: "Admin User"
 *                       email:
 *                         type: string
 *                         example: "admin@driving.com"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       403:
 *         description: Admin only
 */
router.get('/documents', protect, adminOnly, getAllDocuments);

/**
 * @swagger
 * /api/admin/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     description: Removes the document from the database AND deletes the file from disk. The AI will no longer use this document.
 *     tags: [Admin - Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID to delete
 *         example: "665a1b2c3d4e5f6a7b8c9d10"
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Document deleted successfully"
 *       404:
 *         description: Document not found
 */
router.delete('/documents/:id', protect, adminOnly, deleteDocument);

// ========================
// DASHBOARD ROUTES
// ========================

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get platform overview statistics
 *     description: |
 *       Returns aggregated platform statistics including user counts, content stats,
 *       progress averages and distribution, quiz performance metrics, and document counts.
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       example: 150
 *                       description: Total registered users
 *                     students:
 *                       type: number
 *                       example: 148
 *                       description: Users with role student
 *                     admins:
 *                       type: number
 *                       example: 2
 *                       description: Users with role admin
 *                 content:
 *                   type: object
 *                   properties:
 *                     totalChapters:
 *                       type: number
 *                       example: 5
 *                       description: Published lesson chapters
 *                     totalSubLessons:
 *                       type: number
 *                       example: 15
 *                       description: Total sub-lessons across all chapters
 *                     totalQuizQuestions:
 *                       type: number
 *                       example: 22
 *                     questionsByDifficulty:
 *                       type: object
 *                       properties:
 *                         easy:
 *                           type: number
 *                           example: 11
 *                         medium:
 *                           type: number
 *                           example: 9
 *                         hard:
 *                           type: number
 *                           example: 2
 *                 progress:
 *                   type: object
 *                   properties:
 *                     averageProgress:
 *                       type: number
 *                       example: 42
 *                       description: "Average overall progress percentage (0-100)"
 *                     completionRate:
 *                       type: number
 *                       example: 15
 *                       description: "Percentage of students with 76-100% progress"
 *                     progressDistribution:
 *                       type: object
 *                       properties:
 *                         "0-25":
 *                           type: number
 *                           example: 60
 *                         "26-50":
 *                           type: number
 *                           example: 40
 *                         "51-75":
 *                           type: number
 *                           example: 30
 *                         "76-100":
 *                           type: number
 *                           example: 20
 *                 quizzes:
 *                   type: object
 *                   properties:
 *                     totalAttempts:
 *                       type: number
 *                       example: 320
 *                       description: Total quiz submissions across all users
 *                     averageScore:
 *                       type: number
 *                       example: 68
 *                       description: Average quiz score
 *                     passRate:
 *                       type: number
 *                       example: 72
 *                       description: "Percentage of attempts scoring >= 70%"
 *                 documents:
 *                   type: object
 *                   properties:
 *                     totalDocuments:
 *                       type: number
 *                       example: 3
 *                     totalSize:
 *                       type: number
 *                       example: 2450000
 *                       description: Total file size in bytes
 *       403:
 *         description: Admin only
 */
router.get('/dashboard/stats', protect, adminOnly, getDashboardStats);

/**
 * @swagger
 * /api/admin/dashboard/chapters:
 *   get:
 *     summary: Get per-chapter analytics report
 *     description: |
 *       Returns completion rates and quiz statistics for each published chapter.
 *       Useful for identifying which chapters students struggle with.
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of chapter report objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   chapterTitle:
 *                     type: string
 *                     example: "Basic Driving Skills"
 *                   totalSubLessons:
 *                     type: number
 *                     example: 3
 *                   completionRate:
 *                     type: number
 *                     example: 65
 *                     description: "Percentage of students who completed ALL sub-lessons"
 *                   quizStats:
 *                     type: object
 *                     properties:
 *                       totalQuestions:
 *                         type: number
 *                         example: 4
 *                         description: Quiz questions available for this chapter
 *                       totalAttempts:
 *                         type: number
 *                         example: 80
 *                       averageScore:
 *                         type: number
 *                         example: 72
 *                       passRate:
 *                         type: number
 *                         example: 78
 *                         description: "Percentage of attempts scoring >= 70%"
 *       403:
 *         description: Admin only
 */
router.get('/dashboard/chapters', protect, adminOnly, getChapterReport);

/**
 * @swagger
 * /api/admin/dashboard/activity:
 *   get:
 *     summary: Get recent platform activity
 *     description: Returns the 10 most recent user signups and 10 most recent quiz attempts.
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recentUsers:
 *                   type: array
 *                   description: Last 10 registered users (newest first)
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "664a1b2c3d4e5f6a7b8c9d20"
 *                       name:
 *                         type: string
 *                         example: "Lina Hassan"
 *                       email:
 *                         type: string
 *                         example: "lina@example.com"
 *                       role:
 *                         type: string
 *                         example: "student"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 recentQuizAttempts:
 *                   type: array
 *                   description: Last 10 quiz submissions with user info
 *                   items:
 *                     type: object
 *                     properties:
 *                       userName:
 *                         type: string
 *                         example: "Lina Hassan"
 *                       userEmail:
 *                         type: string
 *                         example: "lina@example.com"
 *                       chapterTitle:
 *                         type: string
 *                         example: "Traffic Signs"
 *                       score:
 *                         type: number
 *                         example: 4
 *                         description: Number of correct answers
 *                       totalQuestions:
 *                         type: number
 *                         example: 5
 *                       date:
 *                         type: string
 *                         format: date-time
 *       403:
 *         description: Admin only
 */
router.get('/dashboard/activity', protect, adminOnly, getRecentActivity);

module.exports = router;
