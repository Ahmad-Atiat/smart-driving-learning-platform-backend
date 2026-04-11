const { GoogleGenerativeAI } = require('@google/generative-ai');
const ApiError = require('../utils/apiError');
const progressRepository = require('../repositories/progressRepository');
const documentService = require('./documentService');

const SYSTEM_PROMPT = `You are a driving education assistant for the DriveReady learning platform.
You help students learn traffic rules, understand road signs, prepare for driving exams, and explain quiz mistakes.
You ONLY answer driving-related questions. If a student asks something unrelated to driving, politely redirect them to ask about driving topics.
Keep answers concise and educational. When explaining quiz mistakes, reference the correct traffic rule or law.
Always be encouraging and supportive of the student's learning journey.
When you have access to the student's learning context, use it to personalize your responses.
When you have access to knowledge base documents, prioritize information from those documents over your general knowledge.`;

let genAI = null;

const getGenAI = () => {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new ApiError(503, 'AI assistant is not configured. Please set GEMINI_API_KEY in the environment.');
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

const buildUserContext = async (userId) => {
    try {
        const progress = await progressRepository.findByUserId(userId);
        if (!progress) {
            return '\n--- USER LEARNING CONTEXT ---\nThis student has not started any lessons yet and has no quiz history.';
        }

        const lines = ['\n--- USER LEARNING CONTEXT ---'];
        lines.push(`Overall progress: ${progress.overallProgress}%`);

        if (progress.completedLessons.length > 0) {
            lines.push(`Completed lessons: ${progress.completedLessons.join(', ')}`);
        } else {
            lines.push('Completed lessons: None yet');
        }

        if (progress.quizResults.length > 0) {
            lines.push('Quiz results:');
            for (const qr of progress.quizResults) {
                const pct = qr.totalQuestions > 0 ? Math.round((qr.score / qr.totalQuestions) * 100) : 0;
                lines.push(`  - ${qr.chapterTitle}: ${qr.score}/${qr.totalQuestions} (${pct}%)`);
            }

            const lowScores = progress.quizResults.filter(
                (qr) => qr.totalQuestions > 0 && (qr.score / qr.totalQuestions) < 0.7
            );
            if (lowScores.length > 0) {
                const weakChapters = [...new Set(lowScores.map((qr) => qr.chapterTitle))];
                lines.push(`Focus areas (low scores): ${weakChapters.join(', ')}`);
            }
        } else {
            lines.push('Quiz results: No quizzes taken yet');
        }

        return lines.join('\n');
    } catch (error) {
        console.error('Failed to build user context:', error.message);
        return '';
    }
};

const buildKnowledgeBase = async () => {
    try {
        const documentsText = await documentService.getAllDocumentsText();
        if (!documentsText.length) return '';

        const lines = ['\n--- KNOWLEDGE BASE (Reference Materials) ---'];
        lines.push('When answering questions, prioritize information from these official documents over your general knowledge.\n');

        for (const doc of documentsText) {
            lines.push(`[Document: "${doc.name}"]`);
            lines.push(doc.text);
            lines.push('');
        }

        return lines.join('\n');
    } catch (error) {
        console.error('Failed to build knowledge base:', error.message);
        return '';
    }
};

const chat = async (message, conversationHistory = [], userId) => {
    if (!message || !message.trim()) {
        throw new ApiError(400, 'Message is required');
    }

    try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Build enhanced system prompt with user context and knowledge base
        const [userContext, knowledgeBase] = await Promise.all([
            userId ? buildUserContext(userId) : Promise.resolve(''),
            buildKnowledgeBase()
        ]);

        const fullSystemPrompt = [SYSTEM_PROMPT, userContext, knowledgeBase].filter(Boolean).join('\n');

        // Build conversation contents for Gemini
        const contents = [];

        // Add conversation history
        for (const entry of conversationHistory) {
            contents.push({
                role: entry.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: entry.content }]
            });
        }

        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const result = await model.generateContent({
            contents,
            systemInstruction: { parts: [{ text: fullSystemPrompt }] }
        });

        const response = result.response;
        const reply = response.text();

        return { reply };
    } catch (error) {
        if (error instanceof ApiError) throw error;

        console.error('AI Assistant error:', error.message);

        // Handle rate limiting
        if (error.status === 429) {
            return { reply: 'The assistant is receiving too many requests right now. Please try again in a moment.' };
        }

        return { reply: "I'm sorry, the assistant is temporarily unavailable. Please try again later." };
    }
};

module.exports = { chat };
