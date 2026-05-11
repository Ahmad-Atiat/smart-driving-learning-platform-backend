const quizBookmarkService = require('../services/quizBookmarkService');

const getChapterBookmarks = async (req, res, next) => {
    try {
        const bookmarks = await quizBookmarkService.listForChapter(
            req.user._id,
            req.params.chapterKey
        );
        return res.status(200).json(bookmarks);
    } catch (error) {
        next(error);
    }
};

const toggleBookmark = async (req, res, next) => {
    try {
        const result = await quizBookmarkService.toggle(req.user._id, req.body);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const deleteBookmark = async (req, res, next) => {
    try {
        const result = await quizBookmarkService.removeById(req.user._id, req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getChapterBookmarks,
    toggleBookmark,
    deleteBookmark
};
