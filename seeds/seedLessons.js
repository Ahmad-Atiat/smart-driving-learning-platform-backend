const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Lesson = require('../models/Lesson');
const lessons = require('./Lessons/index.js');
const { getChapterByTitle } = require('../utils/chapterMetadata');

dotenv.config();

const withChapterKeys = lessons.map((lesson) => {
    const chapter =
        getChapterByTitle(lesson.title) || getChapterByTitle(lesson.titleAR);
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

        let upserted = 0;
        let modified = 0;
        for (const lesson of withChapterKeys) {
            const result = await Lesson.updateOne(
                { chapterKey: lesson.chapterKey },
                { $set: lesson },
                { upsert: true }
            );

            if (result.upsertedCount) upserted += result.upsertedCount;
            if (result.modifiedCount) modified += result.modifiedCount;
        }

        const seededKeys = withChapterKeys.map((l) => l.chapterKey);
        const { deletedCount } = await Lesson.deleteMany({
            chapterKey: { $nin: seededKeys }
        });

        const totalLessons = await Lesson.countDocuments();

        console.log(`Inserted: ${upserted}`);
        console.log(`Updated:  ${modified}`);
        console.log(`Removed stale chapters: ${deletedCount}`);
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
