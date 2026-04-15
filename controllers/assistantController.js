const assistantService = require('../services/assistantService');
const ApiError = require('../utils/apiError');

const parseConversationHistory = (rawConversationHistory) => {
    if (rawConversationHistory === undefined || rawConversationHistory === null || rawConversationHistory === '') {
        return [];
    }

    if (Array.isArray(rawConversationHistory)) {
        return rawConversationHistory;
    }

    if (typeof rawConversationHistory === 'string') {
        try {
            const parsed = JSON.parse(rawConversationHistory);

            if (!Array.isArray(parsed)) {
                throw new ApiError(400, 'conversationHistory must be a JSON array.');
            }

            return parsed;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new ApiError(400, 'conversationHistory must be valid JSON.');
        }
    }

    throw new ApiError(400, 'conversationHistory must be an array.');
};

const chat = async (req, res, next) => {
    try {
        const { message, conversationHistory: rawConversationHistory } = req.body;
        const conversationHistory = parseConversationHistory(rawConversationHistory);
        const imageFile = req.files?.image?.[0] || null;
        const pdfFile = req.files?.file?.[0] || null;

        const result = await assistantService.chat({
            message,
            conversationHistory,
            userId: req.user._id,
            imageFile,
            pdfFile
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = { chat };
