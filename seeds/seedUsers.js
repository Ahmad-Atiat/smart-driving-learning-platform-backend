const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

dotenv.config();

const usersData = [
    {
        name: 'Student User',
        email: 'student@driving.com',
        password: 'student123',
        role: 'student'
    },
    {
        name: 'Admin User',
        email: 'admin@driving.com',
        password: 'admin123',
        role: 'admin'
    }
];

const seedUsers = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error('MONGO_URI is not set in environment variables');
        }

        await mongoose.connect(mongoUri);

        const salt = await bcrypt.genSalt(10);
        const usersWithHashedPasswords = await Promise.all(
            usersData.map(async (user) => ({
                ...user,
                email: user.email.toLowerCase(),
                password: await bcrypt.hash(user.password, salt)
            }))
        );

        const operations = usersWithHashedPasswords.map((user) => ({
            updateOne: {
                filter: { email: user.email },
                update: { $set: user },
                upsert: true
            }
        }));

        const result = await User.bulkWrite(operations, { ordered: false });
        const totalUsers = await User.countDocuments();

        console.log(`${usersData.length} users processed successfully`);
        console.log(`User upsert result: matched=${result.matchedCount}, modified=${result.modifiedCount}, inserted=${result.upsertedCount}`);
        console.log(`User collection count: ${totalUsers}`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed users:', error.message);

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }

        process.exit(1);
    }
};

seedUsers();
