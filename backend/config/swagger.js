const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MediaVault API',
      version: '1.0.0',
      description:
        'API for uploading, previewing, searching, and ranking multimedia files (images, video, audio, PDFs). ' +
        'Authentication uses JWT access tokens (HTTP-only cookie or Bearer header) with refresh-token rotation.',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Local development' },
      { url: '/', description: 'Current host' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'accessToken' },
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJSDoc(options);
