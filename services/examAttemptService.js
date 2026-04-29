const mongoose = require('mongoose');
const examAttemptRepository = require('../repositories/examAttemptRepository');
const quizRepository = require('../repositories/quizRepository');
const quizService = require('./quizService');
const ApiError = require('../utils/apiError');

// Duration of a single exam session: 60 minutes
const EXAM_DURATION_MS = 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Guards & small helpers
// ---------------------------------------------------------------------------

const ensureValidObjectId = (id, message) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, message);
    }
};

// Returns true when the attempt's expiry timestamp is in the past
const isExpired = (attempt, now = new Date()) => {
    if (!attempt?.expiresAt) return false;
    return attempt.expiresAt.getTime() <= now.getTime();
};

// Coerce a value to an integer index or null (accepts numbers and digit-only strings)
const normalizeIndex = (value) => {
    if (typeof value === 'number' && Number.isInteger(value)) return value;
    if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
    return null;
};

// Trim a string value; return null for empty or non-string input
const normalizeText = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};

// Safe option lookup that returns undefined for out-of-range indices
const getOptionByIndex = (options, idx) => {
    if (!Array.isArray(options)) return undefined;
    if (idx < 0 || idx >= options.length) return undefined;
    return options[idx];
};

// ---------------------------------------------------------------------------
// Response shape helpers
// ---------------------------------------------------------------------------

// Every attempt response exposes both _id (ObjectId, serialised as string by
// Express) and id (explicit string alias) so the frontend can use either.
// attemptId is kept for backwards compatibility.
const buildAttemptIdentifiers = (attempt) => ({
    _id: attempt?._id ?? null,
    id: attempt?._id ? attempt._id.toString() : null,
    attemptId: attempt?._id ? attempt._id.toString() : null
});

// Question shape sent while the exam is in progress – correct answers are
// intentionally omitted to prevent cheating.
const buildDisplayQuestion = (question) => ({
    _id: question._id,
    question: question.question,
    options: question.options,
    questionAR: question.questionAR || null,
    optionsAR: question.optionsAR || null,
    image: question.image || null,
    video: question.video || null,
    chapterTitle: question.chapterTitle,
    chapterTitleAR: question.chapterTitleAR || null
});

// Preserves the original question order stored in the attempt document because
// MongoDB's $in does not guarantee order.
const buildDisplayQuestions = (questionIds, questions) => {
    const questionMap = {};
    for (const q of questions) {
        questionMap[q._id.toString()] = q;
    }

    const ordered = [];
    for (const id of questionIds) {
        const key = id.toString();
        if (questionMap[key]) {
            ordered.push(buildDisplayQuestion(questionMap[key]));
        }
    }

    return ordered;
};

// Fetch an attempt by ID, verify it belongs to the requesting user.
// Throws 400 for a malformed ID, 404 if not found, 403 if owned by someone else.
const getOwnedAttempt = async (attemptId, userId) => {
    ensureValidObjectId(attemptId, 'Invalid attempt id');

    const attempt = await examAttemptRepository.findById(attemptId);
    if (!attempt) {
        throw new ApiError(404, 'Exam attempt not found');
    }

    if (attempt.user.toString() !== userId.toString()) {
        throw new ApiError(403, 'You are not authorized to access this exam attempt');
    }

    return attempt;
};

// Build a lookup map from questionId string to answer object
const buildAnswerIndex = (answers = []) => {
    const map = {};
    for (const ans of answers) {
        if (!ans?.questionId) continue;
        map[ans.questionId.toString()] = ans;
    }
    return map;
};

// ---------------------------------------------------------------------------
// Scoring logic
// ---------------------------------------------------------------------------

