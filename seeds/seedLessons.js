const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Lesson = require('../models/Lesson');
const lessons = require('./lessons');
const { getChapterByTitle } = require('../utils/chapterMetadata');

dotenv.config();

const withChapterKeys = lessons.map((lesson) => {
    const chapter = getChapterByTitle(lesson.title);
    if (!chapter) {
        throw new Error(`No chapterKey mapping found for lesson title: ${lesson.title}`);
    }

    return {
        ...lesson,
        chapterKey: chapter.chapterKey
    };
});

const seedLessons = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error('MONGO_URI is not set in environment variables');
        }

        await mongoose.connect(mongoUri);

        const { deletedCount } = await Lesson.deleteMany({});
        console.log(`Deleted ${deletedCount} existing lessons`);

        await Lesson.insertMany(withChapterKeys, { ordered: false });
        const totalLessons = await Lesson.countDocuments();

        console.log(`${withChapterKeys.length} lessons inserted successfully`);
        console.log(`Lesson collection count: ${totalLessons}`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed lessons:', error.message);

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }

        process.exit(1);
    }
};

seedLessons();
