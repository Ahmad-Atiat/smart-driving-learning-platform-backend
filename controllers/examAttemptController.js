const examAttemptService = require('../services/examAttemptService');

// POST /api/exam-attempts/start
// Always creates a new attempt with freshly-randomised questions.
// Expires any existing active attempt before creating the new one.
const startAttempt = async (req, res, next) => {
    try {
        const result = await examAttemptService.startAttempt(req.user._id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// GET /api/exam-attempts/active
// Resume path: returns the current active in-progress attempt or 404 if none.
// Frontend should call /start when this returns 404.
const getActiveAttempt = async (req, res, next) => {
    try {
        const result = await examAttemptService.getActiveAttempt(req.user._id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// PATCH /api/exam-attempts/:attemptId/answer
// Save or overwrite the answer for a single question while the exam is running.
const saveAnswer = async (req, res, next) => {
    try {
        const result = await examAttemptService.saveAnswer(req.user._id, req.params.attemptId, req.body);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// POST /api/exam-attempts/:attemptId/submit
// Score and finalise the attempt. Idempotent: safe to call more than once.
const submitAttempt = async (req, res, next) => {
    try {
        const result = await examAttemptService.submitAttempt(req.user._id, req.params.attemptId);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// GET /api/exam-attempts/history
// Returns all submitted and expired attempts for the authenticated user.
const getHistory = async (req, res, next) => {
    try {
        const result = await examAttemptService.getHistory(req.user._id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// GET /api/exam-attempts/:attemptId
// Full detail of a finalised attempt including correct answers and per-question results.
const getAttemptById = async (req, res, next) => {
    try {
        const result = await examAttemptService.getAttemptById(req.user._id, req.params.attemptId);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    startAttempt,
    getActiveAttempt,
    saveAnswer,
    submitAttempt,
    getHistory,
    getAttemptById
};
