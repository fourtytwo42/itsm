# Decisions & Patterns

**Key architectural decisions, design patterns, and conventions established during design and development.**

---

## Table of Contents

1. [Architecture Decisions](#architecture-decisions)
2. [Design Patterns](#design-patterns)
3. [Business Logic Decisions](#business-logic-decisions)
4. [Technical Decisions](#technical-decisions)
5. [Security Decisions](#security-decisions)
6. [Data Management Decisions](#data-management-decisions)
7. [User Experience Decisions](#user-experience-decisions)
8. [Development Patterns](#development-patterns)
9. [Deployment Patterns](#deployment-patterns)

---

## Architecture Decisions

### AD-001: Single-Tenant Architecture

**Decision:** One organization per database instance (single-tenant, not multi-tenant)

**Rationale:**
- Simpler data isolation (no need for tenant filtering)
- Better performance (no tenant queries)
- Easier to scale (deploy multiple instances)
- Lower security risk (complete isolation)
- Easier for organizations to self-host

**Implementation:**
- Each organization gets own VM instance
- Separate PostgreSQL database per instance
- Can scale horizontally with multiple VMs

**Alternatives Considered:**
- Multi-tenant SaaS (rejected - more complex, security concerns)
- Shared database with tenant isolation (rejected - performance and complexity)

---

### AD-002: Next.js 16.0.7 (Latest Version)

**Decision:** Use Next.js 16.0.7 (latest stable version) instead of older versions

**Rationale:**
- Always use latest stable technology
- Better performance and features
- Future-proof
- Access to latest React features

**Implementation:**
- Use Next.js 16.0.7 (exact version)
- Use App Router (not Pages Router)
- Server Components for initial loads
- Turbopack enabled by default (faster builds)

---

### AD-003: PostgreSQL on Same VM

**Decision:** Run PostgreSQL on the same VM as the Node.js application

**Rationale:**
- Simpler deployment (one VM to manage)
- Lower latency (no network calls)
- Cost-effective (no separate database server)
- Sufficient for single organization scale

**Alternatives Considered:**
- Separate database server (rejected - overkill for single organization)
- Managed database (rejected - adds cost and complexity)
- SQLite (rejected - not suitable for production scale)

---

### AD-004: Self-Hostable Design

**Decision:** Application designed to be self-hostable by organizations

**Rationale:**
- Organizations can host on their own VM
- No monthly SaaS fees
- Full control over data
- One-time purchase model

**Implementation:**
- Complete setup scripts
- Comprehensive documentation
- Simple installation process
- Can be managed by IT teams

---

### AD-005: Custom CSS (Not Tailwind)

**Decision:** Use custom CSS design system instead of Tailwind CSS

**Rationale:**
- More control over design
- Top-tier, beautiful UI
- Freshservice-inspired design
- Custom color palette
- Better for unique design requirements

**Implementation:**
- Custom CSS modules
- Design system with variables
- Dark mode default with light mode toggle
- Responsive breakpoints

**Alternatives Considered:**
- Tailwind CSS (rejected - user preference for custom design)
- CSS-in-JS (rejected - performance concerns)

---

## Design Patterns

### DP-001: Freshservice-Inspired UI/UX

**Decision:** Match Freshservice's interface design and user experience

**Rationale:**
- Freshservice is well-known and proven
- Users are familiar with the interface
- Reduces learning curve
- Professional, modern design
- Top-tier ITSM UI

**Implementation:**
- Similar ticket management interface
- Similar dashboard layout
- Similar navigation patterns
- Similar color scheme (dark mode default)
- Mobile-first responsive design

---

### DP-002: Test-Driven Development (TDD)

**Decision:** Write tests first, then implement features

**Rationale:**
- Ensures code quality
- Catches bugs early
- Documents expected behavior
- Enables refactoring with confidence

**Implementation:**
- Write tests for each milestone
- Achieve 90%+ coverage
- 100% pass rate required
- Test-as-you-go methodology

---

### DP-003: Milestone-Based Development

**Decision:** Break development into 12 distinct milestones

**Rationale:**
- Clear progress tracking
- Testable deliverables
- Easier project management
- Natural checkpoints

**Implementation:**
- Each milestone is complete, testable feature set
- Tests must pass before moving forward
- Coverage must be 90%+ per milestone
- All tests must pass (100%)

---

### DP-004: Configuration in Database

**Decision:** All settings configurable through admin UI, stored in database

**Rationale:**
- No reliance on environment files
- Easy to configure without code changes
- Settings can be changed at runtime
- Better for self-hosted deployments

**Implementation:**
- System settings table in database
- Email configurations in database
- Admin UI for all settings
- No env file dependencies for configuration

**Examples:**
- Email settings (SMTP, IMAP, POP3)
- Authentication settings (registration, password reset, SSO, LDAP)
- File upload limits
- Branding (logo, colors)
- Custom fields and ticket types

---

## Business Logic Decisions

### BL-001: End Users Can Submit Without Accounts

**Decision:** Allow ticket submission via public form without requiring accounts

**Rationale:**
- Reduces friction for ticket submission
- Faster ticket creation
- Better user experience
- Standard ITSM practice

**Implementation:**
- Public ticket form (no authentication required)
- Requester email for notifications
- Can create account later if needed
- Ticket tracking via email link

---

### BL-002: AI Chat Widget Creates Tickets

**Decision:** AI chat widget creates tickets when issues can't be resolved

**Rationale:**
- Seamless escalation from AI to human support
- No need for users to manually create tickets
- Better user experience
- Captures context from conversation

**Implementation:**
- AI has `create_ticket` tool
- Tool called when AI can't resolve issue
- Ticket created with conversation context
- User notified of ticket creation

---

### BL-003: Auto-Create KB Articles from Resolved Tickets

**Decision:** Automatically create KB articles from resolved tickets

**Rationale:**
- Builds knowledge base organically
- Captures solutions automatically
- Reduces manual KB maintenance
- Improves KB over time

**Implementation:**
- Background job analyzes resolved tickets
- Extracts solution patterns
- Creates KB article drafts
- Agent reviews and publishes
- AI uses KB for future queries

---

### BL-004: AI Has KB Access, Not Direct Ticket Access

**Decision:** AI can search KB but not directly access tickets

**Rationale:**
- KB articles are cleaner, solution-focused
- Tickets may be confusing with context
- KB is better for AI understanding
- Reduces AI confusion

**Implementation:**
- AI has `search_knowledge_base` tool
- No direct ticket access tool
- AI learns from tickets via KB articles
- KB articles created from resolved tickets

---

### BL-005: Demo Accounts with Auto-Fill

**Decision:** Display demo account buttons on login page with auto-fill

**Rationale:**
- Easy to test different roles
- No need to remember credentials
- Quick access to demo
- Better demo experience

**Implementation:**
- Buttons on login page
- Auto-fill email and password
- One click to login
- Different accounts for each role

---

## Technical Decisions

### TD-001: Groq GPT OSS 20B Model

**Decision:** Use Groq GPT OSS 20B model for AI chat widget

**Rationale:**
- Cost-efficient
- Supports OpenAI-compatible tool calling
- Good performance
- Long-context reasoning

**Implementation:**
- Groq API integration
- OpenAI-compatible function calling
- Tool calling for KB search and ticket creation
- Streaming responses

**API Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
**Model:** `openai/gpt-oss-20b` (exact identifier - no alternatives)
**Note:** Model is OpenAI-compatible, so tool calling uses the same format as OpenAI's API

---

### TD-002: pgvector for KB Semantic Search

**Decision:** Use pgvector extension for semantic KB search

**Rationale:**
- Native PostgreSQL extension
- Fast semantic search
- No external service needed
- Integrates with existing database

**Implementation:**
- pgvector extension enabled
- Vector embeddings stored in database
- Semantic search queries
- HNSW index for performance

---

### TD-003: WebSocket for Real-Time Updates

**Decision:** Use WebSocket (ws library) for real-time updates

**Rationale:**
- Low latency
- Efficient (persistent connection)
- Good for ticket updates
- Standard approach

**Implementation:**
- WebSocket server using `ws` library
- Authenticated connections (JWT)
- Room-based messaging
- Fallback to polling if WebSocket unavailable

---

### TD-004: Local Filesystem for File Storage

**Decision:** Store files on local filesystem (same VM as app)

**Rationale:**
- Simpler deployment
- No external service needed
- Cost-effective
- Sufficient for single organization

**Implementation:**
- Files stored in `/storage/` directory
- Organized by type (attachments, exports, avatars)
- Served through authenticated API routes
- Size limits configurable (default 100MB)

**Alternatives Considered:**
- Cloud storage (S3, etc.) - rejected - adds complexity and cost
- Database storage - rejected - not suitable for large files

---

### TD-005: Email Configuration in Database

**Decision:** Store all email settings in database, not environment file

**Rationale:**
- Configurable through admin UI
- No code changes needed
- Can change at runtime
- Better for self-hosted deployments

**Implementation:**
- Email configurations table
- Encrypted passwords
- Admin UI for configuration
- Support for multiple email accounts

---

## Security Decisions

### SD-001: JWT Authentication

**Decision:** Use JWT tokens for authentication

**Rationale:**
- Stateless (no server-side sessions)
- Scalable
- Standard approach
- Works well with Next.js

**Implementation:**
- JWT tokens with 3-day expiration
- Refresh token mechanism
- HTTP-only cookies: Not used (JWT stored in localStorage on client, sent in Authorization header)
- Secure token storage

---

### SD-002: Role-Based Access Control (RBAC)

**Decision:** Implement role-based permissions

**Rationale:**
- Clear permission model
- Easy to understand
- Flexible (can add roles)
- Secure by default

**Implementation:**
- Roles: Admin, IT Manager, Agent, End User, Requester
- Permissions per role
- Middleware checks permissions
- Database-level constraints

---

### SD-003: Encrypted Email Credentials

**Decision:** Encrypt email credentials in database

**Rationale:**
- Security best practice
- Protects sensitive credentials
- Defense in depth
- Required for compliance

**Implementation:**
- Encrypt passwords before storing
- Decrypt when needed
- Use strong encryption (AES-256)
- Secure key management

---

### SD-004: Input Validation

**Decision:** Validate all inputs with Zod schemas

**Rationale:**
- Prevents injection attacks
- Type safety
- Clear error messages
- Consistent validation

**Implementation:**
- Zod schemas for all API endpoints
- React Hook Form with Zod resolvers
- Validation at API and UI level
- Clear error messages

---

## Data Management Decisions

### DM-001: Full Audit Trail

**Decision:** Track all critical actions in audit logs

**Rationale:**
- Compliance requirements
- Debugging and troubleshooting
- Security monitoring
- Business analytics

**Implementation:**
- AuditLog table for all actions
- Track: user, action, entity, changes, IP, timestamp
- Exportable audit logs
- Immutable logs (no updates/deletes)

---

### DM-002: Soft Deletes for Important Records

**Decision:** Use soft deletes (deletedAt) for important records

**Rationale:**
- Preserve data for analytics
- Can recover if needed
- Maintain referential integrity
- Audit trail preservation

**Implementation:**
- `deletedAt` timestamp field
- Filter deleted records in queries
- Can restore if needed
- Permanent delete option (admin only)

---

### DM-003: CSV Import/Export

**Decision:** Support CSV import/export for assets, tickets, and other data

**Rationale:**
- Bulk operations
- Data migration
- Reporting
- Integration with other systems

**Implementation:**
- CSV parsing library
- Import validation
- Export with filters
- Error handling for invalid data

---

## User Experience Decisions

### UX-001: Dark Mode Default

**Decision:** Dark mode as default theme with light mode toggle

**Rationale:**
- Modern, professional appearance
- Better for extended use
- Reduces eye strain
- Top-tier design

**Implementation:**
- Dark mode CSS variables
- Light mode toggle
- User preference stored
- System preference detection

---

### UX-002: Fully Responsive Design

**Decision:** Design works perfectly on desktop, tablet, and mobile

**Rationale:**
- Users access from all devices
- Mobile-first approach
- Better user experience
- Industry standard

**Implementation:**
- Mobile-first CSS
- Responsive breakpoints
- Touch-friendly buttons
- Optimized for all screen sizes

---

### UX-003: No Email Verification Required

**Decision:** Registration does not require email verification (configurable)

**Rationale:**
- Reduces friction
- Faster onboarding
- Can be enabled if needed
- Configurable by admin

**Implementation:**
- Email verification optional (default: disabled)
- Configurable in admin settings
- Can enable if needed
- Verification email sent if enabled

---

### UX-004: Configurable Registration and Password Reset

**Decision:** Registration and password reset configurable by admin

**Rationale:**
- Flexibility for different organizations
- Can disable if using SSO/LDAP
- Admin control
- Better for enterprise deployments

**Implementation:**
- Settings in database
- Admin UI toggles
- Can enable/disable features
- Works with SSO/LDAP

---

## Development Patterns

### DEV-001: Test Coverage Target

**Decision:** 90%+ test coverage, 100% pass rate

**Rationale:**
- High quality code
- Catch bugs early
- Confidence in changes
- Industry standard

**Implementation:**
- Unit tests for all functions
- Integration tests for APIs
- E2E tests for critical paths
- Coverage reports
- All tests must pass

---

### DEV-002: Test-as-You-Go

**Decision:** Test each milestone before moving forward

**Rationale:**
- Prevents accumulation of bugs
- Easier to fix issues early
- Clear progress tracking
- Better code quality

**Implementation:**
- Write tests for milestone
- Implement features
- Achieve 90%+ coverage
- Ensure 100% pass rate
- Commit and push
- Move to next milestone

---

### DEV-003: TypeScript Strict Mode

**Decision:** Use TypeScript with strict mode enabled

**Rationale:**
- Type safety
- Catch errors at compile time
- Better IDE support
- Industry standard

**Implementation:**
- Strict TypeScript configuration
- No `any` types
- Proper type definitions
- Type-safe code throughout

---

### DEV-004: Component-Based Architecture

**Decision:** Build UI with reusable components

**Rationale:**
- Code reusability
- Consistency
- Easier maintenance
- Faster development

**Implementation:**
- Base UI components
- Feature-specific components
- Composable patterns
- Component library

---

## Deployment Patterns

### DEP-001: Environment-Based Configuration

**Decision:** Minimal environment variables (only secrets)

**Rationale:**
- Most settings in database
- Easy to configure
- No code changes needed
- Secure (secrets in env)

**Implementation:**
- `.env` file for secrets only (JWT secret, Groq API key)
- All other settings in database
- `.env.example` as template
- Documentation for all variables

---

### DEP-002: Seed Script for Demo Data

**Decision:** Comprehensive seed script for demo data

**Rationale:**
- Easy to reset demo instance
- Showcases all features
- Consistent demo experience
- Can reset daily

**Implementation:**
- Seed script creates demo accounts
- Sample tickets with various statuses
- Sample KB articles
- Sample assets
- Sample change requests
- Historical analytics data

---

### DEP-003: Mock Services for Testing

**Decision:** Mock external services (Groq, Email) in tests

**Rationale:**
- Tests don't depend on external services
- Faster test execution
- No API costs during testing
- Deterministic tests

**Implementation:**
- Mock Groq API responses
- Mock email service
- Mock file system operations
- All mocks in test fixtures

---

## Pattern Summary

### Code Organization

- **File Structure:** Feature-based organization
- **Naming:** kebab-case files, PascalCase components, camelCase functions
- **Imports:** Absolute imports with `@/` alias
- **Exports:** Named exports preferred

### Error Handling

- **Pattern:** Try-catch with specific error types
- **Response:** Consistent error format
- **Logging:** Log errors with context
- **User Messages:** Clear, helpful error messages

### State Management

- **Client State:** Zustand stores (for complex state)
- **Server State:** React Server Components
- **Form State:** React Hook Form
- **Real-Time:** WebSocket for live updates

### API Design

- **RESTful:** Standard REST patterns
- **Versioning:** `/api/v1/` prefix
- **Response Format:** Consistent JSON structure
- **Error Codes:** Standardized error codes

### Database Patterns

- **ORM:** Prisma for type safety
- **Migrations:** Prisma Migrate
- **Seeding:** TypeScript seed script
- **Queries:** Optimized with indexes
- **Vector Search:** pgvector for semantic search

---

## Decision Log

### Decisions Made

1. ✅ Single-tenant architecture
2. ✅ Next.js 15+ (latest)
3. ✅ PostgreSQL on same VM
4. ✅ Self-hostable design
5. ✅ Custom CSS (not Tailwind)
6. ✅ Groq GPT OSS 20B for AI
7. ✅ Configuration in database
8. ✅ End users can submit without accounts
9. ✅ AI chat widget creates tickets
10. ✅ Auto-create KB articles from tickets
11. ✅ AI has KB access, not ticket access
12. ✅ Demo accounts with auto-fill
13. ✅ Dark mode default
14. ✅ Fully responsive design
15. ✅ No email verification required (configurable)
16. ✅ Test-driven development
17. ✅ 90% coverage, 100% pass rate

### Decisions Pending

- [ ] Auto-discovery implementation details (research needed)
- [ ] SSO/LDAP integration details (implementation phase)
- [ ] Additional features (future enhancements)

---

This document captures all key decisions and patterns established during the design phase. Refer to this when implementing features to maintain consistency.

