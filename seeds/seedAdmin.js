const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@driving.com';
        const existing = await User.findOne({ email: adminEmail });

        if (!existing) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await User.create({
                name: 'Admin User',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin'
            });

            console.log('Default admin account created (admin@driving.com / admin123)');
        }
    } catch (error) {
        console.error('Failed to seed admin:', error.message);
    }
};

module.exports = seedAdmin;
