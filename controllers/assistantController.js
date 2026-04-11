const assistantService = require('../services/assistantService');

const chat = async (req, res, next) => {
    try {
        const { message, conversationHistory } = req.body;
        const result = await assistantService.chat(message, conversationHistory, req.user._id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = { chat };
