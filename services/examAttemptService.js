const mongoose = require('mongoose');
const examAttemptRepository = require('../repositories/examAttemptRepository');
const quizRepository = require('../repositories/quizRepository');
const quizService = require('./quizService');
const ApiError = require('../utils/apiError');

// ---------------------------------------------------------------------------
// Real-exam constants
// ---------------------------------------------------------------------------

const EXAM_DURATION_MS = 60 * 60 * 1000; // 60 minutes
const PASSING_CORRECT_COUNT = 51;         // 51 / 60 = 85 %
const MAX_WRONG_COUNT = 9;                // fail immediately when wrong answers reach this

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
// Per-answer correctness check (used at save time, not at finalisation)
// ---------------------------------------------------------------------------

// Mirrors the same matching rules as buildResultForQuestion so that the
// in-save wrongCount and the finalize wrongCount are always consistent.
// Returns true | false (never null — callers handle the skipped case separately).
const evaluateCorrectness = (question, { selectedAnswer, selectedAnswerAR, selectedIndex }) => {
    const options     = Array.isArray(question.options)    ? question.options    : [];
    const optionsAR   = Array.isArray(question.optionsAR)  ? question.optionsAR  : [];
    const correctAns  = normalizeText(question.correctAnswer);
    const correctAnsAR = normalizeText(question.correctAnswerAR);

    const idx        = normalizeIndex(selectedIndex);
    const ansText    = normalizeText(selectedAnswer);
    const ansTextAR  = normalizeText(selectedAnswerAR);

    // Index debug points: selectedIndex, optionEng, optionAR, correctAnswer,
    // correctAnswerAR, and final isCorrect can be verified here without
    // exposing correct answers in the active exam API response.
    if (idx !== null) {
        const optEng = normalizeText(options[idx]);
        const optAR  = normalizeText(optionsAR[idx]);
        return Boolean(
            (optEng && correctAns && optEng === correctAns) ||
            (optAR && correctAnsAR && optAR === correctAnsAR)
        );
    }

    // Text fallback is only used for older clients that do not send selectedIndex.
    if (ansText   && correctAns   && ansText   === correctAns)   return true;
    if (ansTextAR && correctAnsAR && ansTextAR === correctAnsAR) return true;

    // 3) Cross-language: Arabic answer maps to the same index as the English correct answer
    if (ansTextAR && correctAns && options.length && optionsAR.length) {
        const correctIdx = options.findIndex((option) => normalizeText(option) === correctAns);
        if (correctIdx !== -1 && normalizeText(optionsAR[correctIdx]) === ansTextAR) return true;
    }

    return false;
};

// ---------------------------------------------------------------------------
// Passing determination
// ---------------------------------------------------------------------------

