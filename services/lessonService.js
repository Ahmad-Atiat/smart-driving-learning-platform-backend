const lessonRepository = require('../repositories/lessonRepository');
const progressRepository = require('../repositories/progressRepository');
const ApiError = require('../utils/apiError');

const getAllLessons = async (user) => {
    if (user.role === 'admin') {
        return lessonRepository.findAll();
    }
    return lessonRepository.findAllPublished();
};

const getLessonById = async (id) => {
    const lesson = await lessonRepository.findById(id);
    if (!lesson) {
        throw new ApiError(404, 'Lesson not found');
    }
    return lesson;
};

const completeSubLesson = async (userId, lessonId, subLessonTitle) => {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
        throw new ApiError(404, 'Lesson not found');
    }

    const subLesson = lesson.lessons.find(s => s.title === subLessonTitle);
    if (!subLesson) {
        throw new ApiError(404, 'Sub-lesson not found');
    }

    const identifier = `${lesson.title}:${subLessonTitle}`;

    let progress = await progressRepository.findByUserId(userId);
    if (!progress) {
        progress = await progressRepository.createForUser(userId);
    }

    if (!progress.completedLessons.includes(identifier)) {
        progress.completedLessons.push(identifier);
    }

    // Recalculate overall progress
    const allLessons = await lessonRepository.findAllPublished();
    let completedChapters = 0;

    for (const chapter of allLessons) {
        const allSubs = chapter.lessons.map(s => `${chapter.title}:${s.title}`);
        const allCompleted = allSubs.every(sub => progress.completedLessons.includes(sub));
        if (allCompleted && allSubs.length > 0) {
            completedChapters++;
        }
    }

    progress.overallProgress = allLessons.length > 0
        ? Math.round((completedChapters / allLessons.length) * 100)
        : 0;

    await progressRepository.update(progress._id, {
        completedLessons: progress.completedLessons,
        overallProgress: progress.overallProgress
    });

    return { message: 'Sub-lesson completed', identifier, overallProgress: progress.overallProgress };
};

const createLesson = async (data) => {
    return lessonRepository.create(data);
};

const updateLesson = async (id, data) => {
    const lesson = await lessonRepository.updateById(id, data);
    if (!lesson) {
        throw new ApiError(404, 'Lesson not found');
    }
    return lesson;
};

const deleteLesson = async (id) => {
    const lesson = await lessonRepository.deleteById(id);
    if (!lesson) {
        throw new ApiError(404, 'Lesson not found');
    }
    return { message: 'Lesson deleted successfully' };
};

module.exports = { getAllLessons, getLessonById, completeSubLesson, createLesson, updateLesson, deleteLesson };
