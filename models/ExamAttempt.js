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
        // Text of the selected option in English (null when only index was sent or question was skipped)
        selectedAnswer: {
            type: String,
            default: null
        },
        // Text of the selected option in Arabic (optional)
        selectedAnswerAR: {
            type: String,
            default: null
        },
        // Zero-based index of the selected option in the options array; null when skipped
        selectedIndex: {
            type: Number,
            default: null
        },
        // True when the user explicitly chose to skip this question.
        // Skipped questions count as empty for scoring (not wrong).
        skipped: {
            type: Boolean,
            default: false
        },
        // Evaluated at save time using the same matching logic as finalizeAttempt.
        // Stored so wrongCount can be computed cheaply per-save without re-fetching
        // all 60 questions. Not exposed in API responses during an active attempt.
        // null = skipped or not yet evaluated; true = correct; false = wrong.
        isCorrect: {
            type: Boolean,
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
        // Sparse array – only questions the user has interacted with are present
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
        // Percentage score 0-100, kept for backward compatibility
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
        },

        // ---------------------------------------------------------------
        // Real-exam scoring fields (populated on finalisation)
        // ---------------------------------------------------------------

        // True when correctCount >= 51 AND wrongCount < 9
        passed: {
            type: Boolean,
            default: null
        },
        // Number of questions answered correctly
        correctCount: {
            type: Number,
            default: null
        },
        // Number of questions answered incorrectly (excludes skipped and empty)
        wrongCount: {
            type: Number,
            default: null
        },
        // Number of questions never answered and not explicitly skipped
        emptyCount: {
            type: Number,
            default: null
        },
        // Number of questions the user explicitly skipped
        skippedCount: {
            type: Number,
            default: null
        },
        // Human-readable reason when passed === false; null when passed === true
        failureReason: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

// Compound index for the two most common active-attempt queries
examAttemptSchema.index({ user: 1, status: 1, expiresAt: 1 });

const ExamAttempt = mongoose.model('ExamAttempt', examAttemptSchema);

module.exports = ExamAttempt;
