# Event Planner — Server

REST API backend for the Event Planner application. Built with **Node.js**, **Express**, **TypeScript**, **Knex**, and **MySQL**.

---

## Features

- JWT authentication with refresh token rotation
- Email verification (required to create/manage events and RSVPs)
- Two-factor authentication (2FA) via email
- Event management with ownership protection
- RSVP system (yes / no / maybe)
- Tag filtering
- Pagination, search, and sorting
- Request validation (Joi)
- Structured logging (Winston)

---

## Engineering Decisions

### TypeScript throughout
TypeScript is used across the entire codebase (source, migrations, seeds, config) to catch type errors at compile time and make the codebase easier to navigate and refactor safely.

### Knex over a full ORM
Knex was chosen over Prisma or TypeORM to keep full control over SQL while still getting migration management, query building, and connection pooling. It avoids ORM magic that can hide N+1 queries or generate unexpected SQL.

### Dual-token auth (access + refresh)
Short-lived JWT access tokens (7 days) are paired with long-lived refresh tokens (30 days) stored in the database. This allows tokens to be revoked server-side — something stateless-only JWTs cannot do. Refresh tokens are rotated on every use to limit the damage window from token theft.

### Email-based 2FA with a temporary JWT
When 2FA is enabled, the `POST /auth/login` response returns a short-lived `tempToken` (JWT with `purpose: '2fa'`, 10-minute expiry) instead of full tokens. The client must exchange this plus the emailed 6-digit code via `POST /auth/2fa/verify`. This keeps the second factor serverless-friendly — no session state is required on the server between the two steps.

### Email verification gate
Rather than allowing all users to act immediately, create/edit/delete on events and all RSVPs require a verified email. This is enforced via the `requireEmailVerified` middleware applied at the route level, keeping the gate logic out of controllers and services.

### Validation at the route boundary (Joi)
All request bodies are validated with Joi schemas before entering controllers. Invalid requests are rejected with structured errors before any business logic or database calls run.

### Structured logging (Winston)
Winston is used with JSON output in production and colorized console output in development. This makes logs parseable by log aggregation tools (Datadog, CloudWatch, etc.) without any changes.

### Swagger spec split by route group
The OpenAPI spec is broken into `src/config/swagger/paths/` (one file per route group) and a shared `schemas.ts`. This prevents a single giant Swagger file from becoming a maintenance burden as the API grows.

---

## Assumptions

- **Single-role system** — All authenticated users share the same permissions. There is no admin role; ownership alone gates edit/delete actions on events.
- **One RSVP per user per event** — A user can hold exactly one RSVP status per event. Submitting a new status overwrites the previous one rather than creating a duplicate.
- **Email uniqueness** — An email address uniquely identifies a user. Re-registering with the same email is rejected.
- **MySQL 8+** — The project targets MySQL 8 and has not been tested against other databases (Knex supports others, but migrations may need adjustments).
- **SMTP is optional in development** — If SMTP credentials are not set, emails (verification, 2FA codes) are logged to the console. This is intentional to make local development work without a real mail server.
- **Frontend handles token storage** — The API returns tokens in JSON response bodies. How the frontend stores them (localStorage, httpOnly cookie, etc.) is outside the scope of this service.
- **Public events are visible to unauthenticated users** — `GET /events` and `GET /events/:id` are accessible without authentication. Private events are visible in listings but are owned by the creator.
- **Tags are global** — Tags are not scoped to a user; any authenticated user can create a tag and any event can use any tag.

---

## Prerequisites

Make sure you have the following installed:

