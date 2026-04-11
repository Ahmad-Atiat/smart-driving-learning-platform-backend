const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/apiError');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const buildAuthResponse = (message, user) => ({
    message,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
});

const register = async ({ name, email, password }) => {
    if (!name || !email || !password) {
        throw new ApiError(400, 'Please fill all fields');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await userRepository.findByEmail(normalizedEmail);

    if (existing) {
        throw new ApiError(400, 'User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userRepository.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword
    });

    return buildAuthResponse('User registered successfully', user);
};

const login = async ({ email, password }) => {
    if (!email || !password) {
        throw new ApiError(400, 'Please fill all fields');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
        throw new ApiError(400, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new ApiError(400, 'Invalid email or password');
    }

    return buildAuthResponse('Login successful', user);
};

module.exports = { register, login };
