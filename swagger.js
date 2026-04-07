const swaggerJSDoc = require('swagger-jsdoc');

const port = Number(process.env.PORT) || 3000;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Driving API',
      version: '1.0.0',
      description: 'API documentation for Smart Driving Learning Platform',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste JWT token here. Example: eyJhbGciOi...',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;