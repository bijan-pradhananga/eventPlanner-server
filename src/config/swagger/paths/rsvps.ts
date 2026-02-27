export const rsvpPaths = {
  '/rsvps/my-rsvps': {
    get: {
      tags: ['RSVPs'],
      summary: "Get all events the user has RSVP'd to",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "User's RSVPs" },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/rsvps/events/{eventId}': {
    get: {
      tags: ['RSVPs'],
      summary: 'Get all RSVPs for an event',
      parameters: [{ in: 'path', name: 'eventId', required: true, schema: { type: 'integer' } }],
      responses: {
        200: {
          description: 'RSVP list with summary',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      summary: { $ref: '#/components/schemas/RSVPSummary' },
                      rsvps: { type: 'array', items: { $ref: '#/components/schemas/RSVP' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['RSVPs'],
      summary: 'Create or update an RSVP',
      description: 'Requires authentication and verified email. Calling again with a different status updates the existing RSVP.',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'eventId', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/RSVPRequest' } } },
      },
      responses: {
        200: { description: 'RSVP saved' },
        403: { description: 'Email not verified' },
        404: { description: 'Event not found' },
      },
    },
    delete: {
      tags: ['RSVPs'],
      summary: 'Cancel (delete) an RSVP',
      description: 'Requires authentication and verified email.',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'eventId', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'RSVP cancelled' },
        403: { description: 'Email not verified' },
        404: { description: 'RSVP not found' },
      },
    },
  },

  '/rsvps/events/{eventId}/my-rsvp': {
    get: {
      tags: ['RSVPs'],
      summary: "Get the authenticated user's RSVP for a specific event",
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'eventId', required: true, schema: { type: 'integer' } }],
      responses: {
        200: {
          description: "User's RSVP (null if none)",
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: { rsvp: { allOf: [{ $ref: '#/components/schemas/RSVP' }], nullable: true } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
