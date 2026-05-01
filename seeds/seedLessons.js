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

const shouldPrune = process.argv.includes('--prune');

const seedLessons = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error('MONGO_URI is not set in environment variables');
        }

        await mongoose.connect(mongoUri);

        const operations = withChapterKeys.map((lesson) => ({
            updateOne: {
                filter: {
                    $or: [
                        { chapterKey: lesson.chapterKey },
                        { title: lesson.title }
                    ]
                },
                update: { $set: lesson },
                upsert: true
            }
        }));

        const result = await Lesson.bulkWrite(operations, { ordered: false });

        if (shouldPrune) {
            const chapterKeys = withChapterKeys.map((lesson) => lesson.chapterKey);
            const titles = withChapterKeys.map((lesson) => lesson.title);
            const pruneResult = await Lesson.deleteMany({
                $or: [
                    { chapterKey: { $exists: true, $nin: chapterKeys } },
                    { chapterKey: { $exists: false }, title: { $nin: titles } }
                ]
            });
            console.log(`Removed ${pruneResult.deletedCount} lessons not in current seed.`);
        }

        console.log(`Lessons upserted successfully: matched=${result.matchedCount}, modified=${result.modifiedCount}, inserted=${result.upsertedCount}`);

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
