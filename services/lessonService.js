const lessonRepository = require('../repositories/lessonRepository');
const progressService = require('./progressService');
const ApiError = require('../utils/apiError');
const { getChapterByTitle } = require('../utils/chapterMetadata');

const withChapterKey = (data) => {
    if (data.chapterKey) {
        return data;
    }

    const chapter = getChapterByTitle(data.title);
    return chapter ? { ...data, chapterKey: chapter.chapterKey } : data;
};

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

    const subLessonIndex = lesson.lessons.findIndex(s => s.title === subLessonTitle);
    if (subLessonIndex === -1) {
        throw new ApiError(404, 'Sub-lesson not found');
    }

    return progressService.completeLessonProgress(userId, { chapterId: lessonId, subLessonIndex });
};

const createLesson = async (data) => {
    return lessonRepository.create(withChapterKey(data));
};

const updateLesson = async (id, data) => {
    const lesson = await lessonRepository.updateById(id, withChapterKey(data));
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
