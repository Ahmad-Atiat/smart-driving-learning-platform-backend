const User = require('../models/User');

const findByEmail = (email) => User.findOne({ email });

const findById = (id) => User.findById(id).select('-password');

const create = (data) => User.create(data);

const findAll = () => User.find().select('-password').sort({ createdAt: -1 });

const deleteById = (id) => User.findByIdAndDelete(id);

const updateById = (id, data) =>
    User.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).select('-password');

const countByRole = (role) => (role ? User.countDocuments({ role }) : User.countDocuments());

module.exports = { findByEmail, findById, create, findAll, deleteById, updateById, countByRole };
