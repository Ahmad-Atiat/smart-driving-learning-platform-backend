const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getProgress,
    startOrResume,
    saveAnswer,
    savePosition,
    completeProgress
} = require('../controllers/chapterQuizProgressController');

// Return the most recent progress for a chapter (or empty shape when none exists)
router.get('/:chapterTitle', protect, getProgress);

// Start a new quiz session or resume the existing in-progress one
router.post('/:chapterTitle/start', protect, startOrResume);

// Save an answer and receive instant feedback (isCorrect + explanation)
router.patch('/:chapterTitle/answer', protect, saveAnswer);

// Persist only the current question index (navigation without answering)
router.patch('/:chapterTitle/position', protect, savePosition);

// Mark the quiz session as completed
router.post('/:chapterTitle/complete', protect, completeProgress);

module.exports = router;