// Produces one result entry for a single question.
// Determines isCorrect by matching the selected answer (text or index) against
// the stored correct answer in both English and Arabic.
const buildResultForQuestion = (questionId, question, answer) => {
    if (!question) {
        return {
            questionId,
            question: null,
            options: null,
            correctAnswer: null,
            explanation: null,
            questionAR: null,
            optionsAR: null,
            correctAnswerAR: null,
            explanationAR: null,
            selectedAnswer: normalizeText(answer?.selectedAnswer),
            selectedAnswerAR: normalizeText(answer?.selectedAnswerAR),
            selectedIndex: normalizeIndex(answer?.selectedIndex),
            chapterTitle: null,
            chapterTitleAR: null,
            image: null,
            video: null,
            isCorrect: false
        };
    }

    const options = Array.isArray(question.options) ? question.options : [];
    const optionsAR = Array.isArray(question.optionsAR) ? question.optionsAR : [];

    let selectedIndex = normalizeIndex(answer?.selectedIndex);

    const providedAnswer = normalizeText(answer?.selectedAnswer);
    const providedAnswerAR = normalizeText(answer?.selectedAnswerAR);

    // Derive index from text when only text was supplied
    if (selectedIndex === null && providedAnswer) {
        const idx = options.indexOf(providedAnswer);
        if (idx !== -1) selectedIndex = idx;
    }
    if (selectedIndex === null && providedAnswerAR) {
        const idx = optionsAR.indexOf(providedAnswerAR);
        if (idx !== -1) selectedIndex = idx;
    }

    const optionFromIndex = selectedIndex !== null ? getOptionByIndex(options, selectedIndex) : undefined;
    const optionArFromIndex = selectedIndex !== null ? getOptionByIndex(optionsAR, selectedIndex) : undefined;

    const selectedAnswer = providedAnswer || optionFromIndex || null;
    const selectedAnswerAR = providedAnswerAR || optionArFromIndex || null;

    const candidates = [selectedAnswer, selectedAnswerAR].filter(
        (value) => typeof value === 'string' && value.length
    );

    const correctAnswer = question.correctAnswer || null;
    const correctAnswerAR = question.correctAnswerAR || null;

    let isCorrect = false;

    // Primary check: option at selected index must equal the stored correct answer
    if (selectedIndex !== null) {
        if (optionFromIndex && correctAnswer && optionFromIndex === correctAnswer) isCorrect = true;
        if (!isCorrect && optionArFromIndex && correctAnswerAR && optionArFromIndex === correctAnswerAR) isCorrect = true;
    }

    // Fallback: direct text comparison for either language
    if (!isCorrect) {
        for (const candidate of candidates) {
            if (correctAnswer && candidate === correctAnswer) { isCorrect = true; break; }
            if (correctAnswerAR && candidate === correctAnswerAR) { isCorrect = true; break; }
        }
    }

    // Cross-language check: Arabic answer that maps to the same index as the
    // English correct answer is also accepted.
    if (!isCorrect && correctAnswer && options.length && optionsAR.length) {
        const correctIndex = options.indexOf(correctAnswer);
        if (correctIndex !== -1) {
            const arAtIndex = optionsAR[correctIndex];
            if (arAtIndex && candidates.includes(arAtIndex)) isCorrect = true;
        }
    }

    return {
        questionId,
        question: question.question,
        options: question.options,
        correctAnswer,
        explanation: question.explanation || null,
        questionAR: question.questionAR || null,
        optionsAR: question.optionsAR || null,
        correctAnswerAR,
        explanationAR: question.explanationAR || null,
        selectedAnswer,
        selectedAnswerAR,
        selectedIndex,
        chapterTitle: question.chapterTitle,
        chapterTitleAR: question.chapterTitleAR || null,
        image: question.image || null,
        video: question.video || null,
        isCorrect
    };
};

// ---------------------------------------------------------------------------
// Finalisation (score computation + DB update)
// ---------------------------------------------------------------------------

