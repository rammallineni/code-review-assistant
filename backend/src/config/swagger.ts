import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from './index.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Code Review Assistant API',
      version: '1.0.0',
      description: 'AI-powered code review assistant API documentation',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
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
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            githubId: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            avatarUrl: { type: 'string', format: 'uri' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Repository: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            githubId: { type: 'string' },
            name: { type: 'string' },
            fullName: { type: 'string' },
            isPrivate: { type: 'boolean' },
            defaultBranch: { type: 'string' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            prNumber: { type: 'number' },
            prTitle: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'failed'] },
            summary: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Issue: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            filePath: { type: 'string' },
            lineNumber: { type: 'number' },
            severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
            category: { type: 'string', enum: ['security', 'performance', 'style', 'bug', 'best_practice'] },
            title: { type: 'string' },
            description: { type: 'string' },
            suggestion: { type: 'string' },
            codeSnippet: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Code Review Assistant API',
  }));

  // Serve OpenAPI spec as JSON
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