// Applies real-exam rules and returns { passed, failureReason }.
// Wrong-answer overflow takes priority over score-based failure so both
// conditions can be reported distinctly in the UI.
const determinePassing = (correctCount, wrongCount) => {
    if (wrongCount >= MAX_WRONG_COUNT) {
        return { passed: false, failureReason: 'Too many wrong answers' };
    }
    if (correctCount < PASSING_CORRECT_COUNT) {
        return { passed: false, failureReason: 'Score below passing threshold' };
    }
    return { passed: true, failureReason: null };
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

const hasSelectedAnswer = (answer) =>
    normalizeIndex(answer?.selectedIndex) !== null ||
    Boolean(normalizeText(answer?.selectedAnswer)) ||
    Boolean(normalizeText(answer?.selectedAnswerAR));

// ---------------------------------------------------------------------------
// Scoring logic
// ---------------------------------------------------------------------------

// Produces one result entry for a single question.
// Determines isCorrect by matching the selected answer (text or index) against
// the stored correct answer in both English and Arabic.
// The `skipped` and `wasAnswered` flags are passed through for UI review display.
// wasAnswered lets the result page distinguish "unanswered" from "wrong" so that
// the early-fail review can hide questions the user never reached.
const buildResultForQuestion = (questionId, question, answer) => {
    // answer may be undefined (unanswered) or have skipped === true
    const wasSkipped  = answer?.skipped === true;
    const wasAnswered = answer !== undefined; // false only when no answer record at all

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
            skipped: wasSkipped,
            wasAnswered,
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
    const normalizedOptionFromIndex = normalizeText(optionFromIndex);
    const normalizedOptionArFromIndex = normalizeText(optionArFromIndex);

    const selectedAnswer = providedAnswer || optionFromIndex || null;
    const selectedAnswerAR = providedAnswerAR || optionArFromIndex || null;

    const candidates = [selectedAnswer, selectedAnswerAR]
        .map((value) => normalizeText(value))
        .filter((value) => typeof value === 'string' && value.length);

    const correctAnswer = question.correctAnswer || null;
    const correctAnswerAR = question.correctAnswerAR || null;
    const normalizedCorrectAnswer = normalizeText(correctAnswer);
    const normalizedCorrectAnswerAR = normalizeText(correctAnswerAR);

    let isCorrect = false;

    // A skipped question can never be correct – skip the matching logic entirely
    if (!wasSkipped) {
        // Primary check: option at selected index must equal the stored correct answer
        if (selectedIndex !== null) {
            if (normalizedOptionFromIndex && normalizedCorrectAnswer && normalizedOptionFromIndex === normalizedCorrectAnswer) isCorrect = true;
            if (!isCorrect && normalizedOptionArFromIndex && normalizedCorrectAnswerAR && normalizedOptionArFromIndex === normalizedCorrectAnswerAR) isCorrect = true;
        }

        // Fallback: direct text comparison for older answers without selectedIndex
        if (!isCorrect && selectedIndex === null) {
            for (const candidate of candidates) {
                if (normalizedCorrectAnswer && candidate === normalizedCorrectAnswer) { isCorrect = true; break; }
                if (normalizedCorrectAnswerAR && candidate === normalizedCorrectAnswerAR) { isCorrect = true; break; }
            }
        }

        // Cross-language check: Arabic answer that maps to the same index as the
        // English correct answer is also accepted.
        if (!isCorrect && selectedIndex === null && normalizedCorrectAnswer && options.length && optionsAR.length) {
            const correctIndex = options.findIndex((option) => normalizeText(option) === normalizedCorrectAnswer);
            if (correctIndex !== -1) {
                const arAtIndex = normalizeText(optionsAR[correctIndex]);
                if (arAtIndex && candidates.includes(arAtIndex)) isCorrect = true;
            }
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
        skipped: wasSkipped,
        wasAnswered,
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
    let wrongCount = 0;
    let emptyCount = 0;
    let skippedCount = 0;
    const results = [];

    for (const questionId of questionIds) {
        const question = questionMap[questionId] || null;
        const answer = answersById[questionId];
        const result = buildResultForQuestion(questionId, question, answer);
        results.push(result);

        // Classify each question into exactly one bucket:
        //   empty   – no answer record at all
        //   skipped – user explicitly skipped (selectedIndex = null, skipped = true)
        //   correct – answered and matched the correct answer
        //   wrong   – answered but did not match
        // Only "wrong" answers count toward the failure threshold.
        if (!answer) {
            emptyCount++;
        } else if (answer.skipped === true) {
            skippedCount++;
        } else if (result.isCorrect) {
            correctCount++;
        } else {
            wrongCount++;
        }
    }

    const totalQuestions = attempt.totalQuestions || questionIds.length;
    // Percentage score kept for backward compatibility
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const { passed, failureReason } = determinePassing(correctCount, wrongCount);

    const updated = await examAttemptRepository.updateById(attempt._id, {
        status,
        submittedAt: new Date(),
        score,
        totalQuestions,
        results,
        passed,
        correctCount,
        wrongCount,
        emptyCount,
        skippedCount,
        failureReason
    });

    // Guard: updateById returns null when the document no longer exists in the DB
    if (!updated) {
        throw new ApiError(404, 'Exam attempt not found');
    }

    return { attempt: updated, score, totalQuestions, results, passed, correctCount, wrongCount, emptyCount, skippedCount, failureReason };
};

// ---------------------------------------------------------------------------
// Response builders
// ---------------------------------------------------------------------------

// Response for an in-progress attempt – no correct answers included.
// Also surfaces constants the frontend needs for its progress bar / skip counter.
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
        passingScore: PASSING_CORRECT_COUNT,
        questions: displayQuestions,
        answers: attempt.answers || []
    };
};

// Response for a finalised attempt – includes correct answers, results, and
// all real-exam pass/fail fields.
const buildSubmittedResponse = (attempt) => ({
    ...buildAttemptIdentifiers(attempt),
    status: attempt.status,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    // Real-exam result fields
    passed: attempt.passed ?? false,
    correctCount: attempt.correctCount ?? 0,
    wrongCount: attempt.wrongCount ?? 0,
    emptyCount: attempt.emptyCount ?? 0,
    skippedCount: attempt.skippedCount ?? 0,
    failureReason: attempt.failureReason ?? null,
    passingScore: PASSING_CORRECT_COUNT,
    results: attempt.results || [],
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt
});

// Build partial review for early-fail: only include results for questions the user reached.
// Do not expose correct answers for unseen questions.
const buildEarlyFailResponse = (attempt, failedAttempt, latestAnswer = {}) => {
    const answeredQuestionIds = new Set(
        attempt.answers
            .filter((a) => a.skipped === true || hasSelectedAnswer(a))
            .map((a) => a.questionId.toString())
    );

    const partialResults = (failedAttempt.results || []).filter((r) =>
        answeredQuestionIds.has(r.questionId.toString())
    );

    return {
        ...buildAttemptIdentifiers(failedAttempt),
        message: 'Answer saved',
        questionId: latestAnswer.questionId ?? null,
        isCorrect: latestAnswer.isCorrect ?? false,
        status: failedAttempt.status,
        score: failedAttempt.score,
        totalQuestions: failedAttempt.totalQuestions,
        passed: failedAttempt.passed ?? false,
        correctCount: failedAttempt.correctCount ?? 0,
        wrongCount: failedAttempt.wrongCount ?? 0,
        answeredCount: (failedAttempt.correctCount ?? 0) + (failedAttempt.wrongCount ?? 0),
        remainingCount: failedAttempt.emptyCount ?? 0,
        emptyCount: failedAttempt.emptyCount ?? 0,
        skippedCount: failedAttempt.skippedCount ?? 0,
        failureReason: failedAttempt.failureReason ?? null,
        passingScore: PASSING_CORRECT_COUNT,
        earlyFailed: true,
        results: partialResults,
        startedAt: failedAttempt.startedAt,
        submittedAt: failedAttempt.submittedAt
    };
};

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

// PATCH /:attemptId/answer – save or update the answer for a single question.
// Frontend sends { questionId, selectedIndex, selectedAnswer?, selectedAnswerAR?, skipped? }.
// When skipped === true all selection fields are set to null.
//
// Response (normal):
//   { message: 'Answer saved', questionId, isCorrect, correctCount, wrongCount,
//     answeredCount, skippedCount, remainingCount, totalQuestions, earlyFailed: false }
// Response (early fail):
//   { ...buildEarlyFailResponse, earlyFailed: true }
// The frontend checks earlyFailed and navigates to the result page immediately.
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

    // Explicit skip: frontend sends skipped = true with selectedIndex = null.
    // Skipped questions are NOT counted as wrong at scoring time.
    const skipped = payload?.skipped === true;

    const selectedAnswer    = skipped ? null : normalizeText(payload?.selectedAnswer);
    const selectedAnswerAR  = skipped ? null : normalizeText(payload?.selectedAnswerAR);
    const selectedIndex     = skipped ? null : normalizeIndex(payload?.selectedIndex);

    if (!skipped && !hasSelectedAnswer({ selectedAnswer, selectedAnswerAR, selectedIndex })) {
        throw new ApiError(400, 'Answer selection is required');
    }

    // Evaluate correctness at save time so we can maintain a running wrongCount
    // without re-fetching all 60 questions on every save.
    // isCorrect is stored on the answer record and never exposed during the exam.
    let isCorrect = false;
    if (!skipped) {
        const question = await quizRepository.findById(questionId);
        if (!question) {
            throw new ApiError(404, 'Question not found');
        }
        isCorrect = evaluateCorrectness(question, { selectedAnswer, selectedAnswerAR, selectedIndex });
    }

    const answerPayload = {
        questionId,
        selectedAnswer,
        selectedAnswerAR,
        selectedIndex,
        skipped,
        isCorrect,
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

    // Persist the updated answers (including the new isCorrect field)
    await examAttemptRepository.updateById(attempt._id, { answers: attempt.answers });

    // Compute running wrongCount from the in-memory answers array.
    // Skipped and unanswered answers are never counted as wrong.
    const wrongCount = attempt.answers.filter(
        (a) => a.skipped !== true && a.isCorrect === false
    ).length;

    // Early fail: wrong answer threshold reached – finalize immediately.
    // The attempt is submitted (not expired) because the user was actively answering.
    if (wrongCount >= MAX_WRONG_COUNT) {
        const { attempt: failedAttempt } = await finalizeAttempt(attempt, 'submitted');
        return buildEarlyFailResponse(attempt, failedAttempt, { questionId, isCorrect });
    }

    // Normal save: return real-time correctness stats for frontend progress tracking.
    const correctCount = attempt.answers.filter((a) => a.isCorrect === true).length;
    const answeredCount = attempt.answers.filter(
        (a) => a.skipped !== true && hasSelectedAnswer(a)
    ).length;
    const skippedCount = attempt.answers.filter((a) => a.skipped === true).length;
    const remainingCount = attempt.questions.length - answeredCount - skippedCount;

    return {
        message: 'Answer saved',
        questionId,
        isCorrect,
        correctCount,
        wrongCount,
        answeredCount,
        skippedCount,
        remainingCount,
        totalQuestions: attempt.totalQuestions,
        earlyFailed: false
    };
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

// GET /history – past attempts (submitted and expired) newest-first.
// Includes pass/fail summary so the history list can show a badge without
// fetching the full detail.
const getHistory = async (userId) => {
    const attempts = await examAttemptRepository.findHistoryByUserId(userId);

    return attempts.map((attempt) => ({
        ...buildAttemptIdentifiers(attempt),
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        passed: attempt.passed ?? null,
        correctCount: attempt.correctCount ?? null,
        wrongCount: attempt.wrongCount ?? null,
        failureReason: attempt.failureReason ?? null,
        passingScore: PASSING_CORRECT_COUNT,
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
