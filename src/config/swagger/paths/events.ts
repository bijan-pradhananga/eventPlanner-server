export const eventPaths = {
  '/events': {
    get: {
      tags: ['Events'],
      summary: 'Get all events (paginated)',
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
        { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search title, description, location' },
        { in: 'query', name: 'event_type', schema: { type: 'string', enum: ['public', 'private'] } },
        { in: 'query', name: 'tag_ids', schema: { type: 'string' }, description: 'Comma-separated tag IDs e.g. 1,2,3' },
        { in: 'query', name: 'upcoming', schema: { type: 'boolean' } },
        { in: 'query', name: 'past', schema: { type: 'boolean' } },
        { in: 'query', name: 'sort_by', schema: { type: 'string', enum: ['event_date', 'created_at', 'title'] } },
        { in: 'query', name: 'sort_order', schema: { type: 'string', enum: ['asc', 'desc'] } },
      ],
      responses: {
        200: {
          description: 'List of events',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: { events: { type: 'array', items: { $ref: '#/components/schemas/Event' } } },
                  },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Events'],
      summary: 'Create a new event',
      description: 'Requires authentication and verified email.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateEventRequest' } } },
      },
      responses: {
        201: {
          description: 'Event created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'object', properties: { event: { $ref: '#/components/schemas/Event' } } },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Email not verified (code: EMAIL_NOT_VERIFIED)' },
      },
    },
  },

  '/events/my/events': {
    get: {
      tags: ['Events'],
      summary: 'Get events created by the authenticated user',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
      ],
      responses: {
        200: { description: "User's events" },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/events/my/dashboard': {
    get: {
      tags: ['Events'],
      summary: 'Get dashboard statistics',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Dashboard stats',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      stats: {
                        type: 'object',
                        properties: {
                          total_events: { type: 'integer' },
                          upcoming_events: { type: 'integer' },
                          past_events: { type: 'integer' },
                          total_rsvps: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  '/events/{id}': {
    get: {
      tags: ['Events'],
      summary: 'Get a single event',
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Event details' },
        404: { description: 'Event not found' },
      },
    },
    put: {
      tags: ['Events'],
      summary: 'Update an event (owner only)',
      description: 'Requires authentication, verified email, and ownership.',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateEventRequest' } } },
      },
      responses: {
        200: { description: 'Event updated' },
        403: { description: 'Forbidden — not owner or email not verified' },
        404: { description: 'Event not found' },
      },
    },
    delete: {
      tags: ['Events'],
      summary: 'Delete an event (owner only)',
      description: 'Requires authentication, verified email, and ownership.',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Event deleted' },
        403: { description: 'Forbidden' },
        404: { description: 'Event not found' },
      },
    },
  },
};
