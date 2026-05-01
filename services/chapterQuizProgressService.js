const mongoose = require('mongoose');
const chapterQuizProgressRepository = require('../repositories/chapterQuizProgressRepository');
const quizRepository = require('../repositories/quizRepository');
const ApiError = require('../utils/apiError');

// ---------------------------------------------------------------------------
// Input normalisation helpers (same contract as examAttemptService)
// ---------------------------------------------------------------------------

const ensureValidObjectId = (id, message) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, message);
    }
};

// Accept numeric indices and digit-only strings; everything else → null
const normalizeIndex = (value) => {
    if (typeof value === 'number' && Number.isInteger(value)) return value;
    if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
    return null;
};

// Trim strings; return null for empty / non-string input
const normalizeText = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};

// ---------------------------------------------------------------------------
// Correctness check
// ---------------------------------------------------------------------------

// Evaluates whether the user's answer matches the stored correct answer using:
//   1. Index-based match  (option at selectedIndex equals correctAnswer text)
//   2. Direct text match  (English or Arabic)
//   3. Cross-language     (Arabic text maps to the same index as the English correct option)
const checkCorrectness = (question, { selectedAnswer, selectedAnswerAR, selectedIndex }) => {
    const options = Array.isArray(question.options) ? question.options : [];
    const optionsAR = Array.isArray(question.optionsAR) ? question.optionsAR : [];
    const correctAnswer = question.correctAnswer || null;
    const correctAnswerAR = question.correctAnswerAR || null;

    const idx = normalizeIndex(selectedIndex);
    const answerText = normalizeText(selectedAnswer);
    const answerTextAR = normalizeText(selectedAnswerAR);

    // 1) Index-based
    if (idx !== null) {
        const optEng = options[idx];
        const optAR = optionsAR[idx];
        if (optEng && correctAnswer && optEng === correctAnswer) return true;
        if (optAR && correctAnswerAR && optAR === correctAnswerAR) return true;
    }

    // 2) Direct text match in either language
    if (answerText && correctAnswer && answerText === correctAnswer) return true;
    if (answerTextAR && correctAnswerAR && answerTextAR === correctAnswerAR) return true;

    // 3) Cross-language: Arabic answer at the same index as the English correct answer
    if (answerTextAR && correctAnswer && options.length && optionsAR.length) {
        const correctIdx = options.indexOf(correctAnswer);
        if (correctIdx !== -1 && optionsAR[correctIdx] && answerTextAR === optionsAR[correctIdx]) return true;
    }

    return false;
};

// ---------------------------------------------------------------------------
// Response builder
// ---------------------------------------------------------------------------

// Produces a consistent shape for all endpoints that return a progress object.
// Includes both _id and id (string alias) so the frontend can use either.
const buildProgressResponse = (progress) => ({
    _id: progress._id,
    id: progress._id.toString(),
    chapterTitle: progress.chapterTitle,
    currentQuestionIndex: progress.currentQuestionIndex,
    answers: progress.answers || [],
    status: progress.status,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt ?? null
});

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

// GET /:chapterTitle
// Returns the most recent progress record for this user+chapter.
// Returns an empty-progress shape (exists: false) when no record exists so the
// frontend always receives a consistent object.
const getProgress = async (userId, chapterTitle) => {
    const progress = await chapterQuizProgressRepository.findLatestByUserAndChapter(userId, chapterTitle);

    if (!progress) {
        return {
            exists: false,
            chapterTitle,
            currentQuestionIndex: 0,
            answers: [],
            status: null,
            startedAt: null,
            completedAt: null
        };
    }

    return { exists: true, ...buildProgressResponse(progress) };
};

// POST /:chapterTitle/start
// Returns the existing in-progress record when one is found (resume path).
// Creates a fresh record when no in-progress session exists (new or after completion).
const startOrResume = async (userId, chapterTitle) => {
    const inProgress = await chapterQuizProgressRepository.findInProgressByUserAndChapter(userId, chapterTitle);
    if (inProgress) {
        return { resumed: true, ...buildProgressResponse(inProgress) };
    }

    const created = await chapterQuizProgressRepository.create({
        user: userId,
        chapterTitle,
        startedAt: new Date()
    });

    return { resumed: false, ...buildProgressResponse(created) };
};

