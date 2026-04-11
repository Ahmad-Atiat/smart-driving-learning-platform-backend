const authService = require('../services/authService');

// @desc Register new user
// @route POST /api/auth/register
const registerUser = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        return res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

// @desc Login user
// @route POST /api/auth/login
const loginUser = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
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

module.exports = { registerUser, loginUser, getCurrentUser };
