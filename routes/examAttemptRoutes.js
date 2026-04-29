const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    startAttempt,
    getActiveAttempt,
    saveAnswer,
    submitAttempt,
    getHistory,
    getAttemptById
} = require('../controllers/examAttemptController');

// Start a brand-new exam (always creates a fresh attempt, never resumes)
router.post('/start', protect, startAttempt);

// Resume an existing in-progress attempt; returns 404 when none is active
router.get('/active', protect, getActiveAttempt);

// Save or overwrite the answer to a single question mid-exam
router.patch('/:attemptId/answer', protect, saveAnswer);

// Score and finalise the attempt; idempotent
router.post('/:attemptId/submit', protect, submitAttempt);

// List all past (submitted/expired) attempts for the authenticated user
// Must be defined before /:attemptId so Express does not treat 'history' as an id
router.get('/history', protect, getHistory);

// Full detail of a specific finalised attempt (includes correct answers)
router.get('/:attemptId', protect, getAttemptById);

module.exports = router;
