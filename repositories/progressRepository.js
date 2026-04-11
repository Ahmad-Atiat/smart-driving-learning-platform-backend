const Progress = require('../models/Progress');

const findByUserId = (userId) => Progress.findOne({ userId });

const createForUser = (userId) => Progress.create({ userId, completedLessons: [], quizResults: [], overallProgress: 0 });

const update = (id, data) => Progress.findByIdAndUpdate(id, data, { returnDocument: 'after' });

const resetProgress = (id) =>
    Progress.findByIdAndUpdate(id, { completedLessons: [], quizResults: [], overallProgress: 0 }, { returnDocument: 'after' });

const findAll = () => Progress.find().populate('userId', 'name email');

const deleteByUserId = (userId) => Progress.deleteMany({ userId });

module.exports = { findByUserId, createForUser, update, resetProgress, findAll, deleteByUserId };
