const mongoose = require('mongoose');
const bookmarkRepository = require('../repositories/bookmarkRepository');
const lessonRepository = require('../repositories/lessonRepository');
const ApiError = require('../utils/apiError');

const ensureValidObjectId = (id, message) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, message);
    }
};

const getBookmarks = async (userId) => {
    const bookmarks = await bookmarkRepository.findByUserId(userId);
    return bookmarks;
};

const addBookmark = async (userId, payload) => {
    const { chapterId, subLessonIndex } = payload || {};

    if (!chapterId) {
        throw new ApiError(400, 'chapterId is required');
    }
    ensureValidObjectId(chapterId, 'Invalid chapterId');

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

    const existing = await bookmarkRepository.findOneByOwner(userId, chapterId, subLessonIndex);
    if (existing) {
        return existing;
    }

    const subLesson = lesson.lessons[subLessonIndex];

    return bookmarkRepository.create({
        userId,
        chapterId: lesson._id,
        chapterKey: lesson.chapterKey,
        subLessonIndex,
        title: subLesson.title,
        titleAR: subLesson.titleAR || ''
    });
};

const removeBookmarkById = async (userId, id) => {
    ensureValidObjectId(id, 'Invalid bookmark id');

    const removed = await bookmarkRepository.deleteByIdAndUser(id, userId);
    if (!removed) {
        throw new ApiError(404, 'Bookmark not found');
    }
    return { message: 'Bookmark removed' };
};

const removeBookmarkByLocation = async (userId, chapterId, subLessonIndex) => {
    if (!chapterId) {
        throw new ApiError(400, 'chapterId is required');
    }
    ensureValidObjectId(chapterId, 'Invalid chapterId');

    if (!Number.isInteger(subLessonIndex) || subLessonIndex < 0) {
        throw new ApiError(400, 'subLessonIndex must be a non-negative integer');
    }

    const removed = await bookmarkRepository.deleteByOwner(userId, chapterId, subLessonIndex);
    if (!removed) {
        throw new ApiError(404, 'Bookmark not found');
    }
    return { message: 'Bookmark removed' };
};

module.exports = {
    getBookmarks,
    addBookmark,
    removeBookmarkById,
    removeBookmarkByLocation
};
