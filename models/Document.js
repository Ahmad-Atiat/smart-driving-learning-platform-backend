const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        filename: {
            type: String,
            required: true
        },
        originalName: {
            type: String,
            required: true,
            trim: true
        },
        mimeType: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        path: {
            type: String,
            required: true
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