// Scores the attempt, writes status/score/results to the DB, and returns the
// saved document. Called for both 'submitted' and 'expired' endings.
const finalizeAttempt = async (attempt, status) => {
    const questionIds = attempt.questions.map((id) => id.toString());
    const questions = questionIds.length ? await quizRepository.findByIds(questionIds) : [];
    const questionMap = {};
    for (const q of questions) {
        questionMap[q._id.toString()] = q;
    }

    const answersById = buildAnswerIndex(attempt.answers);

    let correctCount = 0;
    const results = [];

    for (const questionId of questionIds) {
        const question = questionMap[questionId] || null;
        const answer = answersById[questionId];
        const result = buildResultForQuestion(questionId, question, answer);
        if (result.isCorrect) correctCount += 1;
        results.push(result);
    }

    const totalQuestions = attempt.totalQuestions || questionIds.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const updated = await examAttemptRepository.updateById(attempt._id, {
        status,
        submittedAt: new Date(),
        score,
        totalQuestions,
        results
    });

    // Guard: updateById returns null when the document no longer exists in the DB
    if (!updated) {
        throw new ApiError(404, 'Exam attempt not found');
    }

    return { attempt: updated, score, totalQuestions, results };
};

// ---------------------------------------------------------------------------
// Response builders
// ---------------------------------------------------------------------------

// Response for an in-progress attempt – no correct answers included
const buildActiveAttemptResponse = async (attempt) => {
    const questionIds = attempt.questions || [];
    const questions = questionIds.length ? await quizRepository.findByIds(questionIds) : [];
    const displayQuestions = buildDisplayQuestions(questionIds, questions);

    return {
        ...buildAttemptIdentifiers(attempt),
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        totalQuestions: attempt.totalQuestions,
        questions: displayQuestions,
        answers: attempt.answers || []
    };
};

// Response for a finalised attempt – includes correct answers and results
const buildSubmittedResponse = (attempt) => ({
    ...buildAttemptIdentifiers(attempt),
    status: attempt.status,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    results: attempt.results || [],
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt
});

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

// POST /start – always creates a fresh attempt with new random questions.
// Any existing in-progress attempt is marked expired first so only one attempt
// can be active per user at a time.
const startAttempt = async (userId) => {
    const now = new Date();

    // Expire any currently active (non-expired) attempt
    const activeAttempt = await examAttemptRepository.findActiveByUserId(userId, now);
    if (activeAttempt) {
        await finalizeAttempt(activeAttempt, 'expired');
    } else {
        // Also clean up an in-progress attempt that passed its expiry without
        // being submitted (e.g. user closed the browser mid-exam)
        const latestInProgress = await examAttemptRepository.findLatestInProgressByUserId(userId);
        if (latestInProgress && isExpired(latestInProgress, now)) {
            await finalizeAttempt(latestInProgress, 'expired');
        }
    }

    const examQuestions = await quizService.getExamQuestions();
    if (!examQuestions.length) {
        throw new ApiError(404, 'No quiz questions available for exam simulation');
    }

    const questionIds = examQuestions.map((q) => q._id);

    const attempt = await examAttemptRepository.create({
        user: userId,
        questions: questionIds,
        startedAt: now,
        expiresAt: new Date(now.getTime() + EXAM_DURATION_MS),
        totalQuestions: examQuestions.length
    });

    return buildActiveAttemptResponse(attempt);
};

// GET /active – resume only: returns the current active in-progress attempt.
// Returns 404 when no valid attempt exists so the frontend knows to call /start.
const getActiveAttempt = async (userId) => {
    const now = new Date();

    const activeAttempt = await examAttemptRepository.findActiveByUserId(userId, now);
    if (activeAttempt) {
        return buildActiveAttemptResponse(activeAttempt);
    }

    // If there is an in-progress attempt that has naturally expired, finalize it
    // so it doesn't linger in the DB with an incorrect status.
    const latestInProgress = await examAttemptRepository.findLatestInProgressByUserId(userId);
    if (latestInProgress && isExpired(latestInProgress, now)) {
        await finalizeAttempt(latestInProgress, 'expired');
    }

    throw new ApiError(404, 'No active exam attempt found');
};

