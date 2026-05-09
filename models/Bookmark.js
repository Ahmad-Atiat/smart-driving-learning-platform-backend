const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        chapterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson',
            required: true
        },
        chapterKey: {
            type: String,
            default: '',
            trim: true
        },
        subLessonIndex: {
            type: Number,
            required: true,
            min: 0
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        titleAR: {
            type: String,
            default: '',
            trim: true
        }
    },
    { timestamps: true }
);

bookmarkSchema.index(
    { userId: 1, chapterId: 1, subLessonIndex: 1 },
    { unique: true }
);

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;
