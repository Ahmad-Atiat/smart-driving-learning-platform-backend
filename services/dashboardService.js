const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const Document = require('../models/Document');

const isCompletedEntry = (entry, chapterId, subLessonIndex) =>
    entry &&
    typeof entry === 'object' &&
    entry.chapterId?.toString() === chapterId.toString() &&
    entry.subLessonIndex === subLessonIndex;

const getDashboardStats = async () => {
    const [
        totalUsers,
        totalStudents,
        totalAdmins,
        lessons,
        totalQuizQuestions,
        difficultyAgg,
        progressAgg,
        distributionAgg,
        quizAgg,
        totalDocuments,
        sizeAgg
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'admin' }),
        Lesson.find({ isPublished: true }),
        Quiz.countDocuments(),
        Quiz.aggregate([{ $group: { _id: '$difficulty', count: { $sum: 1 } } }]),
        Progress.aggregate([{ $group: { _id: null, avg: { $avg: '$overallProgress' }, total: { $sum: 1 } } }]),
        Progress.aggregate([
            {
                $bucket: {
                    groupBy: '$overallProgress',
                    boundaries: [0, 26, 51, 76, 101],
                    default: 'other',
                    output: { count: { $sum: 1 } }
                }
            }
        ]),
        Progress.aggregate([
            { $unwind: '$quizResults' },
            {
                $group: {
                    _id: null,
                    totalAttempts: { $sum: 1 },
                    avgScore: { $avg: '$quizResults.score' },
                    scores: { $push: { score: '$quizResults.score', total: '$quizResults.totalQuestions' } }
                }
            }
        ]),
        Document.countDocuments(),
        Document.aggregate([{ $group: { _id: null, totalSize: { $sum: '$size' } } }])
    ]);

    const totalChapters = lessons.length;
    const totalSubLessons = lessons.reduce((sum, l) => sum + l.lessons.length, 0);

    const questionsByDifficulty = {};
    for (const d of difficultyAgg) {
        questionsByDifficulty[d._id] = d.count;
    }

    const avgProgress = progressAgg.length ? Math.round(progressAgg[0].avg) : 0;
    const totalProgressUsers = progressAgg.length ? progressAgg[0].total : 0;

    const progressDistribution = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };
    const bucketMap = { 0: '0-25', 26: '26-50', 51: '51-75', 76: '76-100' };
    for (const b of distributionAgg) {
        if (bucketMap[b._id] !== undefined) {
            progressDistribution[bucketMap[b._id]] = b.count;
        }
    }

    const completedCount = distributionAgg.find((b) => b._id === 76);
    const completionRate =
        totalStudents > 0 && completedCount ? Math.round((completedCount.count / totalStudents) * 100) : 0;

    let totalAttempts = 0;
    let averageScore = 0;
    let passRate = 0;
    if (quizAgg.length) {
        totalAttempts = quizAgg[0].totalAttempts;
        averageScore = Math.round(quizAgg[0].avgScore);
        const passing = quizAgg[0].scores.filter((s) => s.total > 0 && (s.score / s.total) * 100 >= 70).length;
        passRate = totalAttempts > 0 ? Math.round((passing / totalAttempts) * 100) : 0;
    }

    return {
        users: { total: totalUsers, students: totalStudents, admins: totalAdmins },
        content: { totalChapters, totalSubLessons, totalQuizQuestions, questionsByDifficulty },
        progress: { averageProgress: avgProgress, completionRate, progressDistribution },
        quizzes: { totalAttempts, averageScore, passRate },
        documents: {
            totalDocuments,
            totalSize: sizeAgg.length ? sizeAgg[0].totalSize : 0
        }
    };
};

const getChapterReport = async () => {
    const [lessons, allProgress, quizCounts, quizAgg] = await Promise.all([
        Lesson.find({ isPublished: true }).sort({ order: 1 }),
        Progress.find({}),
        Quiz.aggregate([{ $group: { _id: '$chapterTitle', count: { $sum: 1 } } }]),
        Progress.aggregate([
            { $unwind: '$quizResults' },
            {
                $group: {
                    _id: '$quizResults.chapterTitle',
                    totalAttempts: { $sum: 1 },
                    avgScore: { $avg: '$quizResults.score' },
                    scores: { $push: { score: '$quizResults.score', total: '$quizResults.totalQuestions' } }
                }
            }
        ])
    ]);

    const totalStudents = allProgress.length || 1;

    const quizCountMap = {};
    for (const q of quizCounts) quizCountMap[q._id] = q.count;

    const quizStatsMap = {};
    for (const q of quizAgg) {
        const passing = q.scores.filter((s) => s.total > 0 && (s.score / s.total) * 100 >= 70).length;
        quizStatsMap[q._id] = {
            totalQuestions: quizCountMap[q._id] || 0,
            totalAttempts: q.totalAttempts,
            averageScore: Math.round(q.avgScore),
            passRate: q.totalAttempts > 0 ? Math.round((passing / q.totalAttempts) * 100) : 0
        };
    }

    return lessons.map((lesson) => {
        const completedCount = allProgress.filter((p) =>
            lesson.lessons.length > 0 &&
            lesson.lessons.every((_, index) =>
                p.completedLessons.some((entry) => isCompletedEntry(entry, lesson._id, index))
            )
        ).length;

        return {
            chapterTitle: lesson.title,
            totalSubLessons: lesson.lessons.length,
            completionRate: Math.round((completedCount / totalStudents) * 100),
            quizStats: quizStatsMap[lesson.title] || {
                totalQuestions: quizCountMap[lesson.title] || 0,
                totalAttempts: 0,
                averageScore: 0,
                passRate: 0
            }
        };
    });
};

const getRecentActivity = async () => {
    const recentUsers = await User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(10);

    const progressDocs = await Progress.find({ 'quizResults.0': { $exists: true } })
        .populate('userId', 'name email')
        .sort({ updatedAt: -1 })
        .limit(20);

    const recentQuizAttempts = [];
    for (const p of progressDocs) {
        if (!p.userId) continue;
        const lastResult = p.quizResults[p.quizResults.length - 1];
        if (lastResult) {
            recentQuizAttempts.push({
                userName: p.userId.name,
                userEmail: p.userId.email,
                chapterTitle: lastResult.chapterTitle,
                score: lastResult.score,
                totalQuestions: lastResult.totalQuestions,
                date: p.updatedAt
            });
        }
    }

    recentQuizAttempts.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
        recentUsers: recentUsers.map((u) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt
        })),
        recentQuizAttempts: recentQuizAttempts.slice(0, 10)
    };
};

module.exports = { getDashboardStats, getChapterReport, getRecentActivity };
