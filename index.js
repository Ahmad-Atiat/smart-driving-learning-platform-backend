const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const quizRoutes = require('./routes/quizRoutes');
const examAttemptRoutes = require('./routes/examAttemptRoutes');
const chapterQuizProgressRoutes = require('./routes/chapterQuizProgressRoutes');
const progressRoutes = require('./routes/progressRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const swaggerSpec = require('./swagger');

const app = express();
const uploadsDir = path.join(__dirname, 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Smart Driving API is running',
        docs: '/api-docs'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/exam-attempts', examAttemptRoutes);
app.use('/api/chapter-quiz-progress', chapterQuizProgressRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
