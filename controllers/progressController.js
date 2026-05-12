const progressService = require('../services/progressService');

const getProgress = async (req, res, next) => {
    try {
        const progress = await progressService.getProgress(req.user._id);
        return res.status(200).json(progress);
    } catch (error) {
        next(error);
    }
};

const getLessonProgress = async (req, res, next) => {
    try {
        const progress = await progressService.getLessonProgress(req.user._id);
        return res.status(200).json(progress);
    } catch (error) {
        next(error);
    }
};

const completeLessonProgress = async (req, res, next) => {
    try {
        const result = await progressService.completeLessonProgress(req.user._id, req.body);
        return res.status(200).json(result);
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

const getActivity = async (req, res, next) => {
    try {
        const range = typeof req.query.range === 'string' ? req.query.range : '30d';
        const result = await progressService.getActivity(req.user._id, range);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getChapterStrength = async (req, res, next) => {
    try {
        const range = typeof req.query.range === 'string' ? req.query.range : '30d';
        const result = await progressService.getChapterStrength(req.user._id, range);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProgress,
    getLessonProgress,
    completeLessonProgress,
    getProgressSummary,
    resetProgress,
    getActivity,
    getChapterStrength
};
