const mongoose = require('mongoose');
const quizBookmarkRepository = require('../repositories/quizBookmarkRepository');
const quizRepository = require('../repositories/quizRepository');
const ApiError = require('../utils/apiError');
const {
    getChapterByKey,
    getChapterByTitle
} = require('../utils/chapterMetadata');

const ensureValidObjectId = (id, message) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, message);
    }
};

const resolveChapter = (chapterRef) => {
    if (typeof chapterRef !== 'string' || !chapterRef.trim()) {
        throw new ApiError(400, 'chapterKey or chapterTitle is required');
    }

    const trimmed = chapterRef.trim();
    const fromKey = getChapterByKey(trimmed);
    if (fromKey) return fromKey;

    const fromTitle = getChapterByTitle(trimmed);
    if (fromTitle) return fromTitle;

    return { chapterKey: trimmed, title: trimmed, aliases: [] };
};

const listForChapter = async (userId, chapterRef) => {
    const chapter = resolveChapter(chapterRef);
    const bookmarks = await quizBookmarkRepository.findByUserAndChapter(userId, chapter.chapterKey);
    return bookmarks.map((b) => ({
        _id: b._id,
        questionId: b.questionId,
        chapterKey: b.chapterKey,
        chapterTitle: b.chapterTitle,
        chapterTitleAR: b.chapterTitleAR,
        createdAt: b.createdAt
    }));
};

const toggle = async (userId, payload) => {
    const { chapterKey, questionId } = payload || {};

    if (!questionId) {
        throw new ApiError(400, 'questionId is required');
    }
    ensureValidObjectId(questionId, 'Invalid questionId');

    const chapter = resolveChapter(chapterKey);

    const existing = await quizBookmarkRepository.findOne(userId, chapter.chapterKey, questionId);
    if (existing) {
        await quizBookmarkRepository.deleteByIdAndUser(existing._id, userId);
        return { bookmarked: false, questionId };
    }

    const question = await quizRepository.findById(questionId);
    if (!question) {
        throw new ApiError(404, 'Quiz question not found');
    }

    const created = await quizBookmarkRepository.create({
        userId,
        questionId,
        chapterKey: chapter.chapterKey,
        chapterTitle: question.chapterTitle || chapter.title || '',
        chapterTitleAR: question.chapterTitleAR || ''
    });

    return {
        bookmarked: true,
        questionId,
        bookmark: {
            _id: created._id,
            questionId: created.questionId,
            chapterKey: created.chapterKey,
            chapterTitle: created.chapterTitle,
            chapterTitleAR: created.chapterTitleAR,
            createdAt: created.createdAt
        }
    };
};

const removeById = async (userId, id) => {
    ensureValidObjectId(id, 'Invalid bookmark id');
    const removed = await quizBookmarkRepository.deleteByIdAndUser(id, userId);
    if (!removed) {
        throw new ApiError(404, 'Bookmark not found');
    }
    return { message: 'Bookmark removed' };
};

module.exports = {
    listForChapter,
    toggle,
    removeById
};
