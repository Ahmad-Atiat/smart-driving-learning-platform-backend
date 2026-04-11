const Document = require('../models/Document');

const findAll = () => Document.find().populate('uploadedBy', 'name email').sort({ createdAt: -1 });

const findById = (id) => Document.findById(id);

const create = (data) => Document.create(data);

const deleteById = (id) => Document.findByIdAndDelete(id);

const countAll = () => Document.countDocuments();

const getTotalSize = () => Document.aggregate([{ $group: { _id: null, totalSize: { $sum: '$size' } } }]);

module.exports = { findAll, findById, create, deleteById, countAll, getTotalSize };
