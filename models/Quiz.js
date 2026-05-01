const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            trim: true
        },
        options: {
            type: [String],
            required: true,
            validate: {
                validator: function (value) {
                    return value.length >= 2 && value.length <= 4;
                },
                message: "Quiz must have between 2 and 4 options"
            }
        },
        correctAnswer: {
            type: String,
            required: true
        },
        chapterTitle: {
            type: String,
            required: true
        },
        number: {
            type: Number
        },
        image: {
            type: String
        },
        questionAR: {
            type: String,
            trim: true
        },
        optionsAR: {
            type: [String]
        },
        correctAnswerAR: {
            type: String
        },
        explanationAR: {
            type: String,
            default: ""
        },
        chapterTitleAR: {
            type: String
        },
        explanation: {
            type: String,
            default: ""
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'easy'
        }
    },
    { timestamps: true }
);

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
