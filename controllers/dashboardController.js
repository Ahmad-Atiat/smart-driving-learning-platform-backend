const dashboardService = require('../services/dashboardService');

const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await dashboardService.getDashboardStats();
        return res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
};

const getChapterReport = async (req, res, next) => {
    try {
        const report = await dashboardService.getChapterReport();
        return res.status(200).json(report);
    } catch (error) {
        next(error);
    }
};

const getRecentActivity = async (req, res, next) => {
    try {
        const activity = await dashboardService.getRecentActivity();
        return res.status(200).json(activity);
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats, getChapterReport, getRecentActivity };
