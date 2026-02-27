export const authPaths = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new account',
      description: 'Creates a new user and sends a verification email automatically.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
      },
      responses: {
        201: {
          description: 'User registered',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      accessToken: { type: 'string' },
                      refreshToken: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        409: {
          description: 'Email already in use',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login',
      description:
        'Returns tokens directly when 2FA is disabled. When 2FA is enabled returns a `tempToken` — use `POST /auth/2fa/verify` to complete login.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
      },
      responses: {
        200: {
          description: 'Login successful or 2FA required',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      requires2FA: { type: 'boolean' },
                      user: { $ref: '#/components/schemas/User' },
                      accessToken: { type: 'string', description: 'Present when requires2FA is false' },
                      refreshToken: { type: 'string', description: 'Present when requires2FA is false' },
                      tempToken: { type: 'string', description: 'Present when requires2FA is true (10 min expiry)' },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Invalid credentials',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: { refreshToken: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'New token pair issued',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/TokenPair' },
                },
              },
            },
          },
        },
        401: { description: 'Invalid or expired refresh token' },
      },
    },
  },

  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Logout and revoke refresh token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { refreshToken: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Logged out successfully' },
      },
    },
  },

  '/auth/profile': {
    get: {
      tags: ['Auth'],
      summary: 'Get current user profile',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Profile data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/auth/verify-email': {
    post: {
      tags: ['Auth', 'Email Verification'],
      summary: 'Verify email address',
      description: 'Submit the token from the verification email link.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: { token: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Email verified successfully' },
        400: { description: 'Invalid or expired token' },
      },
    },
  },

  '/auth/resend-verification': {
    post: {
      tags: ['Auth', 'Email Verification'],
      summary: 'Resend verification email',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Verification email sent' },
        400: { description: 'Already verified or user not found' },
      },
    },
  },

  '/auth/2fa/enable': {
    post: {
      tags: ['Auth', '2FA'],
      summary: 'Enable two-factor authentication',
      description: "After enabling, every login sends a 6-digit code to the user's email.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: '2FA enabled' },
        409: { description: 'Already enabled' },
      },
    },
  },

  '/auth/2fa/verify': {
    post: {
      tags: ['Auth', '2FA'],
      summary: 'Complete login with 2FA code',
      description: 'Submit the `tempToken` from the login response and the 6-digit code from email.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['tempToken', 'code'],
              properties: {
                tempToken: { type: 'string', description: 'Received from POST /auth/login when requires2FA is true' },
                code: { type: 'string', minLength: 6, maxLength: 6, example: '482910' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: '2FA verified — full tokens issued',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      accessToken: { type: 'string' },
                      refreshToken: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Invalid code or expired session' },
      },
    },
  },

  '/auth/2fa/disable': {
    post: {
      tags: ['Auth', '2FA'],
      summary: 'Disable two-factor authentication',
      description: 'Requires current password as confirmation.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['password'],
              properties: { password: { type: 'string', example: 'SecurePass123!' } },
            },
          },
        },
      },
      responses: {
        200: { description: '2FA disabled' },
        400: { description: 'Invalid password or 2FA not enabled' },
      },
    },
  },
};
