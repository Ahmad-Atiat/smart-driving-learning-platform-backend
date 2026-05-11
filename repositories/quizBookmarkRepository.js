const QuizBookmark = require('../models/QuizBookmark');

const findByUserAndChapter = (userId, chapterKey) =>
    QuizBookmark.find({ userId, chapterKey }).sort({ createdAt: -1 });

const findOne = (userId, chapterKey, questionId) =>
    QuizBookmark.findOne({ userId, chapterKey, questionId });

const findByIdAndUser = (id, userId) =>
    QuizBookmark.findOne({ _id: id, userId });

const create = (data) => QuizBookmark.create(data);

const deleteByIdAndUser = (id, userId) =>
    QuizBookmark.findOneAndDelete({ _id: id, userId });

const deleteOne = (userId, chapterKey, questionId) =>
    QuizBookmark.findOneAndDelete({ userId, chapterKey, questionId });

module.exports = {
    findByUserAndChapter,
    findOne,
    findByIdAndUser,
    create,
    deleteByIdAndUser,
    deleteOne
};
