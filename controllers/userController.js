const userService = require('../services/userService');

const getAllUsers = async (req, res, next) => {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const result = await userService.deleteUser(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllUsers, deleteUser, updateUser };
