const progressRepository = require('../repositories/progressRepository');
const lessonRepository = require('../repositories/lessonRepository');
const ChapterQuizProgress = require('../models/ChapterQuizProgress');
const ExamAttempt = require('../models/ExamAttempt');
const Quiz = require('../models/Quiz');
const Bookmark = require('../models/Bookmark');
const QuizBookmark = require('../models/QuizBookmark');
const ApiError = require('../utils/apiError');

const normalizeId = (value) => value?.toString();

const isCompletedEntry = (entry, chapterId, subLessonIndex) => {
    if (!entry || typeof entry !== 'object') {
        return false;
    }

    return normalizeId(entry.chapterId) === normalizeId(chapterId) && entry.subLessonIndex === subLessonIndex;
};

const countCompletedSubLessons = (progress, chapter) =>
    chapter.lessons.filter((_, index) =>
        progress.completedLessons.some((entry) => isCompletedEntry(entry, chapter._id, index))
    ).length;

const calculateOverallProgress = async (progress) => {
    const allLessons = await lessonRepository.findAllPublished();
    let completedChapters = 0;

    for (const chapter of allLessons) {
        if (chapter.lessons.length === 0) {
            continue;
        }

        const completedCount = countCompletedSubLessons(progress, chapter);
        if (completedCount === chapter.lessons.length) {
            completedChapters++;
        }
    }

    return allLessons.length > 0
        ? Math.round((completedChapters / allLessons.length) * 100)
        : 0;
};

const getProgress = async (userId) => {
    let progress = await progressRepository.findByUserId(userId);
    if (!progress) {
        progress = await progressRepository.createForUser(userId);
    }
    return progress;
};

const getLessonProgress = async (userId) => {
    const progress = await getProgress(userId);
    return { completedLessons: progress.completedLessons };
};

const completeLessonProgress = async (userId, { chapterId, subLessonIndex }) => {
    if (!chapterId) {
        throw new ApiError(400, 'chapterId is required');
    }

    if (!Number.isInteger(subLessonIndex) || subLessonIndex < 0) {
        throw new ApiError(400, 'subLessonIndex must be a non-negative integer');
    }

    const lesson = await lessonRepository.findById(chapterId);
    if (!lesson) {
        throw new ApiError(404, 'Lesson not found');
    }

    if (subLessonIndex >= lesson.lessons.length) {
        throw new ApiError(404, 'Sub-lesson not found');
    }

    let progress = await progressRepository.findByUserId(userId);
    if (!progress) {
        progress = await progressRepository.createForUser(userId);
    }

    const alreadyCompleted = progress.completedLessons.some((entry) =>
        isCompletedEntry(entry, lesson._id, subLessonIndex)
    );

    if (!alreadyCompleted) {
        progress.completedLessons.push({
            chapterId: lesson._id,
            subLessonIndex,
            completedAt: new Date()
        });
    }

    progress.overallProgress = await calculateOverallProgress(progress);

    const updatedProgress = await progressRepository.update(progress._id, {
        completedLessons: progress.completedLessons,
        overallProgress: progress.overallProgress
    });

    const completedSubLessonsForChapter = countCompletedSubLessons(updatedProgress, lesson);
    const isChapterCompleted =
        lesson.lessons.length > 0 && completedSubLessonsForChapter === lesson.lessons.length;
    const isLastSubLesson = subLessonIndex === lesson.lessons.length - 1;

    let nextChapter = null;
    if (isChapterCompleted || isLastSubLesson) {
        const allLessons = await lessonRepository.findAllPublished();
        const idx = allLessons.findIndex((c) => c._id.toString() === lesson._id.toString());
        const candidate = idx >= 0 ? allLessons[idx + 1] : null;
        if (candidate) {
            nextChapter = {
                _id: candidate._id,
                chapterKey: candidate.chapterKey,
                title: candidate.title,
                titleAR: candidate.titleAR,
                order: candidate.order
            };
        }
    }

    return {
        message: 'Sub-lesson completed',
        completed: true,
        completedLesson: updatedProgress.completedLessons.find((entry) =>
            isCompletedEntry(entry, lesson._id, subLessonIndex)
        ),
        completedLessons: updatedProgress.completedLessons,
        overallProgress: updatedProgress.overallProgress,
        isChapterCompleted,
        isLastSubLesson,
        nextChapter
    };
};

