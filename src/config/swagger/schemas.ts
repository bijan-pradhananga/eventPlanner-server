export const schemas = {
  // ── Generic ────────────────────────────────────────────────────────────────
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          code: { type: 'string', nullable: true },
        },
      },
    },
  },

  // ── User ───────────────────────────────────────────────────────────────────
  User: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      email: { type: 'string', format: 'email', example: 'alice@example.com' },
      first_name: { type: 'string', example: 'Alice' },
      last_name: { type: 'string', example: 'Johnson' },
      email_verified_at: { type: 'string', format: 'date-time', nullable: true },
      two_factor_enabled: { type: 'boolean', example: false },
      created_at: { type: 'string', format: 'date-time' },
    },
  },

  // ── Auth ───────────────────────────────────────────────────────────────────
  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'first_name', 'last_name'],
    properties: {
      email: { type: 'string', format: 'email', example: 'test@gmail.com' },
      password: {
        type: 'string',
        minLength: 8,
        example: 'SecurePass123!',
        description: 'Must contain uppercase, lowercase, number, and special char',
      },
      first_name: { type: 'string', example: 'John' },
      last_name: { type: 'string', example: 'Doe' },
    },
  },

  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'user@example.com' },
      password: { type: 'string', example: 'SecurePass123!' },
    },
  },

  TokenPair: {
    type: 'object',
    properties: {
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' },
    },
  },

  // ── Event ──────────────────────────────────────────────────────────────────
  Event: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      title: { type: 'string', example: 'Team Meetup' },
      description: { type: 'string', nullable: true },
      event_date: { type: 'string', format: 'date-time' },
      event_end_date: { type: 'string', format: 'date-time', nullable: true },
      location: { type: 'string', nullable: true },
      event_type: { type: 'string', enum: ['public', 'private'] },
      user_id: { type: 'integer' },
      tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },

  CreateEventRequest: {
    type: 'object',
    required: ['title', 'event_date', 'event_type'],
    properties: {
      title: { type: 'string', example: 'Team Meetup' },
      description: { type: 'string', example: 'Annual team building' },
      event_date: { type: 'string', format: 'date-time', example: '2026-04-10T10:00:00Z' },
      event_end_date: { type: 'string', format: 'date-time', example: '2026-04-10T18:00:00Z' },
      location: { type: 'string', example: 'Central Park' },
      event_type: { type: 'string', enum: ['public', 'private'] },
      tag_ids: { type: 'array', items: { type: 'integer' }, example: [1, 2] },
    },
  },

  // ── Tag ────────────────────────────────────────────────────────────────────
  Tag: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Tech' },
      color: { type: 'string', example: '#3B82F6' },
    },
  },

  CreateTagRequest: {
    type: 'object',
    required: ['name', 'color'],
    properties: {
      name: { type: 'string', example: 'Conference' },
      color: { type: 'string', example: '#10B981' },
    },
  },

  // ── RSVP ───────────────────────────────────────────────────────────────────
  RSVP: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      event_id: { type: 'integer' },
      user_id: { type: 'integer' },
      status: { type: 'string', enum: ['yes', 'no', 'maybe'] },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },

  RSVPRequest: {
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', enum: ['yes', 'no', 'maybe'], example: 'yes' },
    },
  },

  RSVPSummary: {
    type: 'object',
    properties: {
      yes: { type: 'integer' },
      no: { type: 'integer' },
      maybe: { type: 'integer' },
      total: { type: 'integer' },
    },
  },

  // ── Pagination ─────────────────────────────────────────────────────────────
  Pagination: {
    type: 'object',
    properties: {
      page: { type: 'integer' },
      limit: { type: 'integer' },
      total: { type: 'integer' },
      total_pages: { type: 'integer' },
    },
  },
};
