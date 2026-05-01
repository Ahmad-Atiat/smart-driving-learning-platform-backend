const mongoose = require('mongoose');

const subLessonSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        titleAR: {
            type: String,
            default: ""
        },
        content: {
            type: String,
            required: true
        },
        contentAR: {
            type: String,
            default: ""
        },
        image: {
            type: String,
            default: ""
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
        titleAR: {
            type: String,
            default: "",
            trim: true
        },
        descriptionAR: {
            type: String,
            default: "",
            trim: true
        },
        chapterKey: {
            type: String,
            required: true,
            unique: true,
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
