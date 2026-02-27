export const tagPaths = {
  '/tags': {
    get: {
      tags: ['Tags'],
      summary: 'Get all tags',
      responses: {
        200: {
          description: 'List of tags',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: { tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } } },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Tags'],
      summary: 'Create a tag',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTagRequest' } } },
      },
      responses: {
        201: { description: 'Tag created' },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/tags/{id}': {
    get: {
      tags: ['Tags'],
      summary: 'Get a single tag',
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Tag details' },
        404: { description: 'Tag not found' },
      },
    },
    put: {
      tags: ['Tags'],
      summary: 'Update a tag',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTagRequest' } } },
      },
      responses: {
        200: { description: 'Tag updated' },
        404: { description: 'Tag not found' },
      },
    },
    delete: {
      tags: ['Tags'],
      summary: 'Delete a tag',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Tag deleted' },
        404: { description: 'Tag not found' },
      },
    },
  },
};
