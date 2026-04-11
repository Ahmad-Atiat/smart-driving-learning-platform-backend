const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const documentRepository = require('../repositories/documentRepository');
const ApiError = require('../utils/apiError');

const uploadDocument = async (file, uploadedByUserId) => {
    if (!file) {
        throw new ApiError(400, 'No file uploaded');
    }

    const document = await documentRepository.create({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedBy: uploadedByUserId
    });

    return document;
};

const getAllDocuments = async () => {
    return await documentRepository.findAll();
};

const deleteDocument = async (documentId) => {
    const document = await documentRepository.findById(documentId);
    if (!document) {
        throw new ApiError(404, 'Document not found');
    }

    try {
        await fs.promises.unlink(document.path);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error('Failed to delete file from disk:', err.message);
        }
    }

    await documentRepository.deleteById(documentId);
    return { message: 'Document deleted successfully' };
};

const extractTextFromDocument = async (document) => {
    try {
        const filePath = document.path;

        if (document.mimeType === 'application/pdf') {
            const dataBuffer = await fs.promises.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        }

        if (
            document.mimeType === 'application/msword' ||
            document.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        }

        if (document.mimeType === 'text/plain') {
            return await fs.promises.readFile(filePath, 'utf-8');
        }

        return '';
    } catch (error) {
        console.error(`Failed to extract text from ${document.originalName}:`, error.message);
        return '';
    }
};

const MAX_TOTAL_CHARS = 50000;

const getAllDocumentsText = async () => {
    const documents = await documentRepository.findAll();
    if (!documents.length) return [];

    const results = [];
    let totalChars = 0;

    for (const doc of documents) {
        if (totalChars >= MAX_TOTAL_CHARS) break;

        const text = await extractTextFromDocument(doc);
        if (!text) continue;

        const remaining = MAX_TOTAL_CHARS - totalChars;
        const truncatedText = text.length > remaining ? text.substring(0, remaining) : text;
        totalChars += truncatedText.length;

        results.push({ name: doc.originalName, text: truncatedText });
    }

    return results;
};

module.exports = { uploadDocument, getAllDocuments, deleteDocument, extractTextFromDocument, getAllDocumentsText };
