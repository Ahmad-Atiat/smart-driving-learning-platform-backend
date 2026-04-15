const mongoose = require('mongoose');

const conversationMessageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            default: ''
        },
        imageUrl: {
            type: String,
            default: null
        },
        fileUrl: {
            type: String,
            default: null
        },
        fileName: {
            type: String,
            default: null
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

const conversationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            default: 'New Conversation',
            maxlength: 120
        },
        messages: [conversationMessageSchema]
    },
    { timestamps: true }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
