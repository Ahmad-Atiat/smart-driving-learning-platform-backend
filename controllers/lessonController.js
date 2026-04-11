const lessonService = require('../services/lessonService');

const getAllLessons = async (req, res, next) => {
    try {
        const lessons = await lessonService.getAllLessons(req.user);
        return res.status(200).json(lessons);
    } catch (error) {
        next(error);
    }
};

const getLessonById = async (req, res, next) => {
    try {
        const lesson = await lessonService.getLessonById(req.params.id);
        return res.status(200).json(lesson);
    } catch (error) {
        next(error);
    }
};

const completeSubLesson = async (req, res, next) => {
    try {
        const { subLessonTitle } = req.body;
        if (!subLessonTitle) {
            return res.status(400).json({ message: 'subLessonTitle is required' });
        }
        const result = await lessonService.completeSubLesson(req.user._id, req.params.id, subLessonTitle);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const createLesson = async (req, res, next) => {
    try {
        const lesson = await lessonService.createLesson(req.body);
        return res.status(201).json(lesson);
    } catch (error) {
        next(error);
    }
};

const updateLesson = async (req, res, next) => {
    try {
        const lesson = await lessonService.updateLesson(req.params.id, req.body);
        return res.status(200).json(lesson);
    } catch (error) {
        next(error);
    }
};

const deleteLesson = async (req, res, next) => {
    try {
        const result = await lessonService.deleteLesson(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllLessons, getLessonById, completeSubLesson, createLesson, updateLesson, deleteLesson };
