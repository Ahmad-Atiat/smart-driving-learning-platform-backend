const mongoose = require('mongoose');

const quizBookmarkSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true
        },
        chapterKey: {
            type: String,
            required: true,
            trim: true
        },
        chapterTitle: {
            type: String,
            default: '',
            trim: true
        },
        chapterTitleAR: {
            type: String,
            default: '',
            trim: true
        }
    },
    { timestamps: true }
);

quizBookmarkSchema.index(
    { userId: 1, chapterKey: 1, questionId: 1 },
    { unique: true }
);

const QuizBookmark = mongoose.model('QuizBookmark', quizBookmarkSchema);

module.exports = QuizBookmark;
