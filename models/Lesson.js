const mongoose = require('mongoose');

const subLessonSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        }
    },
    { _id: false }
);

const lessonSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        image: {
            type: String,
            default: ""
        },
        order: {
            type: Number,
            required: true
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        lessons: [subLessonSchema]
    },
    { timestamps: true }
);

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;