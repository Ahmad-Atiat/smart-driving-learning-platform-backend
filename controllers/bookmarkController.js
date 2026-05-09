const bookmarkService = require('../services/bookmarkService');

const listBookmarks = async (req, res, next) => {
    try {
        const bookmarks = await bookmarkService.getBookmarks(req.user._id);
        return res.status(200).json(bookmarks);
    } catch (error) {
        next(error);
    }
};

const createBookmark = async (req, res, next) => {
    try {
        const bookmark = await bookmarkService.addBookmark(req.user._id, req.body);
        return res.status(201).json(bookmark);
    } catch (error) {
        next(error);
    }
};

const deleteBookmark = async (req, res, next) => {
    try {
        const result = await bookmarkService.removeBookmarkById(req.user._id, req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const deleteBookmarkByLocation = async (req, res, next) => {
    try {
        const subLessonIndex = Number(req.query.subLessonIndex);
        const result = await bookmarkService.removeBookmarkByLocation(
            req.user._id,
            req.query.chapterId,
            subLessonIndex
        );
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listBookmarks,
    createBookmark,
    deleteBookmark,
    deleteBookmarkByLocation
};
