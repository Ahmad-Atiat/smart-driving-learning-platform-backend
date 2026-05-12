const progressRepository = require('../repositories/progressRepository');
const lessonRepository = require('../repositories/lessonRepository');
const ChapterQuizProgress = require('../models/ChapterQuizProgress');
const ExamAttempt = require('../models/ExamAttempt');
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

const resetProgress = async (userId) => {
    const progress = await progressRepository.findByUserId(userId);
    if (!progress) {
        throw new ApiError(404, 'No progress found to reset');
    }
    await progressRepository.resetProgress(progress._id);
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

module.exports = { getProgress, getLessonProgress, completeLessonProgress, getProgressSummary, resetProgress, getActivity };
