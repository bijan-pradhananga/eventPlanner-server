# Email Verification Implementation

## Overview
Complete email verification system with token-based verification, automatic email sending, and cleanup mechanisms.

## Installation

Install required dependency:
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

## Database Migration

Run the migration to create the email verification tokens table:
```bash
npm run db:migrate:latest
```

This creates the `email_verification_tokens` table with:
- `id` - Primary key
- `token` - Unique verification token (255 chars)
- `user_id` - Foreign key to users table
- `expires_at` - Token expiration timestamp
- `is_used` - Boolean flag for used tokens
- `created_at`, `updated_at` - Timestamps

## Environment Variables

Add these to your `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Event Planner <your-email@gmail.com>"

# Frontend URL (for verification links)
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular password) in `SMTP_PASS`

### Other Email Providers
- **Outlook**: smtp-mail.outlook.com (port 587)
- **SendGrid**: smtp.sendgrid.net (port 587)
- **Mailgun**: smtp.mailgun.org (port 587)
- **AWS SES**: email-smtp.{region}.amazonaws.com (port 587)

## API Endpoints

### 1. Register (Automatically Sends Verification Email)
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "email_verified_at": null,
      "created_at": "2026-02-25T00:00:00.000Z"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 2. Verify Email
```http
POST /auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "email_verified_at": "2026-02-25T10:30:00.000Z"
    },
    "message": "Email verified successfully"
  }
}
```

**Error Responses:**
- `400` - Invalid or expired token
- `400` - Email already verified

### 3. Resend Verification Email
```http
POST /auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Verification email sent successfully"
  }
}
```

**Error Responses:**
- `400` - User not found
- `400` - Email already verified

## Features

### Security
- **Cryptographic tokens**: 32-byte random hex tokens (64 characters)
- **24-hour expiration**: Tokens expire after 24 hours
- **Single-use tokens**: Marked as used after verification
- **Token invalidation**: Old tokens invalidated when resending
- **Database verification**: Multi-layer token validation

### Email Service
- **SMTP integration**: Nodemailer with customizable SMTP settings
- **HTML emails**: Professional, responsive email templates
- **Fallback handling**: Graceful degradation if SMTP not configured
- **Development mode**: Logs emails to console when SMTP unavailable
- **Multiple providers**: Supports Gmail, Outlook, SendGrid, etc.

### Cleanup
- **Automatic cleanup**: `cleanupExpiredVerificationTokens()` method
- **Removes expired tokens**: Deletes tokens past expiration date
- **Removes used tokens**: Cleans up already-verified tokens

### 🔄 Workflow

1. **User Registration**
   - User registers via `/auth/register`
   - Account created with `email_verified_at = null`
   - Verification token generated and stored
   - Verification email sent automatically
   - User receives access/refresh tokens

2. **Email Verification**
   - User clicks link in email
   - Frontend extracts token from URL
   - Frontend calls `/auth/verify-email` with token
   - Backend validates token and updates `email_verified_at`
   - Token marked as used

3. **Resend Verification**
   - User requests new email via `/auth/resend-verification`
   - Old unused tokens invalidated
   - New token generated and emailed

## Email Template Customization

Email templates are in `src/templates/verificationEmail.ts`. Customize:
- Colors and styling
- Company branding
- Email copy
- Button styles
- Footer information

## Maintenance

### Cleanup Expired Tokens (Run Periodically)
```typescript
import { AuthService } from './services/authService';

// Run daily cleanup (e.g., via cron job)
await AuthService.cleanupExpiredVerificationTokens();
```

### Token Validation Fails
1. Check token hasn't expired (24 hours)
2. Verify token hasn't been used already
3. Ensure database migration ran successfully
4. Check for whitespace in token string

### Development Mode
If SMTP is not configured, emails will be logged to console:
```
[EMAIL NOT SENT] To: user@example.com, Subject: Verify Your Email Address
Email content (HTML): <html>...</html>
```

Copy the verification URL from logs for testing.

## File Structure

```
src/
├── database/
│   └── migrations/
│       └── 20260225000000_create_email_verification_tokens_table.ts
├── services/
│   └── authService.ts (verification methods)
├── controllers/
│   └── authController.ts (verification endpoints)
├── routes/
│   └── authRoutes.ts (verification routes)
├── validation/
│   └── authValidation.ts (verification schemas)
├── utils/
│   └── emailService.ts (email sending)
└── types/
    └── index.ts (EmailVerificationToken interface)
```

## Testing

### Manual Testing
1. Register a new user
2. Check email for verification link
3. Click link or copy token
4. Verify via API or frontend
5. Confirm `email_verified_at` is set in database


