const ChapterQuizProgress = require('../models/ChapterQuizProgress');

// Latest record for a user+chapter regardless of status.
// Used by getProgress to show existing state without filtering by status.
const findLatestByUserAndChapter = (userId, chapterTitle) =>
    ChapterQuizProgress.findOne({
        user: userId,
        chapterTitle
    }).sort({ createdAt: -1 });

// Only the current in-progress record.
// Used by saveAnswer / savePosition / complete so they never mutate a finished session.
const findInProgressByUserAndChapter = (userId, chapterTitle) =>
    ChapterQuizProgress.findOne({
        user: userId,
        status: 'in-progress',
        chapterTitle
    }).sort({ createdAt: -1 });

// Insert a new progress document
const create = (data) => ChapterQuizProgress.create(data);

// Partial update; returns the updated document to avoid a second round-trip
const updateById = (id, data) =>
    ChapterQuizProgress.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });

module.exports = {
    findLatestByUserAndChapter,
    findInProgressByUserAndChapter,
    create,
    updateById
};
