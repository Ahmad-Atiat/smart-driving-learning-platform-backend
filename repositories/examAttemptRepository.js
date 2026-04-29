const ExamAttempt = require('../models/ExamAttempt');

// Insert a new attempt document
const create = (data) => ExamAttempt.create(data);

// Fetch any attempt by its primary key (no status filter – used for submit/details)
const findById = (id) => ExamAttempt.findById(id);

// Returns the latest in-progress attempt that has NOT yet passed its expiry time.
// Used to decide whether a resume is possible and to invalidate before a new start.
const findActiveByUserId = (userId, now) =>
    ExamAttempt.findOne({
        user: userId,
        status: 'in-progress',
        expiresAt: { $gt: now }
    }).sort({ startedAt: -1 });

// Returns the latest in-progress attempt regardless of expiry time.
// Used to clean up naturally-expired attempts that were never explicitly submitted.
const findLatestInProgressByUserId = (userId) =>
    ExamAttempt.findOne({ user: userId, status: 'in-progress' }).sort({ startedAt: -1 });

// Returns all completed attempts (submitted or expired) for the history list
const findHistoryByUserId = (userId) =>
    ExamAttempt.find({ user: userId, status: { $in: ['submitted', 'expired'] } }).sort({ createdAt: -1 });

// Partial update – returns the updated document so callers don't need a second fetch
const updateById = (id, data) =>
    ExamAttempt.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });

module.exports = {
    create,
    findById,
    findActiveByUserId,
    findLatestInProgressByUserId,
    findHistoryByUserId,
    updateById
};
