# Architecture Overview

Complete system architecture documentation for the ITSM Helpdesk System.

## System Architecture

### Technology Stack

- **Framework:** Next.js 16.0.7 (App Router)
- **Language:** TypeScript 5.3.3
- **Database:** PostgreSQL 16.0 with Prisma ORM
- **Authentication:** JWT (JSON Web Tokens)
- **AI:** Groq GPT OSS 20B (OpenAI-compatible)
- **Real-time:** WebSocket (ws library)
- **Email:** Nodemailer
- **Testing:** Jest, Playwright
- **Process Management:** PM2

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  - Next.js App Router (React Server Components)              │
│  - Client Components (Ticket UI, Chat Widget, Dashboard)    │
│  - Custom CSS Design System (Dark Mode Default)              │
│  - WebSocket Client (Real-time updates)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Application Layer                         │
│  - Next.js API Routes (REST endpoints)                       │
│  - Service Layer (Business Logic)                            │
│  - Middleware (Auth, Audit, Validation)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                     Data Layer                               │
│  - Prisma ORM                                                │
│  - PostgreSQL Database                                       │
│  - File Storage (Local filesystem)                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  External Services                           │
│  - Groq AI API (GPT OSS 20B)                                │
│  - Email Server (SMTP/IMAP)                                 │
│  - WebSocket Server (Real-time)                             │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
itsm/
├── app/                          # Next.js App Router
│   ├── api/v1/                   # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── tickets/              # Ticket management
│   │   ├── kb/                   # Knowledge base
│   │   ├── assets/               # Asset management
│   │   ├── analytics/            # Analytics & reporting
│   │   └── ...                   # Other endpoints
│   ├── (auth)/                   # Auth pages (login, register)
│   ├── dashboard/                # Dashboard pages
│   ├── tickets/                  # Ticket pages
│   └── ...                       # Other pages
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   ├── tickets/                  # Ticket-related components
│   └── ...                       # Other components
├── lib/                          # Core libraries
│   ├── services/                 # Business logic services
│   ├── middleware/               # Middleware functions
│   ├── auth.ts                   # Authentication utilities
│   ├── jwt.ts                    # JWT handling
│   └── prisma.ts                 # Prisma client
├── prisma/                       # Database schema
│   ├── schema.prisma             # Prisma schema
│   └── migrations/               # Database migrations
├── __tests__/                    # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # E2E tests (Playwright)
├── scripts/                      # Utility scripts
├── storage/                      # File storage
└── docs/                         # Documentation
```

## Core Components

### Service Layer

Business logic is organized into service modules:

- `ticket-service.ts` - Ticket CRUD and workflow
- `user-service.ts` - User management
- `kb-service.ts` - Knowledge base management
- `asset-service.ts` - Asset/CMDB management
- `analytics-service.ts` - Analytics and reporting
- `ai-service.ts` - AI chat integration
- `email-service.ts` - Email processing
- `notification-service.ts` - Notifications
- `organization-service.ts` - Organization management
- `tenant-service.ts` - Tenant management

### Middleware

- `auth.ts` - Authentication and authorization
- `audit.ts` - Audit logging
- Request validation and error handling

### API Routes

All API routes follow RESTful conventions:

- `GET /api/v1/tickets` - List tickets
- `POST /api/v1/tickets` - Create ticket
- `GET /api/v1/tickets/:id` - Get ticket
- `PUT /api/v1/tickets/:id` - Update ticket
- `DELETE /api/v1/tickets/:id` - Delete ticket

## Database Schema

See [Database Schema](./database-schema.md) for complete schema documentation.

Key entities:
- Users, Organizations, Tenants
- Tickets, TicketComments, TicketHistory
- KnowledgeBaseArticles
- Assets, AssetRelationships
- ChangeRequests
- AuditLogs

## Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- Organization and tenant-level permissions
- API key support for programmatic access

## Real-time Updates

WebSocket server for real-time updates:
- Ticket assignments
- Status changes
- New comments
- Notifications

## Security

- JWT token authentication
- Password hashing (bcrypt)
- SQL injection protection (Prisma)
- XSS protection
- CSRF protection
- Rate limiting
- Audit logging

## Performance

- Database indexing on frequently queried fields
- Pagination for large datasets
- Caching strategies
- Optimized queries with Prisma

## Scalability

- Stateless API design
- Horizontal scaling support
- Database connection pooling
- File storage abstraction (can use S3, etc.)

## Related Documentation

- [API Documentation](./api.md)
- [Database Schema](./database-schema.md)
- [Security Guide](./security.md)
- [Deployment Guide](./deployment.md)

