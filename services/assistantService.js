const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const ApiError = require('../utils/apiError');
const progressRepository = require('../repositories/progressRepository');
const documentService = require('./documentService');

const SYSTEM_PROMPT = `You are a driving education assistant for the Drive Wise learning platform.
You help students with traffic rules, road signs, safe driving, driving lessons, quiz explanations, and exam preparation.
You ONLY answer driving-related questions. If a student asks something unrelated to driving, politely refuse and redirect them to driving topics.
If an image is uploaded, analyze it only in the driving education context.
If a PDF is uploaded, use its text as additional context for your answer.
Keep answers concise, educational, and practical. When explaining quiz mistakes, reference the correct traffic rule or law.
Always be encouraging and supportive of the student's learning journey.
When you have access to the student's learning context, use it to personalize your responses.
When you have access to knowledge base documents, prioritize information from those documents over your general knowledge.`;

const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_RETRIES = 3;
const MAX_HISTORY_ITEMS = 20;
const MAX_UPLOADED_PDF_CHARS = 15000;

let openai = null;

const getOpenAI = () => {
    if (!openai) {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new ApiError(503, 'AI assistant is not configured.');
        }

        openai = new OpenAI({ apiKey });
    }

    return openai;
};

const buildUserContext = async (userId) => {
    try {
        const progress = await progressRepository.findByUserId(userId);
        if (!progress) return '';

        return `User progress: ${progress.overallProgress}%`;
    } catch {
        return '';
    }
};

