const express = require('express');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./routes/authRoutes');
const swaggerSpec = require('./swagger');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Smart Driving API is running',
        docs: '/api-docs'
    });
});

app.use('/api/auth', authRoutes);

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

module.exports = app;