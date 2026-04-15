const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const conversationRepository = require('../repositories/conversationRepository');
const assistantService = require('./assistantService');
const ApiError = require('../utils/apiError');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const DEFAULT_TITLE = 'New Conversation';
const MAX_TITLE_LENGTH = 80;

const IMAGE_EXTENSION_BY_MIME = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff'
};

const ensureValidConversationId = (conversationId) => {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new ApiError(400, 'Invalid conversation id');
    }
};

const getOwnedConversation = async (conversationId, userId) => {
    ensureValidConversationId(conversationId);

    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
    }

    if (conversation.userId.toString() !== userId.toString()) {
        throw new ApiError(403, 'You are not authorized to access this conversation');
    }

    return conversation;
};

const sanitizeBaseFileName = (fileName) => {
    return String(fileName || 'upload')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50) || 'upload';
};

const getImageExtension = (file) => {
    if (IMAGE_EXTENSION_BY_MIME[file.mimetype]) {
        return IMAGE_EXTENSION_BY_MIME[file.mimetype];
    }

    const extension = path.extname(file.originalname || '').toLowerCase();
    return extension || '.img';
};

const persistImageUpload = async (imageFile) => {
    if (!imageFile) {
        return null;
    }

    if (!imageFile.mimetype || !imageFile.mimetype.startsWith('image/')) {
        throw new ApiError(415, 'Unsupported image type. Please upload a valid image file.');
    }

    if (!imageFile.buffer || !imageFile.buffer.length) {
        throw new ApiError(400, 'Uploaded image is empty.');
    }

    const baseName = sanitizeBaseFileName(path.parse(imageFile.originalname || 'image').name);
    const extension = getImageExtension(imageFile);
    const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${baseName}${extension}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    await fs.promises.writeFile(filePath, imageFile.buffer);

    return {
        imageUrl: `/uploads/${fileName}`
    };
};

const persistPdfUpload = async (pdfFile) => {
    if (!pdfFile) {
        return null;
    }

    if (pdfFile.mimetype !== 'application/pdf') {
        throw new ApiError(415, 'Unsupported file type. Only PDF files are supported.');
    }

    if (!pdfFile.buffer || !pdfFile.buffer.length) {
        throw new ApiError(400, 'Uploaded PDF is empty.');
    }

    const baseName = sanitizeBaseFileName(path.parse(pdfFile.originalname || 'document').name);
    const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${baseName}.pdf`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    await fs.promises.writeFile(filePath, pdfFile.buffer);

    return {
        fileUrl: `/uploads/${fileName}`,
        fileName: pdfFile.originalname || fileName
    };
};

const buildHistoryContent = (message) => {
    const text = typeof message.content === 'string' ? message.content.trim() : '';
    if (text) {
        return text;
    }

    if (message.role === 'user') {
        if (message.imageUrl && message.fileUrl) {
            return 'User shared a driving-related image and a PDF document.';
        }

        if (message.imageUrl) {
            return 'User shared a driving-related image.';
        }

        if (message.fileUrl) {
            return 'User shared a driving-related PDF document.';
        }
    }

    return '';
};

const buildConversationHistory = (messages = []) => {
    return messages
        .map((message) => {
            const content = buildHistoryContent(message);
            if (!content) {
                return null;
            }

            return {
                role: message.role === 'assistant' ? 'assistant' : 'user',
                content
            };
        })
        .filter(Boolean);
};

const deriveConversationTitle = ({ currentTitle, message, hasImage, hasPdf }) => {
    const normalizedTitle = typeof currentTitle === 'string' ? currentTitle.trim() : '';

    if (normalizedTitle && normalizedTitle !== DEFAULT_TITLE) {
        return normalizedTitle;
    }

    if (message) {
        return message.length > MAX_TITLE_LENGTH ? `${message.slice(0, MAX_TITLE_LENGTH)}...` : message;
    }

    if (hasImage && hasPdf) {
        return 'Driving Image and PDF Discussion';
    }

    if (hasImage) {
        return 'Driving Image Discussion';
    }

    if (hasPdf) {
        return 'Driving PDF Discussion';
    }

    return DEFAULT_TITLE;
};

const createConversation = async (userId, title) => {
    const normalizedTitle = typeof title === 'string' ? title.trim() : '';

    return conversationRepository.create({
        userId,
        title: normalizedTitle || DEFAULT_TITLE,
        messages: []
    });
};

const getUserConversations = async (userId) => {
    const conversations = await conversationRepository.findByUserId(userId);

    return conversations.map((conversation) => {
        const lastMessage = conversation.messages.length
            ? conversation.messages[conversation.messages.length - 1]
            : null;

        return {
            _id: conversation._id,
            title: conversation.title,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messageCount: conversation.messages.length,
            lastMessage: lastMessage
                ? {
                    role: lastMessage.role,
                    content: lastMessage.content,
                    imageUrl: lastMessage.imageUrl,
                    fileUrl: lastMessage.fileUrl,
                    fileName: lastMessage.fileName,
                    createdAt: lastMessage.createdAt
                }
                : null
        };
    });
};

const getConversationById = async (conversationId, userId) => {
    return getOwnedConversation(conversationId, userId);
};

const sendMessage = async ({ conversationId, userId, message, imageFile = null, pdfFile = null }) => {
    const conversation = await getOwnedConversation(conversationId, userId);

    const normalizedMessage = typeof message === 'string' ? message.trim() : '';

    if (!normalizedMessage && !imageFile && !pdfFile) {
        throw new ApiError(400, 'Provide a message, image, or PDF file.');
    }

    const [savedImage, savedPdf] = await Promise.all([
        persistImageUpload(imageFile),
        persistPdfUpload(pdfFile)
    ]);

    const userMessagePayload = {
        role: 'user',
        content: normalizedMessage,
        imageUrl: savedImage?.imageUrl || null,
        fileUrl: savedPdf?.fileUrl || null,
        fileName: savedPdf?.fileName || null,
        createdAt: new Date()
    };

    const conversationHistory = buildConversationHistory(conversation.messages);

    await conversationRepository.addMessage(conversationId, userMessagePayload);

    const nextTitle = deriveConversationTitle({
        currentTitle: conversation.title,
        message: normalizedMessage,
        hasImage: Boolean(savedImage),
        hasPdf: Boolean(savedPdf)
    });

    if (nextTitle !== conversation.title) {
        await conversationRepository.updateById(conversationId, { title: nextTitle });
    }

    const assistantResult = await assistantService.chat({
        message: normalizedMessage,
        conversationHistory,
        userId,
        imageFile,
        pdfFile
    });

    const assistantMessagePayload = {
        role: 'assistant',
        content: assistantResult.reply,
        createdAt: new Date()
    };

    const updatedConversation = await conversationRepository.addMessage(conversationId, assistantMessagePayload);

    return {
        conversation: updatedConversation,
        reply: assistantResult.reply
    };
};

module.exports = {
    createConversation,
    getUserConversations,
    getConversationById,
    sendMessage
};
