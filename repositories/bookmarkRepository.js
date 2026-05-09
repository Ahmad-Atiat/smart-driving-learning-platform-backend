const Bookmark = require('../models/Bookmark');

const findByUserId = (userId) =>
    Bookmark.find({ userId }).sort({ createdAt: -1 });

const findOneByOwner = (userId, chapterId, subLessonIndex) =>
    Bookmark.findOne({ userId, chapterId, subLessonIndex });

const findByIdAndUser = (id, userId) =>
    Bookmark.findOne({ _id: id, userId });

const create = (data) => Bookmark.create(data);

const deleteByIdAndUser = (id, userId) =>
    Bookmark.findOneAndDelete({ _id: id, userId });

const deleteByOwner = (userId, chapterId, subLessonIndex) =>
    Bookmark.findOneAndDelete({ userId, chapterId, subLessonIndex });

module.exports = {
    findByUserId,
    findOneByOwner,
    findByIdAndUser,
    create,
    deleteByIdAndUser,
    deleteByOwner
};
