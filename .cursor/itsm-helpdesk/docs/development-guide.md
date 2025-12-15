# Development Guide

**Complete development workflow, milestones, and implementation guide.**

---

## Table of Contents

1. [Development Workflow](#development-workflow)
2. [Project Setup](#project-setup)
3. [Development Milestones](#development-milestones)
4. [Testing Methodology](#testing-methodology)
5. [Code Standards](#code-standards)
6. [Git Workflow](#git-workflow)

---

## Development Workflow

### Test-Driven Development (TDD) Approach

**Methodology:**
1. Write tests first (unit/integration/E2E)
2. Implement feature to pass tests
3. Achieve 90%+ coverage
4. Ensure 100% pass rate
5. Commit and push
6. Move to next milestone

### Milestone-Based Development

- Each milestone is a complete, testable feature set
- Tests must pass before moving to next milestone
- Coverage must be 90%+ for each milestone
- All tests must pass (100% pass rate)
- E2E tests cover critical user flows

---

## Project Setup

### 1. Initialize Next.js Project

```bash
npx create-next-app@latest itsm-helpdesk --typescript --tailwind=false --app --no-src-dir --import-alias "@/*"
cd itsm-helpdesk
```

### 2. Install Dependencies

```bash
npm install prisma @prisma/client
npm install zod react-hook-form @hookform/resolvers
npm install bcryptjs jsonwebtoken
npm install @types/bcryptjs @types/jsonwebtoken --save-dev
npm install date-fns
npm install ws  # WebSocket
npm install nodemailer @types/nodemailer
npm install csv-writer csv-parse
npm install recharts  # Charts for analytics
npm install openai@4.24.1  # OpenAI-compatible API client (works with Groq)
```

### 3. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Setup Database

```bash
# Initialize Prisma
npx prisma init

# Run migrations
npx prisma migrate dev

# Seed demo data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

---

## Development Milestones

### Milestone 1: Project Foundation & Authentication

**Goal:** Setup project structure, database, and authentication system

**Tasks:**
- [ ] Initialize Next.js 16.0.7 project
- [ ] Setup TypeScript configuration
- [ ] Setup custom CSS (not Tailwind)
- [ ] Setup Prisma with PostgreSQL
- [ ] Create database schema (users, roles, user_roles)
- [ ] Implement JWT authentication
- [ ] Create login/register pages with beautiful UI
- [ ] Implement password hashing (bcrypt)
- [ ] Create password reset flow
- [ ] Setup demo accounts seed data
- [ ] Create demo account login buttons (auto-fill)
- [ ] Implement role-based access control (RBAC)
- [ ] Create protected route middleware
- [ ] Dark mode default with light mode toggle
- [ ] Write tests for authentication (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Working authentication system
- Demo accounts functional
- Role-based access working
- Beautiful login page
- Tests passing with 90%+ coverage

**Estimated Time:** 1-2 weeks

---

### Milestone 2: Ticket Management System

**Goal:** Complete ticket management with CRUD, assignment, and workflow

**Tasks:**
- [ ] Create ticket database schema
- [ ] Implement ticket creation (form, API)
- [ ] Create ticket list page with filters
- [ ] Implement ticket detail page
- [ ] Add ticket comments
- [ ] Implement ticket attachments
- [ ] Create ticket assignment (auto, round-robin, manual)
- [ ] Implement ticket status workflow
- [ ] Add priority management
- [ ] Create ticket history/audit trail
- [ ] Implement ticket linking
- [ ] Add custom fields support
- [ ] Create ticket search
- [ ] Write tests for ticket management (90%+ coverage)
- [ ] E2E tests for ticket creation flow
- [ ] All tests passing (100%)

**Deliverables:**
- Complete ticket management
- Ticket assignment working
- Ticket workflow functional
- Tests passing with 90%+ coverage

**Estimated Time:** 2-3 weeks

---

### Milestone 3: Email Integration

**Goal:** Receive tickets via email and send email notifications

**Tasks:**
- [ ] Create email configuration database schema
- [ ] Build email configuration admin UI
- [ ] Implement IMAP/POP3 polling
- [ ] Implement SMTP forwarding
- [ ] Implement webhook support
- [ ] Parse emails into tickets
- [ ] Handle email attachments
- [ ] Implement reply-to-ticket functionality
- [ ] Create email notification system
- [ ] Send ticket creation confirmations
- [ ] Send ticket update notifications
- [ ] Mock email service for testing
- [ ] Write tests for email processing (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Email ticket intake working
- Email notifications functional
- Email configuration in admin UI
- Tests passing with 90%+ coverage

**Estimated Time:** 2 weeks

---

### Milestone 4: Knowledge Base System

**Goal:** Complete knowledge base with search and auto-creation

**Tasks:**
- [ ] Create KB database schema
- [ ] Setup pgvector extension
- [ ] Implement KB article CRUD
- [ ] Create KB categories and tags
- [ ] Implement semantic search (pgvector)
- [ ] Implement keyword search
- [ ] Create KB article display page
- [ ] Add KB article helpful/not helpful voting
- [ ] Implement auto-creation from resolved tickets
- [ ] Create KB admin interface
- [ ] Generate embeddings for articles
- [ ] Write tests for KB system (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Complete KB system
- Semantic search working
- Auto-creation from tickets
- Tests passing with 90%+ coverage

**Estimated Time:** 2 weeks

---

### Milestone 5: AI Chat Widget

**Goal:** AI-powered chat widget with KB access and ticket creation

**Tasks:**
- [ ] Setup Groq API integration
- [ ] Implement OpenAI-compatible tool calling
- [ ] Create chat widget UI component
- [ ] Implement KB search tool
- [ ] Implement ticket creation tool
- [ ] Create conversation management
- [ ] Implement streaming responses
- [ ] Add context management
- [ ] Create learning from resolved tickets (background job)
- [ ] Write tests for AI chat (90%+ coverage)
- [ ] Mock Groq API for testing
- [ ] E2E tests for chat widget
- [ ] All tests passing (100%)

**Deliverables:**
- AI chat widget functional
- Tool calling working
- KB access via AI
- Ticket creation from AI
- Tests passing with 90%+ coverage

**Estimated Time:** 2-3 weeks

---

### Milestone 6: Asset Management (CMDB)

**Goal:** Complete asset management with relationships and import/export

**Tasks:**
- [ ] Create asset database schema
- [ ] Implement asset CRUD
- [ ] Create asset list page
- [ ] Implement asset relationships
- [ ] Link assets to tickets
- [ ] Create asset assignment
- [ ] Implement CSV import
- [ ] Implement CSV export
- [ ] Research and implement auto-discovery (if feasible)
- [ ] Create asset detail page
- [ ] Write tests for asset management (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Complete CMDB system
- Asset relationships working
- CSV import/export functional
- Tests passing with 90%+ coverage

**Estimated Time:** 2 weeks

---

### Milestone 7: Change Management

**Goal:** Complete change management with approval workflows

**Tasks:**
- [ ] Create change request database schema
- [ ] Implement change request CRUD
- [ ] Create approval workflow system
- [ ] Implement multi-stage approvals
- [ ] Add risk assessment
- [ ] Link changes to tickets
- [ ] Create change request list page
- [ ] Create change request detail page
- [ ] Implement change types (Standard, Normal, Emergency)
- [ ] Write tests for change management (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Complete change management
- Approval workflows working
- Tests passing with 90%+ coverage

**Estimated Time:** 2 weeks

---

### Milestone 8: SLA & Escalation

**Goal:** Implement SLA tracking and escalation rules

**Tasks:**
- [ ] Create SLA policy database schema
- [ ] Implement SLA policy management
- [ ] Create SLA tracking system
- [ ] Implement first response time tracking
- [ ] Implement resolution time tracking
- [ ] Create escalation rules
- [ ] Implement auto-escalation
- [ ] Create SLA compliance dashboard
- [ ] Write tests for SLA system (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- SLA tracking working
- Escalation rules functional
- Tests passing with 90%+ coverage

**Estimated Time:** 1-2 weeks

---

### Milestone 9: Analytics & Reporting

**Goal:** Complete analytics dashboard and reporting

**Tasks:**
- [ ] Create analytics database queries
- [ ] Implement dashboard metrics
- [ ] Create agent performance reports
- [ ] Implement MTTR calculations
- [ ] Create SLA compliance reports
- [ ] Implement custom reports
- [ ] Add CSV export
- [ ] Add PDF export
- [ ] Create historical data analysis
- [ ] Write tests for analytics (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Complete analytics dashboard
- Custom reports functional
- Export functionality working
- Tests passing with 90%+ coverage

**Estimated Time:** 2 weeks

---

### Milestone 10: Real-Time Updates & Notifications

**Goal:** Implement WebSocket real-time updates and notifications

**Tasks:**
- [ ] Setup WebSocket server
- [ ] Implement authenticated WebSocket connections
- [ ] Create real-time ticket updates
- [ ] Implement live notifications
- [ ] Add notification preferences
- [ ] Create notification center UI
- [ ] Implement email notifications
- [ ] Write tests for WebSocket (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Real-time updates working
- Notification system complete
- Tests passing with 90%+ coverage

**Estimated Time:** 1-2 weeks

---

### Milestone 11: Configuration System

**Goal:** Complete admin configuration system

**Tasks:**
- [ ] Create system settings database schema
- [ ] Build admin configuration UI
- [ ] Implement email configuration (stored in DB)
- [ ] Add authentication settings (registration, password reset, SSO, LDAP)
- [ ] Implement file upload limits configuration
- [ ] Add custom fields configuration
- [ ] Add ticket types configuration
- [ ] Implement branding customization
- [ ] Write tests for configuration (90%+ coverage)
- [ ] All tests passing (100%)

**Deliverables:**
- Complete configuration system
- All settings in admin UI
- Tests passing with 90%+ coverage

**Estimated Time:** 1-2 weeks

---

### Milestone 12: Testing, Optimization & Deployment

**Goal:** Complete testing, optimization, and production deployment

**Tasks:**
- [ ] Achieve 90%+ test coverage across all code
- [ ] Ensure 100% test pass rate
- [ ] Run E2E tests (Playwright)
- [ ] Performance optimization
- [ ] Database query optimization
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] Security audit
- [ ] Create production build
- [ ] Setup production environment
- [ ] Deploy to production
- [ ] Setup monitoring and alerts
- [ ] Create backup strategy
- [ ] Documentation review and updates

**Deliverables:**
- 90%+ test coverage
- 100% test pass rate
- Optimized application
- Production deployment complete
- Monitoring setup
- Backup strategy in place

**Estimated Time:** 2-3 weeks

---

## Testing Methodology

### Test Types

1. **Unit Tests:**
   - Test individual functions/components
   - Mock external dependencies
   - Fast execution
   - Target: 90%+ coverage

2. **Integration Tests:**
   - Test component interactions
   - Test API endpoints
   - Test database operations
   - Target: 90%+ coverage

3. **E2E Tests (Playwright):**
   - Test complete user flows
   - Test in real browser
   - Test critical paths
   - Target: All critical paths covered

### Test Structure

```
__tests__/
  unit/
    services/
    utils/
    components/
  integration/
    api/
    database/
  e2e/
    ticket-creation.spec.ts
    ai-chat.spec.ts
    kb-search.spec.ts
    change-approval.spec.ts
  fixtures/
    tickets.ts
    users.ts
    assets.ts
  mocks/
    groq.ts
    email.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run in watch mode
npm run test:watch
```

### Coverage Requirements

- **Minimum Coverage:** 90%
- **Critical Paths:** 100% coverage
- **Business Logic:** 95%+ coverage
- **UI Components:** 85%+ coverage
- **API Endpoints:** 95%+ coverage

---

## Code Standards

### TypeScript

- Strict mode enabled
- No `any` types
- Proper type definitions
- Type-safe code throughout

### File Naming

- Components: PascalCase (e.g., `TicketCard.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- API routes: kebab-case (e.g., `ticket-management.ts`)

### Code Organization

- Feature-based organization
- Absolute imports with `@/` alias
- Named exports preferred
- Clear separation of concerns

### Error Handling

- Try-catch with specific error types
- Consistent error format
- Log errors with context
- Clear, helpful error messages

---

## Git Workflow

### Branch Naming

- `feature/ticket-management` - New features
- `fix/ticket-assignment-bug` - Bug fixes
- `milestone/milestone-2` - Milestone branches

### Commit Messages

- Use conventional commits
- Format: `type(scope): description`
- Examples:
  - `feat(tickets): add ticket assignment`
  - `fix(auth): fix password reset token expiration`
  - `test(tickets): add ticket assignment tests`

### Pull Requests

- All PRs require tests
- Coverage must be 90%+
- All tests must pass
- Code review required

---

This development guide provides a complete roadmap for building the ITSM system.

