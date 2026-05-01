const progressRepository = require('../repositories/progressRepository');
const lessonRepository = require('../repositories/lessonRepository');
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

    return {
        message: 'Sub-lesson completed',
        completedLesson: updatedProgress.completedLessons.find((entry) =>
            isCompletedEntry(entry, lesson._id, subLessonIndex)
        ),
        completedLessons: updatedProgress.completedLessons,
        overallProgress: updatedProgress.overallProgress
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

module.exports = { getProgress, getLessonProgress, completeLessonProgress, getProgressSummary, resetProgress };
