# Exact Specifications - No Ambiguity

**This document lists every exact specification with no alternatives or choices. Everything is precisely defined.**

---

## Critical Specifications

### Groq AI Model
- **Exact Model Identifier:** `openai/gpt-oss-20b`
- **No alternatives** - this is the exact model name to use
- **API Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Context Window:** 131,072 tokens
- **Max Output Tokens:** 65,536

### Technology Versions (Exact)
- **Next.js:** 16.0.7 (latest stable as of December 2025)
- **React:** 19.0.0
- **TypeScript:** 5.3.3 (must be 5.1.0 or higher for Next.js 16)
- **Node.js:** 20.9.0 or higher (required for Next.js 16)
- **PostgreSQL:** 16.0 (latest stable)
- **Prisma:** 7.0.0 (latest stable - includes PGVector support)
- **Zod:** 3.22.4
- **React Hook Form:** 7.49.3
- **Zustand:** 4.4.7
- **Heroicons:** 2.1.1
- **WebSocket:** ws@8.16.0 (not Socket.io)
- **Email:** nodemailer@6.9.8, imap@0.8.19, mailparser@3.6.5
- **OpenAI Client:** openai@4.24.1 (for Groq API)

### Library Choices (Exact - No Alternatives)
- **Icons:** @heroicons/react (not any other icon library)
- **WebSocket Server:** ws library (not Socket.io)
- **WebSocket Client:** Native WebSocket API (no library)
- **State Management:** Zustand (not Redux, not Context alone)
- **Forms:** React Hook Form + Zod (not Formik, not plain forms)
- **Charts:** Recharts (not Chart.js, not D3 directly)
- **PDF:** pdf-lib + jspdf (exact combination)
- **CSV:** csv-writer + csv-parse (exact combination)

### Configuration Decisions (Exact)
- **Styling:** Custom CSS (NOT Tailwind CSS)
- **Dark Mode:** Default (light mode is toggle)
- **File Storage:** Local filesystem (NOT cloud storage)
- **Caching:** In-memory Map (NOT Redis)
- **Rate Limiting:** In-memory Map (NOT Redis)
- **JWT Storage:** localStorage + Authorization header (NOT HTTP-only cookies)
- **Email Config:** Stored in database (NOT environment file)
- **System Settings:** All in database (NOT environment file)

### File Structure (Exact)
- **No src/ directory** - files in root
- **Import alias:** `@/*` points to project root
- **Storage path:** `./storage` relative to project root
- **Attachments path:** `./storage/attachments/{year}/{month}/{filename}`
- **Exports path:** `./storage/exports/{year}/{month}/{filename}`
- **Avatars path:** `./storage/avatars/{userId}.{ext}`

### Database Specifications (Exact)
- **Database:** PostgreSQL 16.0 (latest stable)
- **ORM:** Prisma 7.0.0 (latest stable - includes PGVector support)
- **Extensions Required:**
  - `vector` (pgvector)
  - `uuid-ossp`
- **Connection String Format:** `postgresql://user:password@host:port/database?schema=public`

### Authentication (Exact)
- **Method:** JWT (not sessions)
- **Library:** jsonwebtoken@9.0.2
- **Algorithm:** HS256
- **Token Expiration:** 3 days (259200 seconds)
- **Refresh Token Expiration:** 30 days (2592000 seconds)
- **Password Hashing:** bcryptjs@2.4.3 with 12 rounds
- **Token Storage:** localStorage on client, sent in Authorization header

### WebSocket (Exact)
- **Server Library:** ws@8.16.0
- **Client:** Native WebSocket API
- **Port:** 3001 (default, configurable)
- **Authentication:** JWT token in query string
- **Message Format:** JSON with `event` and `data` fields

### Email Processing (Exact)
- **SMTP:** nodemailer@6.9.8
- **IMAP:** imap@0.8.19
- **Parser:** mailparser@3.6.5
- **Polling Interval:** 5 minutes (default, configurable in database)
- **Configuration:** Stored in database `email_configurations` table

### File Upload (Exact)
- **Default Size Limit:** 100MB (104857600 bytes)
- **Configurable:** Yes, in database `system_settings` table
- **Storage:** Local filesystem only
- **Path Structure:** Year/Month organization

### Testing (Exact)
- **Unit/Integration:** Jest@29.7.0
- **E2E:** Playwright@1.41.1
- **Coverage Tool:** Jest built-in
- **Coverage Threshold:** 90% (branches, functions, lines, statements)
- **Pass Rate:** 100% (all tests must pass)

### Project Initialization (Exact Command)
```bash
npx create-next-app@latest itsm-helpdesk --typescript --tailwind=false --app --no-src-dir --import-alias "@/*" --eslint --yes
```

### Environment Variables (Exact Names)
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Token expiration (default: "3d")
- `JWT_REFRESH_SECRET` - Refresh token secret
- `JWT_REFRESH_EXPIRES_IN` - Refresh expiration (default: "30d")
- `GROQ_API_KEY` - Groq API key
- `STORAGE_PATH` - File storage path (default: "./storage")
- `MAX_FILE_SIZE` - Max file size in bytes (default: 104857600)

### API Route Structure (Exact)
- **Base Path:** `/api/v1/`
- **Version:** v1 (all endpoints under this)
- **Response Format:** JSON with `success`, `data`, `error` structure
- **Error Format:** JSON with `success: false`, `error: { code, message, details }`

### Code Patterns (Exact)
- **File Naming:** kebab-case for files, PascalCase for components
- **Imports:** Absolute imports with `@/` alias
- **Exports:** Named exports preferred
- **Error Handling:** Try-catch with specific error types
- **TypeScript:** Strict mode enabled, no `any` types

### Demo Accounts (Exact)
- **Admin:** admin@demo.com / demo123
- **IT Manager:** manager@demo.com / demo123
- **Agent:** agent@demo.com / demo123
- **End User:** user@demo.com / demo123
- **All passwords:** demo123 (bcrypt hashed in seed)

### Seed Data (Exact Quantities)
- **Tickets:** 10 sample tickets
- **KB Articles:** 5 sample articles
- **Assets:** 8 sample assets
- **Change Requests:** 3 sample changes
- **Historical Data:** 30 days of sparse analytics data

---

## Explicitly Excluded (Not Optional - Explicitly Not Included)

- **Tailwind CSS:** NOT used (custom CSS only)
- **Redis:** NOT used (in-memory only)
- **Socket.io:** NOT used (ws library only)
- **Cloud Storage:** NOT used (local filesystem only)
- **Virus Scanning:** NOT in initial version
- **HTTP-only Cookies:** NOT used for JWT
- **Email Verification:** Disabled by default (configurable)
- **Multi-tenant:** NOT supported (single-tenant only)

---

## No "Verify" or "Likely" Statements

All specifications are exact. No statements like:
- ❌ "verify with..."
- ❌ "likely..."
- ❌ "may be..."
- ❌ "optional..."
- ❌ "to be researched..."

Everything is precisely specified.

---

This document ensures zero ambiguity in implementation.