const getProgressSummary = async (userId) => {
    let progress = await progressRepository.findByUserId(userId);
    if (!progress) {
        progress = await progressRepository.createForUser(userId);
    }

    const allLessons = await lessonRepository.findAllPublished();

    // Build per-lesson status
    const lessonStatuses = allLessons.map(chapter => {
        const completedSubLessons = countCompletedSubLessons(progress, chapter);

        let status = 'Not Started';
        if (completedSubLessons === chapter.lessons.length && chapter.lessons.length > 0) {
            status = 'Completed';
        } else if (completedSubLessons > 0) {
            status = 'In Progress';
        }

        return {
            chapterId: chapter._id,
            title: chapter.title,
            titleAR: chapter.titleAR,
            description: chapter.description,
            descriptionAR: chapter.descriptionAR,
            totalSubLessons: chapter.lessons.length,
            completedSubLessons,
            status
        };
    });

    // Quiz stats
    const quizResults = progress.quizResults || [];
    const totalAttempts = quizResults.length;
    const lastScore = totalAttempts > 0 ? quizResults[quizResults.length - 1].score : null;
    const averageScore = totalAttempts > 0
        ? Math.round(quizResults.reduce((sum, r) => sum + r.score, 0) / totalAttempts)
        : 0;

    return {
        overallProgress: progress.overallProgress,
        lessons: lessonStatuses,
        quizStats: {
            totalAttempts,
            lastScore,
            averageScore
        }
    };
};

// Wipes every collection that stores user-scoped progress so the account
// behaves like a fresh signup. The User document itself is untouched, so
// authentication / profile / settings / subscription remain intact. If the
// user has no Progress doc yet (genuinely new account) we still proceed to
// clear sibling collections — they may exist independently.
const resetProgress = async (userId) => {
    const progress = await progressRepository.findByUserId(userId);

    const tasks = [
        ChapterQuizProgress.deleteMany({ user: userId }),
        ExamAttempt.deleteMany({ user: userId }),
        Bookmark.deleteMany({ userId }),
        QuizBookmark.deleteMany({ userId })
    ];

    if (progress) {
        tasks.push(progressRepository.resetProgress(progress._id));
    } else {
        tasks.push(progressRepository.createForUser(userId));
    }

    await Promise.all(tasks);
    return { message: 'Progress reset successfully' };
};

// ---------------------------------------------------------------------------
// Study activity aggregation
// ---------------------------------------------------------------------------
// Collects every timestamp that represents user activity (lesson completion,
// chapter-quiz answer, exam attempt start/answer/submit) and groups them by
// calendar day. Used by the Progress page chart, active-days count and
// 7d / 30d / all range filters.

const RANGE_TO_DAYS = { '7d': 7, '30d': 30, 'all': null };

// YYYY-MM-DD in server-local time so all daily aggregations are consistent.
const toDayKey = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Local midnight `daysBack` days before `from` (inclusive window anchor).
const startOfDayOffset = (from, daysBack) =>
    new Date(from.getFullYear(), from.getMonth(), from.getDate() - daysBack);

const collectActivityStamps = async (userId) => {
    const [progress, chapterProgress, examAttempts] = await Promise.all([
        progressRepository.findByUserId(userId),
        ChapterQuizProgress.find({ user: userId }).select('answers updatedAt').lean(),
        ExamAttempt.find({ user: userId })
            .select('startedAt submittedAt answers status')
            .lean()
    ]);

    const stamps = [];

    if (progress?.completedLessons?.length) {
        for (const entry of progress.completedLessons) {
            if (entry?.completedAt) stamps.push(new Date(entry.completedAt));
        }
    }

    for (const cp of chapterProgress || []) {
        for (const a of cp.answers || []) {
            if (a?.answeredAt) stamps.push(new Date(a.answeredAt));
        }
    }

    for (const ea of examAttempts || []) {
        if (ea?.startedAt) stamps.push(new Date(ea.startedAt));
        if (ea?.submittedAt) stamps.push(new Date(ea.submittedAt));
        for (const a of ea.answers || []) {
            if (a?.answeredAt) stamps.push(new Date(a.answeredAt));
        }
    }

    return stamps.filter((d) => d instanceof Date && !Number.isNaN(d.getTime()));
};

const getActivity = async (userId, rangeKey = '30d') => {
    const normalizedRange = Object.prototype.hasOwnProperty.call(RANGE_TO_DAYS, rangeKey)
        ? rangeKey
        : '30d';
    const days = RANGE_TO_DAYS[normalizedRange];

    const stamps = await collectActivityStamps(userId);

    const now = new Date();
    const since = days ? startOfDayOffset(now, days - 1) : null;
    const filtered = since ? stamps.filter((d) => d >= since) : stamps;

    const byDay = new Map();
    for (const d of filtered) {
        const key = toDayKey(d);
        if (key) byDay.set(key, (byDay.get(key) || 0) + 1);
    }

    const buckets = [];
    if (days) {
        // Dense series: one entry per day in the selected window (zero-filled).
        for (let i = days - 1; i >= 0; i--) {
            const day = startOfDayOffset(now, i);
            const key = toDayKey(day);
            buckets.push({ date: key, count: byDay.get(key) || 0 });
        }
    } else {
        // 'all' — sparse series: every day that had any activity, oldest first.
        const sortedKeys = Array.from(byDay.keys()).sort();
        for (const key of sortedKeys) {
            buckets.push({ date: key, count: byDay.get(key) });
        }
    }

    const totalActiveDaysAll = new Set(
        stamps.map((d) => toDayKey(d)).filter((k) => k)
    ).size;
    const activeDays = new Set(
        filtered.map((d) => toDayKey(d)).filter((k) => k)
    ).size;

    return {
        range: normalizedRange,
        days,
        buckets,
        activeDays,
        totalActiveDays: totalActiveDaysAll,
        totalEvents: filtered.length
    };
};

