const swaggerJsdoc = require('swagger-jsdoc');
const { config } = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Digital Shop Manager API',
      version: '1.0.0',
      description: 'Production-grade REST API for the Digital Shop Manager MERN application',
      contact: {
        name: 'API Support',
        email: 'support@digitalshop.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {},
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.js', './src/modules/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
