import swaggerJsdoc from 'swagger-jsdoc';
import { schemas } from './schemas';
import { authPaths } from './paths/auth';
import { eventPaths } from './paths/events';
import { tagPaths } from './paths/tags';
import { rsvpPaths } from './paths/rsvps';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Planner API',
      version: '1.0.0',
      description:
        'REST API for the Event Planner application — authentication (with optional 2FA), event management, tags, and RSVPs.',
      contact: {
        name: 'Event Planner Support',
        email: 'support@eventplanner.com',
      },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste the Access Token from /auth/login or /auth/register',
        },
      },
      schemas,
    },
    tags: [
      { name: 'Auth', description: 'Registration, login, logout, refresh, profile' },
      { name: '2FA', description: 'Two-factor authentication via email' },
      { name: 'Email Verification', description: 'Verify and resend verification emails' },
      { name: 'Events', description: 'Create and manage events' },
      { name: 'Tags', description: 'Event tags / categories' },
      { name: 'RSVPs', description: 'Event RSVPs (yes / no / maybe)' },
    ],
    paths: {
      ...authPaths,
      ...eventPaths,
      ...tagPaths,
      ...rsvpPaths,
    },
  },
  apis: [], // paths are defined programmatically above — no file scanning needed
};

export const swaggerSpec = swaggerJsdoc(options);
