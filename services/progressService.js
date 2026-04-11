const progressRepository = require('../repositories/progressRepository');
const lessonRepository = require('../repositories/lessonRepository');
const ApiError = require('../utils/apiError');

const getProgress = async (userId) => {
    let progress = await progressRepository.findByUserId(userId);
    if (!progress) {
        progress = await progressRepository.createForUser(userId);
    }
    return progress;
};

const getProgressSummary = async (userId) => {
    let progress = await progressRepository.findByUserId(userId);
    if (!progress) {
        progress = await progressRepository.createForUser(userId);
    }

    const allLessons = await lessonRepository.findAllPublished();

    // Build per-lesson status
    const lessonStatuses = allLessons.map(chapter => {
        const allSubs = chapter.lessons.map(s => `${chapter.title}:${s.title}`);
        const completedSubs = allSubs.filter(sub => progress.completedLessons.includes(sub));

        let status = 'Not Started';
        if (completedSubs.length === allSubs.length && allSubs.length > 0) {
            status = 'Completed';
        } else if (completedSubs.length > 0) {
            status = 'In Progress';
        }

        return {
            chapterId: chapter._id,
            title: chapter.title,
            description: chapter.description,
            totalSubLessons: allSubs.length,
            completedSubLessons: completedSubs.length,
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

module.exports = { getProgress, getProgressSummary, resetProgress };
