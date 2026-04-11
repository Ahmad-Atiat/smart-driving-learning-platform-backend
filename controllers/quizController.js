const quizService = require('../services/quizService');

const getAllQuizzes = async (req, res, next) => {
    try {
        const quizzes = await quizService.getAllQuizzes();
        return res.status(200).json(quizzes);
    } catch (error) {
        next(error);
    }
};

const getQuizzesByChapter = async (req, res, next) => {
    try {
        const quizzes = await quizService.getQuizzesByChapter(req.params.chapterTitle);
        return res.status(200).json(quizzes);
    } catch (error) {
        next(error);
    }
};

const getExamQuestions = async (req, res, next) => {
    try {
        const questions = await quizService.getExamQuestions();
        return res.status(200).json(questions);
    } catch (error) {
        next(error);
    }
};

const submitQuiz = async (req, res, next) => {
    try {
        const result = await quizService.submitQuiz(req.user._id, req.body.answers);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const createQuiz = async (req, res, next) => {
    try {
        const quiz = await quizService.createQuiz(req.body);
        return res.status(201).json(quiz);
    } catch (error) {
        next(error);
    }
};

const updateQuiz = async (req, res, next) => {
    try {
        const quiz = await quizService.updateQuiz(req.params.id, req.body);
        return res.status(200).json(quiz);
    } catch (error) {
        next(error);
    }
};

const deleteQuiz = async (req, res, next) => {
    try {
        const result = await quizService.deleteQuiz(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllQuizzes, getQuizzesByChapter, getExamQuestions, submitQuiz, createQuiz, updateQuiz, deleteQuiz };
