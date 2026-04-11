const Lesson = require('../models/Lesson');

const findAllPublished = () => Lesson.find({ isPublished: true }).sort({ order: 1 });

const findAll = () => Lesson.find().sort({ order: 1 });

const findById = (id) => Lesson.findById(id);

const create = (data) => Lesson.create(data);

const updateById = (id, data) => Lesson.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });

const deleteById = (id) => Lesson.findByIdAndDelete(id);

const countAll = () => Lesson.countDocuments({ isPublished: true });

module.exports = { findAllPublished, findAll, findById, create, updateById, deleteById, countAll };
