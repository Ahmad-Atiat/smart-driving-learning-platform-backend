const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const progressRepository = require('../repositories/progressRepository');
const ApiError = require('../utils/apiError');

const getAllUsers = async () => {
    return await userRepository.findAll();
};

const deleteUser = async (userId) => {
    const user = await userRepository.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.email === 'admin@driving.com') {
        throw new ApiError(403, 'Cannot delete the primary admin account');
    }

    await progressRepository.deleteByUserId(userId);
    await userRepository.deleteById(userId);

    return { message: 'User deleted successfully' };
};

const updateUser = async (userId, { email, password }) => {
    const user = await userRepository.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const updateData = {};

    if (email) {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await userRepository.findByEmail(normalizedEmail);
        if (existing && existing._id.toString() !== userId) {
            throw new ApiError(400, 'Email already in use');
        }
        updateData.email = normalizedEmail;
    }

    if (password) {
        if (password.length < 6) {
            throw new ApiError(400, 'Password must be at least 6 characters');
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
    }

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, 'No fields to update. Provide email or password.');
    }

    const updated = await userRepository.updateById(userId, updateData);
    return updated;
};

module.exports = { getAllUsers, deleteUser, updateUser };
