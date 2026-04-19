const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ApiError = require('../utils/apiError');
const {
    createConversation,
    getConversations,
    getConversationById,
    sendMessage,
    deleteConversation
} = require('../controllers/conversationController');

const conversationUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 2
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'image' && file.mimetype.startsWith('image/')) {
            return cb(null, true);
        }

        if (file.fieldname === 'file' && file.mimetype === 'application/pdf') {
            return cb(null, true);
        }

        if (file.fieldname === 'image') {
            return cb(new ApiError(415, 'Unsupported image type. Please upload a valid image file.'));
        }

        if (file.fieldname === 'file') {
            return cb(new ApiError(415, 'Unsupported file type. Only PDF files are supported.'));
        }

        return cb(new ApiError(400, `Unexpected upload field: ${file.fieldname}`));
    }
});

const handleConversationUpload = (req, res, next) => {
    const uploadFields = conversationUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'file', maxCount: 1 }
    ]);

    uploadFields(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return next(new ApiError(400, 'Uploaded file is too large. Maximum size is 10 MB.'));
            }

            if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                return next(new ApiError(400, `Unexpected upload field: ${error.field || 'unknown'}`));
            }

            return next(new ApiError(400, error.message));
        }

        return next(error);
    });
};

/**
 * @swagger
 * tags:
 *   - name: Conversations
 *     description: Persistent AI conversation endpoints
 */

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Road signs practice"
 *     responses:
 *       201:
 *         description: Conversation created
 */
router.post('/', protect, createConversation);

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get all conversations for authenticated user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/', protect, getConversations);

/**
 * @swagger
 * /api/conversations/{id}:
 *   get:
 *     summary: Get one conversation by id
 *     tags: [Conversations]
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
 *         description: Conversation details
 */
router.get('/:id', protect, getConversationById);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   post:
 *     summary: Send a message to the assistant in a specific conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               file:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assistant response and updated conversation
 */
router.post('/:id/messages', protect, handleConversationUpload, sendMessage);

/**
 * @swagger
 * /api/conversations/{id}:
 *   delete:
 *     summary: Delete a conversation
 *     tags: [Conversations]
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
 *         description: Conversation deleted
 */
router.delete('/:id', protect, deleteConversation);

module.exports = router;