// PATCH /:attemptId/answer – save or update the answer for a single question
const saveAnswer = async (userId, attemptId, payload) => {
    const attempt = await getOwnedAttempt(attemptId, userId);

    if (attempt.status !== 'in-progress') {
        throw new ApiError(400, 'Exam attempt is not in progress');
    }

    // Finalize as expired instead of silently discarding the save
    if (isExpired(attempt)) {
        await finalizeAttempt(attempt, 'expired');
        throw new ApiError(409, 'Exam attempt expired');
    }

    const questionId = payload?.questionId;
    ensureValidObjectId(questionId, 'Invalid question id');

    // Prevent answers from being saved against questions not in this attempt
    const inAttempt = attempt.questions.some((id) => id.toString() === questionId.toString());
    if (!inAttempt) {
        throw new ApiError(400, 'Question does not belong to this attempt');
    }

    const selectedAnswer = normalizeText(payload?.selectedAnswer);
    const selectedAnswerAR = normalizeText(payload?.selectedAnswerAR);
    const selectedIndex = normalizeIndex(payload?.selectedIndex);

    const answerPayload = {
        questionId,
        selectedAnswer,
        selectedAnswerAR,
        selectedIndex,
        answeredAt: new Date()
    };

    // Update in place if already answered, otherwise append
    const existingIndex = attempt.answers.findIndex(
        (answer) => answer.questionId.toString() === questionId.toString()
    );

    if (existingIndex >= 0) {
        attempt.answers[existingIndex] = {
            ...attempt.answers[existingIndex].toObject(),
            ...answerPayload
        };
    } else {
        attempt.answers.push(answerPayload);
    }

    await examAttemptRepository.updateById(attempt._id, { answers: attempt.answers });

    return { message: 'Answer saved' };
};

// POST /:attemptId/submit – score and finalize the attempt.
// Idempotent: calling submit on an already-finalised attempt returns the
// existing result without re-scoring.
const submitAttempt = async (userId, attemptId) => {
    const attempt = await getOwnedAttempt(attemptId, userId);

    // Idempotent path: already finalised
    if (attempt.status === 'submitted' || attempt.status === 'expired') {
        return buildSubmittedResponse(attempt);
    }

    // Auto-expire if the time window has passed; score it anyway so the user
    // sees their results.
    if (isExpired(attempt)) {
        const { attempt: expiredAttempt } = await finalizeAttempt(attempt, 'expired');
        return buildSubmittedResponse(expiredAttempt);
    }

    const { attempt: submittedAttempt } = await finalizeAttempt(attempt, 'submitted');
    return buildSubmittedResponse(submittedAttempt);
};

// GET /history – past attempts (submitted and expired) newest-first
const getHistory = async (userId) => {
    const attempts = await examAttemptRepository.findHistoryByUserId(userId);

    return attempts.map((attempt) => ({
        ...buildAttemptIdentifiers(attempt),
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        createdAt: attempt.createdAt
    }));
};

// GET /:attemptId – detail view of a finalised attempt (includes correct answers)
const getAttemptById = async (userId, attemptId) => {
    const attempt = await getOwnedAttempt(attemptId, userId);

    if (attempt.status === 'submitted' || attempt.status === 'expired') {
        return buildSubmittedResponse(attempt);
    }

    // Finalize a naturally-expired attempt so detail is still accessible
    if (isExpired(attempt)) {
        const { attempt: expiredAttempt } = await finalizeAttempt(attempt, 'expired');
        return buildSubmittedResponse(expiredAttempt);
    }

    // Cannot show full results for an attempt that is still running
    throw new ApiError(400, 'Exam attempt is still in progress');
};

module.exports = {
    startAttempt,
    getActiveAttempt,
    saveAnswer,
    submitAttempt,
    getHistory,
    getAttemptById
};
