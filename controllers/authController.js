const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not set in environment variables');
    }

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

const normalizeEmail = (email) => email.trim().toLowerCase();

// @desc Register new user
// @route POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Please fill all fields'
            });
        }

        const normalizedEmail = normalizeEmail(email);
        const userExists = await User.findOne({ email: normalizedEmail });

        if (userExists) {
            return res.status(400).json({
                message: 'User already exists'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        return res.status(201).json(buildAuthResponse('User registered successfully', user));
    } catch (error) {
        console.error('Register user error:', error.message);
        return res.status(500).json({
            message: 'Server error'
        });
    }
};

// @desc Login user
// @route POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Please fill all fields'
            });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        return res.status(200).json(buildAuthResponse('Login successful', user));
    } catch (error) {
        console.error('Login user error:', error.message);
        return res.status(500).json({
            message: 'Server error'
        });
    }
};

// @desc Get current authenticated user
// @route GET /api/auth/me
const getCurrentUser = async (req, res) => {
    return res.status(200).json({
        message: 'Authenticated user fetched successfully',
        user: req.user
    });
};

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser
};