| Tool | Version |
|---|---|
| [Node.js](https://nodejs.org) | v18+ |
| [npm](https://npmjs.com) | v9+ |
| [MySQL](https://dev.mysql.com/downloads/) | v8+ |

---

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd eventPlanner-server
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Create the Database

Open your MySQL client and run:

```sql
CREATE DATABASE event_planner;
```

---

## 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

If there's no `.env.example`, create `.env` manually:

```env
# ── Server ─────────────────────────────────────────
PORT=3000

# ── Database ────────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=event_planner

# ── JWT ─────────────────────────────────────────────
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ── CORS ────────────────────────────────────────────
# URL of your frontend app
CORS_ORIGIN=http://localhost:5173

# ── Email (SMTP) ─────────────────────────────────────
# Leave blank in development — emails will be logged to console instead
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
SMTP_FROM=your_email@gmail.com

# ── Environment ──────────────────────────────────────
NODE_ENV=development
```

> **Gmail tip:** Use an [App Password](https://myaccount.google.com/apppasswords) for `SMTP_PASS`, not your regular Gmail password.  
> In `development` mode with no SMTP configured, all emails are printed to the console — convenient for testing without a real mail server.

### Generating secure secrets

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this twice — once for `JWT_SECRET`, once for `JWT_REFRESH_SECRET`.

---

## 5. Run Migrations

This creates all the database tables:

```bash
npm run db:migrate:latest
```

Tables created:
- `users`
- `refresh_tokens`
- `email_verification_tokens`
- `two_factor_codes`
- `tags`
- `events`
- `events_tags`
- `rsvps`

---

## 6. Seed the Database 

Populates the database with sample data (users, events, tags, RSVPs):

```bash
npm run db:seed:run
```

**Seeded users** (all use password `password123`):

Login Creds:-
test@gmail.com
password123

---

## 7. Start the Development Server

```bash
npm run dev
```

The server starts at `http://localhost:3000` (or whatever `PORT` is set to).

You should see:

```
info: Database connection successful
info: Server is running on port 3000
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run db:migrate:latest` | Run all pending migrations |
| `npm run db:migrate:rollback` | Rollback the last migration batch |
| `npm run db:seed:run` | Run all seed files |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint and auto-fix |

---

## API Overview

Base URL: `http://localhost:3000/api`

| Group | Prefix | Auth required |
|---|---|---|
| Auth | `/auth` | Mixed |
| Events | `/events` | Mixed |
| Tags | `/tags` | Mixed |
| RSVPs | `/rsvps` | Yes |

### Health Check

```
GET http://localhost:3000/health
```

### API Documentation (Swagger UI)

```
GET http://localhost:3000/api-docs
```

Interactive docs with all endpoints, request/response schemas, and built-in authorization. Click **Authorize** and paste your `accessToken` to send authenticated requests directly from the browser.

Raw OpenAPI spec available at:
```
GET http://localhost:3000/api-docs.json
```

---

## Auth Flow

### Standard login (no 2FA)

```
POST /api/auth/register   → creates account, sends verification email
POST /api/auth/login      → returns accessToken + refreshToken
```

### Login with 2FA enabled

```
POST /api/auth/login      → returns { requires2FA: true, tempToken }
POST /api/auth/2fa/verify → returns accessToken + refreshToken
```

### Token refresh

```
POST /api/auth/refresh    → exchanges refreshToken for new token pair
```

All protected routes require:
```
Authorization: Bearer <accessToken>
```

---

## Email Verification

After registering, a verification email is sent automatically. Unverified users **cannot**:
- Create, edit, or delete events
- RSVP to events

In development without SMTP configured, the verification token is printed to the console:
```
warn: [EMAIL NOT SENT] To: user@example.com, Subject: Verify Your Email Address
warn: Email content (HTML): ...?token=<token>
```

Copy the token and call:
```
POST /api/auth/verify-email
{ "token": "<token>" }
```

---

## Two-Factor Authentication (2FA)

Enable per-user from a logged-in account:
```
POST /api/auth/2fa/enable     (requires Bearer token)
POST /api/auth/2fa/disable    (requires Bearer token + password)
```

Once enabled, every login triggers an email with a 6-digit code valid for 10 minutes.

---

## Postman Collection

Import `Event-Planner-API.postman_collection.json` and `Event-Planner-Dev.postman_environment.json` from the project root into Postman.

The Login request automatically saves tokens to collection variables. For 2FA logins, the `tempToken` is also saved automatically.

---

## Project Structure

```
src/
├── config/
│   ├── database.ts          # Knex connection config
│   └── swagger/             # OpenAPI / Swagger spec (split by group)
│       ├── index.ts         # Merges everything, exports swaggerSpec
│       ├── schemas.ts       # Reusable component schemas
│       └── paths/
│           ├── auth.ts      # /auth/* + /auth/2fa/* paths
│           ├── events.ts    # /events/* paths
│           ├── tags.ts      # /tags/* paths
│           └── rsvps.ts     # /rsvps/* paths
├── controllers/             # Route handlers
├── database/
│   ├── connection.ts
│   ├── migrations/          # Knex migration files
│   └── seeds/               # Seed data
├── middleware/              # Auth, validation, error handling
├── routes/                  # Express routers
├── services/                # Business logic
├── templates/               # HTML email templates
├── types/                   # TypeScript interfaces
├── utils/                   # Logger, email service, sanitization
└── validation/              # Joi schemas
```

---

## Common Issues

**`Error: Environment variable JWT_SECRET is required but not set`**  
→ Make sure your `.env` file exists and has `JWT_SECRET` set.

**`Error: connect ECONNREFUSED 127.0.0.1:3306`**  
→ MySQL is not running. Start it with `brew services start mysql` (Mac) or `net start mysql` (Windows).

**`ER_BAD_DB_ERROR: Unknown database 'event_planner'`**  
→ Run `CREATE DATABASE event_planner;` in MySQL first, then re-run migrations.

**Emails not sending**  
→ In development this is expected if SMTP is not configured. Tokens are logged to the console.  
→ For Gmail, ensure you're using an App Password, not your account password.

**Migration errors after pulling new code**  
→ Run `npm run db:migrate:latest` to apply any new migrations.