const buildKnowledgeBase = async () => {
    try {
        const documentsText = await documentService.getAllDocumentsText();
        return documentsText.map(doc => doc.text).join('\n');
    } catch {
        return '';
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeConversationHistory = (conversationHistory = []) => {
    if (!Array.isArray(conversationHistory)) {
        throw new ApiError(400, 'conversationHistory must be an array.');
    }

    return conversationHistory
        .slice(-MAX_HISTORY_ITEMS)
        .map((entry, index) => {
            if (!entry || typeof entry !== 'object') {
                throw new ApiError(400, `conversationHistory entry ${index + 1} must be an object.`);
            }

            const normalizedRole =
                entry.role === 'assistant' || entry.role === 'model'
                    ? 'assistant'
                    : entry.role === 'user'
                        ? 'user'
                        : null;

            const normalizedContent = typeof entry.content === 'string' ? entry.content.trim() : '';

            if (!normalizedRole || !normalizedContent) {
                throw new ApiError(
                    400,
                    `conversationHistory entry ${index + 1} must include a valid role and content.`
                );
            }

            return {
                role: normalizedRole,
                content: normalizedContent
            };
        });
};

const validateImageFile = (imageFile) => {
    if (!imageFile) {
        return;
    }

    if (!imageFile.mimetype || !imageFile.mimetype.startsWith('image/')) {
        throw new ApiError(415, 'Unsupported image type. Please upload a valid image file.');
    }

    if (!imageFile.buffer || !imageFile.buffer.length) {
        throw new ApiError(400, 'Uploaded image is empty.');
    }
};

const extractUploadedPdfText = async (pdfFile) => {
    if (!pdfFile) {
        return '';
    }

    if (pdfFile.mimetype !== 'application/pdf') {
        throw new ApiError(415, 'Unsupported file type. Only PDF files are supported.');
    }

    if (!pdfFile.buffer || !pdfFile.buffer.length) {
        throw new ApiError(400, 'Uploaded PDF is empty.');
    }

    try {
        const parsedPdf = await pdfParse(pdfFile.buffer);
        const pdfText = (parsedPdf.text || '').trim();

        if (!pdfText) {
            throw new ApiError(400, 'Uploaded PDF does not contain readable text.');
        }

        return pdfText.substring(0, MAX_UPLOADED_PDF_CHARS);
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(400, 'Failed to parse uploaded PDF. Please upload a valid PDF file.');
    }
};

const inferStatusCode = (error) => {
    const statusCode =
        Number(error?.status) ||
        Number(error?.statusCode) ||
        Number(error?.code) ||
        Number(error?.response?.status);

    if (statusCode) {
        return statusCode;
    }

    const message = (error?.message || '').toLowerCase();

    if (message.includes('429') || message.includes('quota') || message.includes('rate limit')) {
        return 429;
    }

    if (message.includes('503') || message.includes('unavailable') || message.includes('overloaded')) {
        return 503;
    }

    if (message.includes('400') || message.includes('invalid') || message.includes('bad request')) {
        return 400;
    }

    if (message.includes('401') || message.includes('unauthorized')) {
        return 401;
    }

    return 500;
};

const mapOpenAIErrorToApiError = (error) => {
    const statusCode = inferStatusCode(error);

    if (statusCode === 400) {
        return new ApiError(400, 'Invalid request sent to the AI assistant. Please review the message and uploads.');
    }

    if (statusCode === 401) {
        return new ApiError(503, 'AI assistant authentication failed. Please check the API key.');
    }

    if (statusCode === 429) {
        return new ApiError(429, 'AI assistant is temporarily unavailable due to usage limits. Please try again shortly.');
    }

    if (statusCode === 503) {
        return new ApiError(503, 'AI assistant is currently unavailable. Please try again in a few moments.');
    }

    return new ApiError(503, 'Failed to get a response from the AI assistant.');
};

const buildFallbackMessage = ({ hasImage, hasPdf }) => {
    if (hasImage && hasPdf) {
        return 'Please analyze the uploaded driving image using the uploaded PDF as additional context.';
    }

    if (hasImage) {
        return 'Please analyze the uploaded image in a driving education context.';
    }

    if (hasPdf) {
        return 'Please summarize and explain the uploaded PDF in a driving education context.';
    }

    return '';
};

const buildSystemPrompt = ({ userContext, knowledgeBase, uploadedPdfText }) => {
    const promptSections = [SYSTEM_PROMPT];

    if (userContext) {
        promptSections.push(`Student learning context:\n${userContext}`);
    }

    if (knowledgeBase) {
        promptSections.push(`Knowledge base documents:\n${knowledgeBase}`);
    }

    if (uploadedPdfText) {
        promptSections.push(`Uploaded PDF context:\n${uploadedPdfText}`);
    }

    return promptSections.join('\n\n');
};

const buildMessages = ({ message, conversationHistory, imageFile, fullSystemPrompt }) => {
    const history = normalizeConversationHistory(conversationHistory);

    const messages = [
        {
            role: 'system',
            content: fullSystemPrompt
        },
        ...history
    ];

    if (imageFile) {
        messages.push({
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: message
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`
                    }
                }
            ]
        });
    } else {
        messages.push({
            role: 'user',
            content: message
        });
    }

    return messages;
};

const chat = async ({ message, conversationHistory = [], userId, imageFile = null, pdfFile = null } = {}) => {
    validateImageFile(imageFile);

    const [userContext, knowledgeBase, uploadedPdfText] = await Promise.all([
        userId ? buildUserContext(userId) : '',
        buildKnowledgeBase(),
        extractUploadedPdfText(pdfFile)
    ]);

    const trimmedMessage = typeof message === 'string' ? message.trim() : '';
    const fallbackMessage = buildFallbackMessage({
        hasImage: Boolean(imageFile),
        hasPdf: Boolean(uploadedPdfText)
    });
    const effectiveMessage = trimmedMessage || fallbackMessage;

    if (!effectiveMessage) {
        throw new ApiError(400, 'Provide a message, image, or PDF file.');
    }

    const ai = getOpenAI();
    const fullSystemPrompt = buildSystemPrompt({ userContext, knowledgeBase, uploadedPdfText });
    const messages = buildMessages({
        message: effectiveMessage,
        conversationHistory,
        imageFile,
        fullSystemPrompt
    });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
        try {
            const result = await ai.chat.completions.create({
                model: MODEL_NAME,
                messages,
                temperature: 0.7
            });

            const reply = result?.choices?.[0]?.message?.content?.trim();

            if (!reply) {
                throw new ApiError(503, 'AI assistant returned an empty response.');
            }

            return { reply };

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            const statusCode = inferStatusCode(error);
            const isRetryable = (statusCode === 429 || statusCode === 503) && attempt < MAX_RETRIES;

            console.error('Assistant generation attempt failed:', {
                attempt,
                statusCode,
                message: error.message
            });

            if (isRetryable) {
                await delay(1000 * attempt);
                continue;
            }

            throw mapOpenAIErrorToApiError(error);
        }
    }

    throw new ApiError(503, 'AI assistant is currently unavailable. Please try again in a few moments.');
};

module.exports = { chat };