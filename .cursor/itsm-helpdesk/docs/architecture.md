# ITSM Helpdesk System - Detailed Architecture

**Complete system architecture, database schema, component design, and technology specifications.**

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Component Architecture](#component-architecture)
4. [Data Architecture](#data-architecture)
5. [AI Integration Architecture](#ai-integration-architecture)
6. [Email Processing Architecture](#email-processing-architecture)
7. [Authentication & Authorization](#authentication--authorization)
8. [Real-Time Communication](#real-time-communication)
9. [File Storage Architecture](#file-storage-architecture)
10. [Security Architecture](#security-architecture)
11. [Performance Considerations](#performance-considerations)
12. [Scalability Strategy](#scalability-strategy)

---

## System Architecture Overview

### Component Layers

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
│  - WebSocket Server (Real-time communication)                │
│  - Authentication Middleware (JWT, SSO, LDAP)                │
│  - Permission Middleware (RBAC)                                │
│  - Rate Limiting & Security                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Business Logic Layer                       │
│  - Ticket Service (CRUD, workflows, SLA)                     │
│  - AI Service (Groq integration, tool orchestration)        │
│  - Email Service (Receive, send, parse)                       │
│  - KB Service (Article management, search)                    │
│  - CMDB Service (Asset management, relationships)             │
│  - Change Service (Change requests, approvals)               │
│  - Analytics Service (Metrics, reports)                        │
│  - Notification Service (In-app + email)                     │
│  - Audit Service (Logging)                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Data Access Layer                          │
│  - Prisma ORM (Database queries)                              │
│  - Vector Search (pgvector queries for KB)                    │
│  - File System Access (File storage/retrieval)               │
│  - External API Clients (Groq, Email providers)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Data Storage Layer                         │
│  - PostgreSQL (Relational data, metadata)                     │
│  - pgvector (Vector embeddings for KB search)                 │
│  - Filesystem (File storage - attachments, exports)           │
│  - External APIs (Groq API, Email providers)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

- **Framework:** Next.js 16.0.7 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript 5.3.3
- **Styling:** Custom CSS (not Tailwind) - beautiful design system
- **Icons:** @heroicons/react (version 2.1.1) - exact library, no alternatives
- **State Management:** React Context + Zustand (for complex state)
- **Real-Time:** WebSocket client using native WebSocket API (no library needed for client)
- **Forms:** React Hook Form + Zod validation
- **Theme:** Dark mode default with light mode toggle
- **Responsive:** Mobile-first design, fully responsive

### Backend

- **Runtime:** Node.js 20+
- **Framework:** Next.js API Routes
- **ORM:** Prisma 7.0.0
- **Database:** PostgreSQL 16.0 with pgvector extension
- **Authentication:** Custom JWT implementation, NextAuth.js (for SSO), LDAP client
- **Real-Time:** WebSocket using `ws` library (version 8.16.0) - exact library, no alternatives
- **Email:** Nodemailer, IMAP/POP3 clients, SMTP server

### AI & External Services

- **AI Provider:** Groq API
  - **Model:** `openai/gpt-oss-20b` (exact identifier - no alternatives)
  - **Context Window:** 131,072 tokens
  - **Maximum Output Tokens:** 65,536
  - **Tool Calling:** OpenAI-compatible function calling (uses same format as OpenAI API)
  - **API Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
  - **API Version:** v1
  - **Authentication:** Bearer token in Authorization header
  - **Features:** Tool calling, streaming responses, context management, browser search, code execution
  - **Architecture:** 20B parameters with MoE (Mixture-of-Experts), 3.6B active per forward pass
- **Vector Search:** pgvector extension for semantic KB search
- **Email Processing:** IMAP/POP3 polling, SMTP forwarding, webhook support

### Infrastructure

- **Database:** PostgreSQL on same VM as Node.js
- **File Storage:** Local filesystem (hosted on app)
- **Session Storage:** PostgreSQL (for JWT blacklisting if needed)
- **Background Jobs:** BullMQ or similar (for email polling, batch processing)
- **Caching:** In-memory caching using Map data structure (no Redis - explicitly excluded for simplicity)

---

## Component Architecture

### 1. Ticket Management System

**Responsibility:** Handle ticket lifecycle from creation to resolution

**Components:**
- Ticket creation (form, email, API, AI)
- Ticket assignment (auto, round-robin, manual)
- SLA tracking (response time, resolution time)
- Priority management (Low, Medium, High, Critical)
- Status workflow (New, In Progress, Resolved, Closed)
- Escalation rules
- Comments and attachments
- Ticket relationships (linked tickets, parent/child)

**Technology:**
- Next.js API Routes for ticket CRUD
- Prisma for database operations
- WebSocket for real-time updates
- Background jobs for SLA monitoring

**Interactions:**
- Receives tickets from email service, form submissions, API, AI chat widget
- Updates KB service when tickets are resolved
- Sends notifications via notification service
- Tracks SLA via analytics service

---

### 2. AI Chat Widget

**Responsibility:** Provide AI-powered support through chat interface

**Components:**
- Chat UI component (embedded widget)
- Groq API integration
- Tool calling (search KB, create ticket)
- Context management
- Learning from resolved tickets

**Technology:**
- Groq API (GPT OSS 20B)
- OpenAI-compatible tool calling
- WebSocket for streaming responses
- pgvector for KB semantic search

**Tools Available to AI:**
1. **search_knowledge_base** - Search KB articles semantically
2. **create_ticket** - Create ticket when issue can't be resolved
3. **get_ticket_status** - Check status of existing ticket

**Interactions:**
- Accesses KB service for information
- Creates tickets via ticket service when needed
- Learns from resolved tickets (background process)

---

### 3. Knowledge Base System

**Responsibility:** Manage KB articles and provide search functionality

**Components:**
- KB article CRUD
- Auto-creation from resolved tickets
- Categories and tags
- Semantic search (pgvector)
- Keyword search
- AI access (read-only, no direct ticket access)

**Technology:**
- PostgreSQL with pgvector
- OpenAI embeddings (or Groq embeddings if available)
- Prisma for database operations

**Interactions:**
- Receives articles from ticket service (auto-creation)
- Provides search results to AI chat widget
- Provides search results to users

---

### 4. Asset Management (CMDB)

**Responsibility:** Track IT assets and their relationships

**Components:**
- Asset CRUD (hardware, software, network devices, cloud resources)
- Relationship mapping (tickets ↔ assets, assets ↔ users)
- Auto-discovery (research and implement)
- CSV import/export
- Asset lifecycle management

**Technology:**
- Prisma for database operations
- CSV parsing library
- Auto-discovery: Use SNMP for network devices, WMI for Windows, SSH for Linux (exact implementation in asset-service.ts)

**Interactions:**
- Links to tickets (tickets can reference assets)
- Links to users (assets assigned to users)
- Provides data for analytics

---

### 5. Change Management

**Responsibility:** Manage change requests and approval workflows

**Components:**
- Change request CRUD
- Approval workflows (single/multi-stage)
- Change types (Standard, Normal, Emergency)
- Risk assessment
- Integration with tickets

**Technology:**
- Prisma for database operations
- Workflow engine (custom or library)

**Interactions:**
- Can create tickets for change implementation
- Sends notifications for approvals
- Tracks in analytics

---

### 6. Email Processing

**Responsibility:** Receive and process emails as tickets

**Components:**
- IMAP/POP3 polling
- SMTP forwarding
- Webhook support
- Email parsing (subject, body, attachments)
- Reply-to-ticket functionality

**Technology:**
- IMAP/POP3 clients (node-imap, mailparser)
- SMTP server (nodemailer)
- Background jobs for polling

**Interactions:**
- Creates tickets via ticket service
- Sends email replies via email service
- Processes attachments via file service

---

### 7. Analytics & Reporting

**Responsibility:** Provide metrics, dashboards, and reports

**Components:**
- Real-time dashboards
- MTTR, ticket volume, agent performance
- SLA compliance tracking
- Custom reports
- CSV/PDF exports
- Historical data analysis

**Technology:**
- Prisma for data aggregation
- Chart library (Recharts or similar)
- PDF generation library
- CSV export library

**Interactions:**
- Reads data from all services (tickets, changes, assets)
- Provides data to admin and manager dashboards

---

### 8. Configuration System

**Responsibility:** Manage all system settings through admin UI

**Components:**
- Email configuration (stored in database, not env file)
- Authentication settings (registration, password reset, SSO, LDAP)
- File upload limits
- Custom fields and ticket types
- Branding (logo, colors)
- SLA definitions
- Auto-assignment rules

**Technology:**
- Prisma for storing settings
- Admin UI for configuration

**Interactions:**
- All services read from configuration
- Changes take effect immediately (or after restart for some settings)

---

## Data Architecture

### Database Design Principles

1. **Single-Tenant Architecture:** One organization per database instance
2. **Audit Trail:** All tables include audit fields (created_at, updated_at, created_by, etc.)
3. **Vector Storage:** pgvector extension for KB semantic search
4. **Soft Deletes:** Important records use deleted_at for soft deletes
5. **Relationships:** Proper foreign keys and indexes

### Core Tables (High-Level)

- `users` - User accounts
- `roles` - Role definitions (Admin, IT Manager, Agent, End User, Requester)
- `user_roles` - User role assignments
- `tickets` - Ticket records
- `ticket_comments` - Comments on tickets
- `ticket_attachments` - File attachments
- `ticket_history` - Audit trail of ticket changes
- `knowledge_base_articles` - KB articles
- `kb_article_embeddings` - Vector embeddings for KB search
- `assets` - CMDB assets
- `asset_relationships` - Asset relationships
- `change_requests` - Change management
- `change_approvals` - Approval workflow
- `sla_policies` - SLA definitions
- `sla_tracking` - SLA compliance tracking
- `email_configurations` - Email settings (stored in DB)
- `system_settings` - System configuration (stored in DB)
- `notifications` - User notifications
- `audit_logs` - Complete audit trail

See [Database Schema](database-schema.md) for complete schema.

---

## AI Integration Architecture

### Groq API Integration

**Model:** GPT OSS 20B (groq/gpt-oss-20b)

**API Endpoint:** `https://api.groq.com/openai/v1/chat/completions`

**OpenAI-Compatible Tool Calling:**

```typescript
// Example tool definition
const tools = [
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Search the knowledge base for articles that might help resolve the user's issue",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_ticket",
      description: "Create a support ticket when the issue cannot be resolved through the knowledge base",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high", "critical"] }
        },
        required: ["subject", "description"]
      }
    }
  }
];

// API call - exact specification
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-oss-20b', // Exact model identifier
    messages: [...],
    tools: tools,
    tool_choice: 'auto', // Options: 'auto' | 'required' | 'none' | { type: 'function', function: { name: 'tool_name' } }
    temperature: 0.7, // Default: 0.7
    max_tokens: 1000, // Default: 1000
    stream: false // Set to true for streaming responses
  })
});

// Tool calling response format (OpenAI-compatible):
// {
//   "id": "chatcmpl-...",
//   "choices": [{
//     "message": {
//       "role": "assistant",
//       "content": null,
//       "tool_calls": [{
//         "id": "call_...",
//         "type": "function",
//         "function": {
//           "name": "search_knowledge_base",
//           "arguments": "{\"query\": \"printer not working\"}"
//         }
//       }]
//     }
//   }]
// }
```

**Tool Execution Flow:**

1. User sends message to chat widget
2. AI receives message with conversation history
3. AI decides if it needs to call a tool
4. If tool needed, AI returns tool call request
5. Backend executes tool (search KB, create ticket, etc.)
6. Tool results sent back to AI
7. AI generates final response with tool results
8. Response streamed to user via WebSocket

**Learning from Resolved Tickets:**

- Background job analyzes resolved tickets
- Extracts solution patterns
- Creates or updates KB articles
- AI uses updated KB for future queries

**For complete implementation details, see [AI Integration Guide](ai-integration-guide.md)**

---

## Email Processing Architecture

### Email Intake Methods

**1. IMAP/POP3 Polling:**
- Background job polls email account periodically
- Parses emails into tickets
- Handles attachments
- Marks emails as processed

**2. SMTP Forwarding:**
- Email server forwards emails to application
- Application receives via SMTP server
- Parses and creates tickets

**3. Webhook:**
- External email service sends webhook
- Application receives webhook payload
- Creates ticket from payload

**4. Reply-to-Ticket:**
- Tickets have unique reply-to email addresses
- Replies are parsed and added as comments
- Original ticket is updated

### Email Configuration (Database-Stored)

All email settings stored in `email_configurations` table:
- SMTP settings (host, port, user, password, encryption)
- IMAP/POP3 settings (host, port, user, password)
- Webhook URL (if using webhook)
- Reply-to domain configuration

Admin can configure all email settings through UI.

---

## Authentication & Authorization

### Authentication Methods

**1. Internal Authentication (JWT):**
- Email/password login
- JWT tokens (3-day expiration)
- Refresh token mechanism
- Password reset (configurable)

**2. SSO (OAuth2/SAML):**
- NextAuth.js for OAuth2
- SAML support
- Configurable per organization

**3. LDAP/Active Directory:**
- LDAP client integration
- Active Directory support
- Configurable connection settings

### User Roles

1. **Admin:**
   - Full system access
   - Configuration management
   - User management
   - All analytics

2. **IT Manager:**
   - Team management
   - Analytics access
   - Change approval
   - Asset management

3. **Agent:**
   - Ticket resolution
   - Asset management
   - Change requests
   - KB editing

4. **End User:**
   - Submit tickets
   - View own tickets
   - Access KB
   - Use AI chat widget

5. **Requester:**
   - Submit tickets (no account required)
   - View own tickets via email link

### Permission System

- Role-based access control (RBAC)
- Permissions stored in database
- Middleware checks permissions on API routes
- UI components respect permissions

---

## Real-Time Communication

### WebSocket Architecture

**Use Cases:**
- Real-time ticket updates
- Live notifications
- AI chat widget streaming
- Dashboard updates

**Implementation:**
- WebSocket server (ws library or Socket.io)
- Authenticated connections (JWT)
- Room-based messaging (per user, per ticket)
- Fallback to polling if WebSocket unavailable

**Events:**
- `ticket:created` - New ticket notification
- `ticket:updated` - Ticket status/priority change
- `ticket:assigned` - Ticket assignment
- `comment:added` - New comment on ticket
- `notification:new` - New notification
- `ai:response` - AI chat response (streaming)

---

## File Storage Architecture

### Storage Strategy

**Local Filesystem:**
- Files stored on same VM as application
- Organized by type (attachments, exports, avatars)
- Path structure: `/storage/{type}/{year}/{month}/{filename}`

**File Types:**
- Ticket attachments
- KB article attachments
- Asset documents
- Change request attachments
- Exported reports (CSV, PDF)
- User avatars

**Size Limits:**
- Default: 100MB per file
- Configurable by admin
- Stored in database settings

**Security:**
- Files served through authenticated API routes
- Virus scanning: Not implemented in initial version (explicitly excluded)
- Access control based on permissions

---

## Security Architecture

### Security Measures

1. **Authentication:**
   - JWT with secure tokens
   - Password hashing (bcrypt)
   - Rate limiting on login
   - Account lockout after failed attempts

2. **Authorization:**
   - RBAC with database-stored permissions
   - API route protection
   - UI component permission checks

3. **Data Protection:**
   - Input validation (Zod schemas)
   - SQL injection prevention (Prisma)
   - XSS prevention (React escaping)
   - CSRF protection

4. **Email Security:**
   - Encrypted email credentials in database
   - Secure SMTP/IMAP connections
   - Email validation

5. **File Security:**
   - Authenticated file access
   - File type validation
   - Size limits
   - Path traversal prevention

---

## Performance Considerations

### Optimization Strategies

1. **Database:**
   - Comprehensive indexes on frequently queried fields
   - Query optimization
   - Connection pooling
   - Pagination for large datasets

2. **Caching:**
   - In-memory caching for configuration
   - KB article caching
   - In-memory rate limiting using Map data structure (no Redis - explicitly excluded)

3. **Frontend:**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Server-side rendering where appropriate

4. **API:**
   - Response compression
   - Field selection (don't return unnecessary data)
   - Batch operations where possible

5. **Background Jobs:**
   - Async processing for email polling
   - Batch KB article creation
   - Scheduled analytics calculations

---

## Scalability Strategy

### Horizontal Scaling

**Current Design (Single-Tenant):**
- One VM per organization
- Can scale by adding more VMs
- Each VM is independent

**Future Considerations:**
- Load balancer for high-traffic organizations
- Database replication for read-heavy workloads
- CDN for static assets (if needed)

### Vertical Scaling

- Increase VM resources as needed
- PostgreSQL tuning for larger datasets
- Background job workers for processing

---

## Component Interactions

### Ticket Creation Flow

1. User submits ticket (form/email/API/AI)
2. Ticket service creates ticket record
3. SLA tracking starts
4. Auto-assignment rules applied (if configured)
5. Notification sent to assigned agent
6. Real-time update via WebSocket
7. Email confirmation sent to requester

### AI Chat Widget Flow

1. User opens chat widget
2. User sends message
3. AI service receives message
4. AI searches KB (if needed)
5. AI generates response or creates ticket
6. Response streamed to user
7. Conversation saved for learning

### KB Article Auto-Creation Flow

1. Ticket resolved by agent
2. Background job analyzes ticket
3. Extracts solution pattern
4. Creates KB article draft
5. Agent reviews and publishes
6. Article indexed for search
7. AI can now use article

---

This architecture provides a solid foundation for building a comprehensive, scalable ITSM system.

