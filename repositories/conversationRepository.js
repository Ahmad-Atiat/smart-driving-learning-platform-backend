const Conversation = require('../models/Conversation');

const create = (data) => Conversation.create(data);

const findById = (id) => Conversation.findById(id);

const findByUserId = (userId) => Conversation.find({ userId }).sort({ updatedAt: -1 });

const addMessage = (conversationId, message) =>
    Conversation.findByIdAndUpdate(
        conversationId,
        { $push: { messages: message } },
        { returnDocument: 'after', runValidators: true }
    );

const updateById = (conversationId, data) =>
    Conversation.findByIdAndUpdate(conversationId, data, { returnDocument: 'after', runValidators: true });

const deleteById = (id) => Conversation.findByIdAndDelete(id);

module.exports = { create, findById, findByUserId, addMessage, updateById, deleteById };