// PATCH /:chapterTitle/answer
// Saves (or overwrites) the user's answer for a question, evaluates correctness
// immediately, and returns the feedback fields so the frontend can display the
// explanation without a second request.
const saveAnswer = async (userId, chapterTitle, payload) => {
    const progress = await chapterQuizProgressRepository.findInProgressByUserAndChapter(userId, chapterTitle);
    if (!progress) {
        throw new ApiError(404, 'No in-progress quiz found for this chapter. Call /start first.');
    }

    const questionId = payload?.questionId;
    ensureValidObjectId(questionId, 'Invalid question id');

    // Full question needed for correctness evaluation and feedback fields
    const question = await quizRepository.findById(questionId);
    if (!question) {
        throw new ApiError(404, 'Question not found');
    }

    const selectedAnswer = normalizeText(payload?.selectedAnswer);
    const selectedAnswerAR = normalizeText(payload?.selectedAnswerAR);
    const selectedIndex = normalizeIndex(payload?.selectedIndex);

    // currentQuestionIndex may be sent alongside the answer; default to existing value
    const currentQuestionIndex =
        normalizeIndex(payload?.currentQuestionIndex) ?? progress.currentQuestionIndex;

    const isCorrect = checkCorrectness(question, { selectedAnswer, selectedAnswerAR, selectedIndex });

    const answerPayload = {
        questionId,
        selectedAnswer,
        selectedAnswerAR,
        selectedIndex,
        isCorrect,
        answeredAt: new Date()
    };

    // Overwrite the existing answer for this question; append if first attempt
    const existingIndex = progress.answers.findIndex(
        (a) => a.questionId.toString() === questionId.toString()
    );

    if (existingIndex >= 0) {
        progress.answers[existingIndex] = {
            ...progress.answers[existingIndex].toObject(),
            ...answerPayload
        };
    } else {
        progress.answers.push(answerPayload);
    }

    await chapterQuizProgressRepository.updateById(progress._id, {
        chapterTitle: progress.chapterTitle || chapterTitle,
        answers: progress.answers,
        currentQuestionIndex
    });

    // Instant feedback: return all fields the frontend needs to render the
    // explanation panel immediately after the user submits their answer.
    return {
        isCorrect,
        correctAnswer: question.correctAnswer || null,
        correctAnswerAR: question.correctAnswerAR || null,
        explanation: question.explanation || null,
        explanationAR: question.explanationAR || null
    };
};

// PATCH /:chapterTitle/position
// Persists only the question index (e.g. when the user navigates without answering).
const savePosition = async (userId, chapterTitle, payload) => {
    const progress = await chapterQuizProgressRepository.findInProgressByUserAndChapter(userId, chapterTitle);
    if (!progress) {
        throw new ApiError(404, 'No in-progress quiz found for this chapter');
    }

    const currentQuestionIndex = normalizeIndex(payload?.currentQuestionIndex);
    if (currentQuestionIndex === null || currentQuestionIndex < 0) {
        throw new ApiError(400, 'currentQuestionIndex must be a non-negative integer');
    }

    await chapterQuizProgressRepository.updateById(progress._id, {
        chapterTitle: progress.chapterTitle || chapterTitle,
        currentQuestionIndex
    });

    return { message: 'Position saved' };
};

// POST /:chapterTitle/complete
// Transitions the in-progress record to completed and records the timestamp.
const completeProgress = async (userId, chapterTitle) => {
    const progress = await chapterQuizProgressRepository.findInProgressByUserAndChapter(userId, chapterTitle);
    if (!progress) {
        throw new ApiError(404, 'No in-progress quiz found for this chapter');
    }

    const updated = await chapterQuizProgressRepository.updateById(progress._id, {
        chapterTitle: progress.chapterTitle || chapterTitle,
        status: 'completed',
        completedAt: new Date()
    });

    // Guard: updateById returns null when the document was removed between the
    // ownership check and the update.
    if (!updated) {
        throw new ApiError(404, 'Progress record not found');
    }

    return buildProgressResponse(updated);
};

module.exports = {
    getProgress,
    startOrResume,
    saveAnswer,
    savePosition,
    completeProgress
};
