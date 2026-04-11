const User = require('../models/User');

const findByEmail = (email) => User.findOne({ email });

const findById = (id) => User.findById(id).select('-password');

const create = (data) => User.create(data);

module.exports = { findByEmail, findById, create };
