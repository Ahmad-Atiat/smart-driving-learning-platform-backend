const progressService = require('../services/progressService');

const getProgress = async (req, res, next) => {
    try {
        const progress = await progressService.getProgress(req.user._id);
        return res.status(200).json(progress);
    } catch (error) {
        next(error);
    }
};

const getProgressSummary = async (req, res, next) => {
    try {
        const summary = await progressService.getProgressSummary(req.user._id);
        return res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

const resetProgress = async (req, res, next) => {
    try {
        const result = await progressService.resetProgress(req.user._id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = { getProgress, getProgressSummary, resetProgress };
