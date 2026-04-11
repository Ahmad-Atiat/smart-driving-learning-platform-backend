const quizRepository = require('../repositories/quizRepository');
const progressRepository = require('../repositories/progressRepository');
const ApiError = require('../utils/apiError');

const getAllQuizzes = async () => {
    const quizzes = await quizRepository.findAll();

    // Group by chapter
    const grouped = {};
    for (const quiz of quizzes) {
        if (!grouped[quiz.chapterTitle]) {
            grouped[quiz.chapterTitle] = [];
        }
        grouped[quiz.chapterTitle].push(quiz);
    }

    return grouped;
};

const getQuizzesByChapter = async (chapterTitle) => {
    const quizzes = await quizRepository.findByChapter(chapterTitle);
    if (quizzes.length === 0) {
        throw new ApiError(404, 'No quizzes found for this chapter');
    }
    return quizzes;
};

const getExamQuestions = async () => {
    const questions = await quizRepository.findRandom(10);
    // Remove correctAnswer and explanation for exam mode
    return questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        chapterTitle: q.chapterTitle,
        difficulty: q.difficulty
    }));
};

const submitQuiz = async (userId, answers) => {
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
        throw new ApiError(400, 'Answers array is required');
    }

    const questionIds = answers.map(a => a.questionId);
    const questions = await quizRepository.findByIds(questionIds);

    const questionMap = {};
    for (const q of questions) {
        questionMap[q._id.toString()] = q;
    }

    let correct = 0;
    const results = [];

    for (const answer of answers) {
        const question = questionMap[answer.questionId];
        if (!question) continue;

        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        if (isCorrect) correct++;

        results.push({
            questionId: answer.questionId,
            question: question.question,
            selectedAnswer: answer.selectedAnswer,
            correctAnswer: question.correctAnswer,
            isCorrect,
            explanation: question.explanation
        });
    }

    const totalQuestions = results.length;
    const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    // Save quiz result to progress
    let progress = await progressRepository.findByUserId(userId);
    if (!progress) {
        progress = await progressRepository.createForUser(userId);
    }

    // Determine chapter from the majority of questions
    const chapterCounts = {};
    for (const r of results) {
        const q = questionMap[r.questionId];
        if (q) {
            chapterCounts[q.chapterTitle] = (chapterCounts[q.chapterTitle] || 0) + 1;
        }
    }
    const chapterTitle = Object.keys(chapterCounts).sort((a, b) => chapterCounts[b] - chapterCounts[a])[0] || 'Exam';

    progress.quizResults.push({ chapterTitle, score, totalQuestions });
    await progressRepository.update(progress._id, { quizResults: progress.quizResults });

    return { score, totalQuestions, correct, results };
};

const createQuiz = async (data) => {
    return quizRepository.create(data);
};

const updateQuiz = async (id, data) => {
    const quiz = await quizRepository.updateById(id, data);
    if (!quiz) {
        throw new ApiError(404, 'Quiz question not found');
    }
    return quiz;
};

const deleteQuiz = async (id) => {
    const quiz = await quizRepository.deleteById(id);
    if (!quiz) {
        throw new ApiError(404, 'Quiz question not found');
    }
    return { message: 'Quiz question deleted successfully' };
};

module.exports = { getAllQuizzes, getQuizzesByChapter, getExamQuestions, submitQuiz, createQuiz, updateQuiz, deleteQuiz };
