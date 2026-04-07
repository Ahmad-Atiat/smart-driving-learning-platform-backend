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

const progressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        completedLessons: [
            {
                type: String
            }
        ],
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