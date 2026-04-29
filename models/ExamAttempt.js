const mongoose = require('mongoose');

// One answer record per question. _id is disabled because these are embedded
// subdocuments identified by questionId, not by their own _id.
const answerSchema = new mongoose.Schema(
    {
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true
        },
        // Text of the selected option in English (may be null if only index sent)
        selectedAnswer: {
            type: String,
            default: null
        },
        // Text of the selected option in Arabic (optional)
        selectedAnswerAR: {
            type: String,
            default: null
        },
        // Zero-based index of the selected option in the options array
        selectedIndex: {
            type: Number,
            default: null
        },
        answeredAt: {
            type: Date,
            default: null
        }
    },
    { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        // Ordered list of question ObjectIds selected for this attempt
        questions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Quiz',
                required: true
            }
        ],
        // Sparse array – only questions the user has answered are present
        answers: {
            type: [answerSchema],
            default: []
        },
        // in-progress: exam is running
        // submitted:   user explicitly submitted
        // expired:     time ran out or a new exam was started
        status: {
            type: String,
            enum: ['in-progress', 'submitted', 'expired'],
            default: 'in-progress',
            index: true
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        // Absolute UTC timestamp after which the attempt is considered expired
        expiresAt: {
            type: Date,
            required: true
        },
        submittedAt: {
            type: Date
        },
        // Percentage score 0-100 (set on finalisation)
        score: {
            type: Number,
            default: 0
        },
        totalQuestions: {
            type: Number,
            default: 60
        },
        // Full result objects including correct answers (set on finalisation only)
        results: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        }
    },
    { timestamps: true }
);

// Compound index for the two most common active-attempt queries
examAttemptSchema.index({ user: 1, status: 1, expiresAt: 1 });

const ExamAttempt = mongoose.model('ExamAttempt', examAttemptSchema);

module.exports = ExamAttempt;
