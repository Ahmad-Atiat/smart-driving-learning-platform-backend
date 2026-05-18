const conversationService = require('../services/conversationService');

const buildBaseUrl = (req) => {
    if (process.env.BACKEND_PUBLIC_URL) {
        return process.env.BACKEND_PUBLIC_URL.replace(/\/+$/, '');
    }
    const forwardedProto = req.get('x-forwarded-proto');
    const forwardedHost = req.get('x-forwarded-host');
    if (forwardedProto && forwardedHost) {
        return `${forwardedProto}://${forwardedHost}`;
    }
    // req.get('host') reflects the Host header — the Angular dev proxy preserves
    // the front-end host (localhost:4200), which is not browser-reachable for
    // static /uploads files. Use the server's actual listening port instead.
    const port = req.socket?.localPort || process.env.PORT || 3000;
    const hostname = req.hostname || 'localhost';
    return `${req.protocol}://${hostname}:${port}`;
};

const toAbsoluteMediaUrl = (baseUrl, url) => {
    if (!url || typeof url !== 'string') return url;
    const trimmed = url.trim();
    if (!trimmed) return url;
    if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
    return trimmed.startsWith('/') ? `${baseUrl}${trimmed}` : `${baseUrl}/${trimmed}`;
};

const normalizeMessageMedia = (baseUrl, message) => {
    if (!message) return message;
    const plain = typeof message.toObject === 'function' ? message.toObject() : { ...message };
    if (plain.imageUrl) plain.imageUrl = toAbsoluteMediaUrl(baseUrl, plain.imageUrl);
    if (plain.videoUrl) plain.videoUrl = toAbsoluteMediaUrl(baseUrl, plain.videoUrl);
    if (plain.fileUrl) plain.fileUrl = toAbsoluteMediaUrl(baseUrl, plain.fileUrl);
    return plain;
};

const normalizeConversationMedia = (baseUrl, conversation) => {
    if (!conversation) return conversation;
    const plain = typeof conversation.toObject === 'function' ? conversation.toObject() : { ...conversation };
    if (Array.isArray(plain.messages)) {
        plain.messages = plain.messages.map((m) => normalizeMessageMedia(baseUrl, m));
    }
    if (plain.lastMessage) {
        plain.lastMessage = normalizeMessageMedia(baseUrl, plain.lastMessage);
    }
    return plain;
};

const createConversation = async (req, res, next) => {
    try {
        const conversation = await conversationService.createConversation(req.user._id, req.body?.title);
        const baseUrl = buildBaseUrl(req);
        return res.status(201).json(normalizeConversationMedia(baseUrl, conversation));
    } catch (error) {
        next(error);
    }
};

const getConversations = async (req, res, next) => {
    try {
        const conversations = await conversationService.getUserConversations(req.user._id);
        const baseUrl = buildBaseUrl(req);
        const normalized = conversations.map((c) => normalizeConversationMedia(baseUrl, c));
        return res.status(200).json(normalized);
    } catch (error) {
        next(error);
    }
};

const getConversationById = async (req, res, next) => {
    try {
        const conversation = await conversationService.getConversationById(req.params.id, req.user._id);
        const baseUrl = buildBaseUrl(req);
        return res.status(200).json(normalizeConversationMedia(baseUrl, conversation));
    } catch (error) {
        next(error);
    }
};

const sendMessage = async (req, res, next) => {
    try {
        const message = req.body?.message;
        const imageFile = req.files?.image?.[0] || null;
        const videoFile = req.files?.video?.[0] || null;
        const pdfFile = req.files?.file?.[0] || null;
        const externalImageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl : '';

        const result = await conversationService.sendMessage({
            conversationId: req.params.id,
            userId: req.user._id,
            message,
            imageFile,
            videoFile,
            pdfFile,
            externalImageUrl
        });

        const baseUrl = buildBaseUrl(req);
        const normalized = {
            conversation: normalizeConversationMedia(baseUrl, result.conversation),
            reply: result.reply
        };

        return res.status(200).json(normalized);
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
