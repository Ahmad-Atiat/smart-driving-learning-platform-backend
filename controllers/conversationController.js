const conversationService = require('../services/conversationService');

const createConversation = async (req, res, next) => {
    try {
        const conversation = await conversationService.createConversation(req.user._id, req.body?.title);
        return res.status(201).json(conversation);
    } catch (error) {
        next(error);
    }
};

const getConversations = async (req, res, next) => {
    try {
        const conversations = await conversationService.getUserConversations(req.user._id);
        return res.status(200).json(conversations);
    } catch (error) {
        next(error);
    }
};

const getConversationById = async (req, res, next) => {
    try {
        const conversation = await conversationService.getConversationById(req.params.id, req.user._id);
        return res.status(200).json(conversation);
    } catch (error) {
        next(error);
    }
};

const sendMessage = async (req, res, next) => {
    try {
        const message = req.body?.message;
        const imageFile = req.files?.image?.[0] || null;
        const pdfFile = req.files?.file?.[0] || null;

        const result = await conversationService.sendMessage({
            conversationId: req.params.id,
            userId: req.user._id,
            message,
            imageFile,
            pdfFile
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const deleteConversation = async (req, res, next) => {
    try {
        await conversationService.deleteConversation(req.params.id, req.user._id);
        return res.status(200).json({ message: 'Conversation deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createConversation,
    getConversations,
    getConversationById,
    sendMessage,
    deleteConversation
};
