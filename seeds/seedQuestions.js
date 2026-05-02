const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Quiz = require('../models/Quiz');
const questions = require('./questions_final.json');

dotenv.config();

const seedQuestions = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error('MONGO_URI is not set in environment variables');
        }

        await mongoose.connect(mongoUri);

        const { deletedCount } = await Quiz.deleteMany({});
        console.log(`Deleted ${deletedCount} existing questions`);

        await Quiz.insertMany(questions, { ordered: false });
        const totalQuestions = await Quiz.countDocuments();

        console.log(`${questions.length} questions inserted successfully`);
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