// ---------------------------------------------------------------------------
// Chapter strength (radar chart input)
// ---------------------------------------------------------------------------
// For every published chapter, compute the user's exam strength as
//   strength = round((correctlyAnswered / answered) * 100)
// where `answered` counts only exam answers that have a value and are NOT
// flagged as skipped. Chapters with zero answers are returned with 0%
// strength and `answered = 0` so the radar/weakest list can render them
// safely. The range argument filters by attempt timestamp, matching the
// rest of the Progress page filters.

// Decide whether an exam-answer record counts as "answered" for scoring
// purposes. Skipped questions and ones with no selection are ignored — the
// user explicitly said "Use only answered questions."
const isCountedAnswer = (answer) => {
    if (!answer || answer.skipped === true) return false;
    if (typeof answer.selectedIndex === 'number') return true;
    if (typeof answer.selectedAnswer === 'string' && answer.selectedAnswer.trim().length > 0) return true;
    if (typeof answer.selectedAnswerAR === 'string' && answer.selectedAnswerAR.trim().length > 0) return true;
    return false;
};

// Pick the best timestamp to bucket an attempt under: prefer submission
// (the moment the user finished) and fall back to start.
const getAttemptTimestamp = (attempt) => {
    const t = attempt?.submittedAt || attempt?.startedAt || attempt?.createdAt;
    return t ? new Date(t) : null;
};

const getChapterStrength = async (userId, rangeKey = '30d') => {
    const normalizedRange = Object.prototype.hasOwnProperty.call(RANGE_TO_DAYS, rangeKey)
        ? rangeKey
        : '30d';
    const days = RANGE_TO_DAYS[normalizedRange];
    const now = new Date();
    const since = days ? startOfDayOffset(now, days - 1) : null;

    const [publishedLessons, attempts] = await Promise.all([
        lessonRepository.findAllPublished(),
        ExamAttempt.find({ user: userId }).select('answers startedAt submittedAt createdAt').lean()
    ]);

    // Filter attempts by the selected window using attempt timestamp
    const inWindowAttempts = (attempts || []).filter((attempt) => {
        if (!since) return true;
        const t = getAttemptTimestamp(attempt);
        return t && t >= since;
    });

    // Collect every counted answer paired with its question id
    const countedAnswers = [];
    for (const attempt of inWindowAttempts) {
        for (const answer of attempt.answers || []) {
            if (!isCountedAnswer(answer)) continue;
            if (!answer.questionId) continue;
            countedAnswers.push(answer);
        }
    }

    // Build a single questionId -> chapterTitle lookup so we touch the Quiz
    // collection at most once per request regardless of attempt count.
    const uniqueQuestionIds = Array.from(
        new Set(countedAnswers.map((a) => a.questionId?.toString()).filter(Boolean))
    );

    const chapterByQuestionId = new Map();
    if (uniqueQuestionIds.length > 0) {
        const quizDocs = await Quiz.find({ _id: { $in: uniqueQuestionIds } })
            .select('chapterTitle')
            .lean();
        for (const q of quizDocs) {
            chapterByQuestionId.set(q._id.toString(), q.chapterTitle || null);
        }
    }

    // Aggregate per chapterTitle (Quiz's chapter identifier)
    const statsByChapterTitle = new Map();
    for (const answer of countedAnswers) {
        const chapterTitle = chapterByQuestionId.get(answer.questionId.toString());
        if (!chapterTitle) continue;
        const current = statsByChapterTitle.get(chapterTitle) || { correct: 0, answered: 0 };
        current.answered += 1;
        if (answer.isCorrect === true) current.correct += 1;
        statsByChapterTitle.set(chapterTitle, current);
    }

    // Emit one row per published chapter (stable order, includes zero-answer
    // chapters so the radar always renders the full polygon). Lesson.title is
    // the join key with Quiz.chapterTitle — same convention as the rest of
    // the app (see lessons/quizzes alignment).
    const rows = publishedLessons.map((chapter) => {
        const stats = statsByChapterTitle.get(chapter.title) || { correct: 0, answered: 0 };
        const strength = stats.answered > 0
            ? Math.round((stats.correct / stats.answered) * 100)
            : 0;
        return {
            chapterId: chapter._id,
            chapterKey: chapter.chapterKey,
            chapterTitle: chapter.title,
            chapterTitleAR: chapter.titleAR || null,
            correct: stats.correct,
            answered: stats.answered,
            strength
        };
    });

    return {
        range: normalizedRange,
        days,
        chapters: rows,
        totalAnsweredAcrossChapters: countedAnswers.length,
        attemptsConsidered: inWindowAttempts.length
    };
};

module.exports = {
    getProgress,
    getLessonProgress,
    completeLessonProgress,
    getProgressSummary,
    resetProgress,
    getActivity,
    getChapterStrength
};
