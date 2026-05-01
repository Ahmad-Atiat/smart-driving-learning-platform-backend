const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema(
    {
        chapterTitle: {
            type: String,
            required: true
        },
        score: {
            type: Number,
            required: true
        },
        totalQuestions: {
            type: Number,
            required: true
        }
    },
    { _id: false }
);

const completedLessonSchema = new mongoose.Schema(
    {
        chapterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson',
            required: true
        },
        subLessonIndex: {
            type: Number,
            required: true,
            min: 0
        },
        completedAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

const progressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        completedLessons: [completedLessonSchema],
        quizResults: [quizResultSchema],
        overallProgress: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress;
