const { GoogleGenerativeAI } = require('@google/generative-ai');
const ApiError = require('../utils/apiError');

const SYSTEM_PROMPT = `You are a driving education assistant for the DriveReady learning platform.
You help students learn traffic rules, understand road signs, prepare for driving exams, and explain quiz mistakes.
You ONLY answer driving-related questions. If a student asks something unrelated to driving, politely redirect them to ask about driving topics.
Keep answers concise and educational. When explaining quiz mistakes, reference the correct traffic rule or law.
Always be encouraging and supportive of the student's learning journey.`;

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

const chat = async (message, conversationHistory = []) => {
    if (!message || !message.trim()) {
        throw new ApiError(400, 'Message is required');
    }

    try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
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
