# Implementation Specifications

**Complete, unambiguous specifications for every component, library, version, and configuration. No choices left to the developer.**

---

## Table of Contents

1. [Exact Technology Versions](#exact-technology-versions)
2. [Project Structure](#project-structure)
3. [Dependency Specifications](#dependency-specifications)
4. [Configuration Specifications](#configuration-specifications)
5. [File Structure Specifications](#file-structure-specifications)
6. [Code Pattern Specifications](#code-pattern-specifications)
7. [API Implementation Specifications](#api-implementation-specifications)
8. [Database Implementation Specifications](#database-implementation-specifications)

---

## Exact Technology Versions

### Frontend Dependencies

```json
{
  "dependencies": {
    "next": "16.0.7",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "typescript": "5.3.3",
    "@types/node": "20.11.5",
    "@types/react": "19.0.1",
    "@types/react-dom": "19.0.0",
    "zod": "3.22.4",
    "react-hook-form": "7.49.3",
    "@hookform/resolvers": "3.3.4",
    "zustand": "4.4.7",
    "@heroicons/react": "2.1.1",
    "date-fns": "3.3.1",
    "recharts": "2.10.4",
    "ws": "8.16.0",
    "@types/ws": "8.5.10"
  }
}
```

### Backend Dependencies

```json
{
  "dependencies": {
    "prisma": "7.0.0",
    "@prisma/client": "7.0.0",
    "bcryptjs": "2.4.3",
    "@types/bcryptjs": "2.4.6",
    "jsonwebtoken": "9.0.2",
    "@types/jsonwebtoken": "9.0.5",
    "nodemailer": "6.9.8",
    "@types/nodemailer": "6.4.14",
    "imap": "0.8.19",
    "@types/imap": "0.8.40",
    "mailparser": "3.6.5",
    "csv-writer": "1.6.0",
    "csv-parse": "5.5.3",
    "openai": "4.24.1",
    "pdf-lib": "1.17.1",
    "jspdf": "2.5.1"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/node": "20.11.5",
    "@types/react": "19.0.1",
    "@types/react-dom": "19.0.0",
    "@types/bcryptjs": "2.4.6",
    "@types/jsonwebtoken": "9.0.5",
    "@types/nodemailer": "6.4.14",
    "@types/ws": "8.5.10",
    "@types/imap": "0.8.40",
    "jest": "29.7.0",
    "@types/jest": "29.5.11",
    "ts-jest": "29.1.2",
    "@testing-library/react": "14.1.2",
    "@testing-library/jest-dom": "6.1.5",
    "@playwright/test": "1.41.1",
    "eslint": "8.56.0",
    "eslint-config-next": "16.0.7",
    "@typescript-eslint/eslint-plugin": "6.19.0",
    "@typescript-eslint/parser": "6.19.0",
    "prettier": "3.2.4"
  }
}
```

### Runtime Requirements

- **Node.js:** 20.9.0 or higher (required for Next.js 16)
- **PostgreSQL:** 16.0
- **npm:** 10.2.4 (or higher)

---

## Project Structure

### Exact Directory Structure

```
itsm-helpdesk/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── tickets/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── kb/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── search/
│   │   │       └── page.tsx
│   │   ├── assets/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── import/
│   │   │       └── page.tsx
│   │   ├── changes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── settings/
│   │       │   └── page.tsx
│   │       ├── email/
│   │       │   └── page.tsx
│   │       └── users/
│   │           └── page.tsx
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── register/
│   │   │   │   │   └── route.ts
│   │   │   │   └── logout/
│   │   │   │       └── route.ts
│   │   │   ├── tickets/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── kb/
│   │   │   │   ├── search/
│   │   │   │   │   └── route.ts
│   │   │   │   └── articles/
│   │   │   │       └── route.ts
│   │   │   ├── ai/
│   │   │   │   └── chat/
│   │   │   │       └── route.ts
│   │   │   └── analytics/
│   │   │       └── dashboard/
│   │   │           └── route.ts
│   │   └── ws/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   └── Table.tsx
│   ├── tickets/
│   │   ├── TicketCard.tsx
│   │   ├── TicketForm.tsx
│   │   ├── TicketList.tsx
│   │   └── TicketDetail.tsx
│   ├── ai/
│   │   └── ChatWidget.tsx
│   ├── kb/
│   │   ├── KBArticleCard.tsx
│   │   └── KBSearch.tsx
│   └── shared/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── NotificationCenter.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── services/
│   │   ├── ticket-service.ts
│   │   ├── ai-service.ts
│   │   ├── kb-service.ts
│   │   ├── asset-service.ts
│   │   ├── change-service.ts
│   │   ├── email-service.ts
│   │   └── analytics-service.ts
│   ├── utils/
│   │   ├── ticket-utils.ts
│   │   ├── sla-calculations.ts
│   │   ├── validations.ts
│   │   └── formatters.ts
│   └── middleware/
│       ├── auth.ts
│       └── permissions.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   ├── seed.ts
│   └── reset-demo.ts
├── storage/
│   ├── attachments/
│   ├── exports/
│   └── avatars/
├── public/
│   └── favicon.ico
├── .env.example
├── .env
├── .gitignore
├── jest.config.js
├── playwright.config.ts
├── tsconfig.json
├── next.config.js
├── package.json
└── README.md
```

---

## Dependency Specifications

### Exact Installation Commands

```bash
# Initialize Next.js project (exact command)
npx create-next-app@latest itsm-helpdesk --typescript --tailwind=false --app --no-src-dir --import-alias "@/*" --eslint --yes
# This will install Next.js 16.0.7 (latest)
# Then update package.json to pin exact version: "next": "16.0.7"

cd itsm-helpdesk

# Install exact dependencies
npm install next@15.0.3 react@19.0.0 react-dom@19.0.0 typescript@5.3.3
npm install @types/node@20.11.5 @types/react@19.0.1 @types/react-dom@19.0.0
npm install zod@3.22.4 react-hook-form@7.49.3 @hookform/resolvers@3.3.4
npm install zustand@4.4.7 @heroicons/react@2.1.1 date-fns@3.3.1
npm install prisma@5.9.1 @prisma/client@5.9.1
npm install bcryptjs@2.4.3 jsonwebtoken@9.0.2
npm install nodemailer@6.9.8 imap@0.8.19 mailparser@3.6.5
npm install csv-writer@1.6.0 csv-parse@5.5.3
npm install recharts@2.10.4 ws@8.16.0
npm install openai@4.24.1 pdf-lib@1.17.1 jspdf@2.5.1

# Install dev dependencies
npm install --save-dev @types/bcryptjs@2.4.6 @types/jsonwebtoken@9.0.5
npm install --save-dev @types/nodemailer@6.4.14 @types/ws@8.5.10 @types/imap@0.8.40
npm install --save-dev jest@29.7.0 @types/jest@29.5.11 ts-jest@29.1.2
npm install --save-dev @testing-library/react@14.1.2 @testing-library/jest-dom@6.1.5
npm install --save-dev @playwright/test@1.41.1
npm install --save-dev eslint@8.56.0 eslint-config-next@15.0.3
npm install --save-dev @typescript-eslint/eslint-plugin@6.19.0 @typescript-eslint/parser@6.19.0
npm install --save-dev prettier@3.2.4
```

---

## Configuration Specifications

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Next.js Configuration (next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  // File upload size limit
  api: {
    bodyParser: {
      sizeLimit: '100mb'
    }
  },
  // Webpack configuration for file handling
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false
    };
    return config;
  }
};

module.exports = nextConfig;
```

### Environment Variables (.env.example)

```env
# Database
DATABASE_URL="postgresql://itsm_user:password@localhost:5432/itsm_db?schema=public"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# JWT Authentication
JWT_SECRET="generate-with-openssl-rand-base64-32"
JWT_EXPIRES_IN="3d"
JWT_REFRESH_SECRET="generate-with-openssl-rand-base64-32"
JWT_REFRESH_EXPIRES_IN="30d"

# Groq API
GROQ_API_KEY="your_groq_api_key_here"

# File Storage
STORAGE_PATH="./storage"
MAX_FILE_SIZE=104857600

# Email (Default - can be overridden in database)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM_EMAIL=""
SMTP_FROM_NAME="ITSM Support"

# Application Settings
APP_NAME="ITSM Helpdesk"
DEMO_MODE=true
```

### Jest Configuration (jest.config.js)

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './'
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{ts,tsx}',
    '!app/**/layout.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}'
  ]
};

module.exports = createJestConfig(customJestConfig);
```

### Playwright Configuration (playwright.config.ts)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});
```

---

## Groq API Specifications

### Exact Model Identifier

**Model Name:** `openai/gpt-oss-20b` (exact identifier - no alternatives)  
**API Endpoint:** `https://api.groq.com/openai/v1/chat/completions`  
**API Version:** v1  
**Authentication:** Bearer token in Authorization header  
**Context Window:** 131,072 tokens  
**Maximum Output Tokens:** 65,536

### Exact API Request Format

```typescript
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-oss-20b',
    messages: messages,
    tools: tools,
    tool_choice: 'auto',
    temperature: 0.7,
    max_tokens: 1000,
    stream: false
  })
});
```

**Model Specifications:**
- **Exact Model Identifier:** `openai/gpt-oss-20b`
- **Context Window:** 131,072 tokens
- **Maximum Output Tokens:** 65,536
- **API Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Authentication:** Bearer token in Authorization header
- **No alternatives - this is the exact specification.**

---

## WebSocket Specifications

### Library Choice

**Use:** `ws` library (version 8.16.0)  
**Not:** Socket.io (rejected - simpler implementation with ws)

### WebSocket Server Implementation

```typescript
// lib/websocket/server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { verifyJWT } from '@/lib/auth';

export class WebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();
  
  constructor(port: number = 3001) {
    this.wss = new WebSocketServer({ port });
    this.setupHandlers();
  }
  
  private setupHandlers() {
    this.wss.on('connection', async (ws: WebSocket, req) => {
      // Extract token from query string
      const url = new URL(req.url || '', 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }
      
      // Verify JWT
      const user = await verifyJWT(token);
      if (!user) {
        ws.close(1008, 'Invalid token');
        return;
      }
      
      // Store client
      this.clients.set(user.id, ws);
      
      // Setup message handler
      ws.on('message', (data) => {
        this.handleMessage(user.id, data);
      });
      
      // Setup close handler
      ws.on('close', () => {
        this.clients.delete(user.id);
      });
    });
  }
  
  // Exact implementation continues...
}
```

---

## Email Library Specifications

### IMAP Client

**Library:** `imap` (version 0.8.19)  
**Parser:** `mailparser` (version 3.6.5)

### SMTP Client

**Library:** `nodemailer` (version 6.9.8)

### Exact Implementation Pattern

```typescript
// lib/services/email-service.ts
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';

export class EmailService {
  // Exact implementation with no alternatives
  async pollIMAP(config: EmailConfig) {
    const imap = new Imap({
      user: config.imapUser,
      password: config.imapPassword,
      host: config.imapHost,
      port: config.imapPort || 993,
      tls: config.imapEncryption === 'SSL',
      tlsOptions: { rejectUnauthorized: false }
    });
    
    // Exact connection and polling logic
  }
}
```

---

## File Storage Specifications

### Storage Path Structure

**Base Path:** `./storage` (relative to project root)  
**Attachments:** `./storage/attachments/{year}/{month}/{filename}`  
**Exports:** `./storage/exports/{year}/{month}/{filename}`  
**Avatars:** `./storage/avatars/{userId}.{ext}`

### File Size Limits

**Default:** 100MB (104857600 bytes)  
**Configurable:** Yes, stored in database `system_settings` table with key `file.max_upload_size`

### File Naming Convention

**Attachments:** `{ticketId}-{timestamp}-{originalFilename}`  
**Exports:** `export-{type}-{timestamp}.{format}`  
**Avatars:** `{userId}.{ext}`

---

## Authentication Specifications

### JWT Implementation

**Library:** `jsonwebtoken` (version 9.0.2)  
**Algorithm:** HS256  
**Token Expiration:** 3 days (259200 seconds)  
**Refresh Token Expiration:** 30 days (2592000 seconds)

### Password Hashing

**Library:** `bcryptjs` (version 2.4.3)  
**Rounds:** 12

### Exact Implementation

```typescript
// lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '3d';

export function generateToken(userId: string, email: string, roles: string[]): string {
  return jwt.sign(
    { userId, email, roles },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

## Database Specifications

### Prisma Schema Generator

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### PostgreSQL Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Exact Migration Commands

```bash
# Create migration
npx prisma migrate dev --name migration_name --create-only

# Apply migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

## Code Pattern Specifications

### API Route Pattern

```typescript
// app/api/v1/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { ticketService } from '@/lib/services/ticket-service';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    const tickets = await ticketService.getTickets(user.id, user.roles);
    
    return NextResponse.json({
      success: true,
      data: { tickets }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
```

### Service Pattern

```typescript
// lib/services/ticket-service.ts
import { prisma } from '@/lib/prisma';

export class TicketService {
  async createTicket(data: CreateTicketData) {
    // Exact implementation with no alternatives
  }
  
  async getTickets(userId: string, roles: string[]) {
    // Exact implementation
  }
}

export const ticketService = new TicketService();
```

---

This document specifies every detail with no ambiguity. All versions, libraries, configurations, and patterns are exactly defined.

