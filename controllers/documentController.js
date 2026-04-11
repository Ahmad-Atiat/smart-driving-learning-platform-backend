const documentService = require('../services/documentService');

const uploadDocument = async (req, res, next) => {
    try {
        const document = await documentService.uploadDocument(req.file, req.user._id);
        return res.status(201).json(document);
    } catch (error) {
        next(error);
    }
};

const getAllDocuments = async (req, res, next) => {
    try {
        const documents = await documentService.getAllDocuments();
        return res.status(200).json(documents);
    } catch (error) {
        next(error);
    }
};

const deleteDocument = async (req, res, next) => {
    try {
        const result = await documentService.deleteDocument(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = { uploadDocument, getAllDocuments, deleteDocument };
