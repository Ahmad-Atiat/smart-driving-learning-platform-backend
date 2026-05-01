const Quiz = require('../models/Quiz');

const findAll = () => Quiz.find();

const findByChapter = (chapterTitle) => Quiz.find({ chapterTitle });

const findById = (id) => Quiz.findById(id);

const findByIds = (ids) => Quiz.find({ _id: { $in: ids } });

const findRandom = (count) => Quiz.aggregate([{ $sample: { size: count } }]);

const create = (data) => Quiz.create(data);

const updateById = (id, data) => Quiz.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });

const deleteById = (id) => Quiz.findByIdAndDelete(id);

module.exports = {
    findAll,
    findByChapter,
    findById,
    findByIds,
    findRandom,
    create,
    updateById,
    deleteById
};
