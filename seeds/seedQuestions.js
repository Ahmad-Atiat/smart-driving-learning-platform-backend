const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Quiz = require('../models/Quiz');
const questions = require('./questions_final.json');

dotenv.config();

const buildFilter = (question) => {
    if (Number.isFinite(question.number)) {
        return {
            number: question.number,
            chapterTitle: question.chapterTitle
        };
    }

    return {
        question: question.question,
        chapterTitle: question.chapterTitle
    };
};

const seedQuestions = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error('MONGO_URI is not set in environment variables');
        }

        await mongoose.connect(mongoUri);

        const operations = questions.map((question) => ({
            updateOne: {
                filter: buildFilter(question),
                update: { $set: question },
                upsert: true
            }
        }));

        const result = await Quiz.bulkWrite(operations, { ordered: false });
        const totalQuestions = await Quiz.countDocuments();

        console.log(`${questions.length} questions processed successfully`);
        console.log(`Quiz upsert result: matched=${result.matchedCount}, modified=${result.modifiedCount}, inserted=${result.upsertedCount}`);
        console.log(`Quiz collection count: ${totalQuestions}`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed questions:', error.message);

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }

        process.exit(1);
    }
};

seedQuestions();
