const mongoose = require('mongoose');

// One answer record per question; _id is suppressed because answers are
// identified by questionId, not by their own document id.
const answerSchema = new mongoose.Schema(
    {
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true
        },
        // Text of the selected option in English (null when only index was sent)
        selectedAnswer: { type: String, default: null },
        // Text of the selected option in Arabic (optional)
        selectedAnswerAR: { type: String, default: null },
        // Zero-based index into the options array
        selectedIndex: { type: Number, default: null },
        // Computed at save time; stored so history is cheap to rebuild
        isCorrect: { type: Boolean, default: false },
        answeredAt: { type: Date, default: null }
    },
    { _id: false }
);

const chapterQuizProgressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Matches Quiz.chapterTitle – plain string, not a reference
        chapterTitle: {
            type: String,
            required: true,
            trim: true
        },
        // Index of the question the user was on when they last left; used to
        // resume from the same position.
        currentQuestionIndex: {
            type: Number,
            default: 0
        },
        // Sparse: only questions that have been answered are present
        answers: {
            type: [answerSchema],
            default: []
        },
        // in-progress: quiz is active and resumable
        // completed:   user explicitly marked the quiz done
        status: {
            type: String,
            enum: ['in-progress', 'completed'],
            default: 'in-progress'
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: {
            type: Date
        }
    },
    { timestamps: true }
);

// Supports fast lookups of the active progress for a given user+chapter
chapterQuizProgressSchema.index({ user: 1, chapterTitle: 1, status: 1 });

const ChapterQuizProgress = mongoose.model('ChapterQuizProgress', chapterQuizProgressSchema);

module.exports = ChapterQuizProgress;
