const chapterQuizProgressService = require('../services/chapterQuizProgressService');

// GET /api/chapter-quiz-progress/:chapterTitle
// Returns saved progress for the authenticated user and chapter.
// Returns an empty-progress shape (exists: false) when no record exists.
const getProgress = async (req, res, next) => {
    try {
        const result = await chapterQuizProgressService.getProgress(
            req.user._id,
            req.params.chapterTitle
        );
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// POST /api/chapter-quiz-progress/:chapterTitle/start
// Resumes an existing in-progress session or creates a new one.
// Response includes a `resumed` boolean so the frontend knows which path was taken.
const startOrResume = async (req, res, next) => {
    try {
        const result = await chapterQuizProgressService.startOrResume(
            req.user._id,
            req.params.chapterTitle
        );
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// PATCH /api/chapter-quiz-progress/:chapterTitle/answer
// Saves the user's answer and returns instant feedback (isCorrect + explanation).
const saveAnswer = async (req, res, next) => {
    try {
        const result = await chapterQuizProgressService.saveAnswer(
            req.user._id,
            req.params.chapterTitle,
            req.body
        );
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// PATCH /api/chapter-quiz-progress/:chapterTitle/position
// Saves the current question index so the user can resume at the same place.
const savePosition = async (req, res, next) => {
    try {
        const result = await chapterQuizProgressService.savePosition(
            req.user._id,
            req.params.chapterTitle,
            req.body
        );
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// POST /api/chapter-quiz-progress/:chapterTitle/complete
// Marks the chapter quiz as completed.
const completeProgress = async (req, res, next) => {
    try {
        const result = await chapterQuizProgressService.completeProgress(
            req.user._id,
            req.params.chapterTitle
        );
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProgress,
    startOrResume,
    saveAnswer,
    savePosition,
    completeProgress
};
