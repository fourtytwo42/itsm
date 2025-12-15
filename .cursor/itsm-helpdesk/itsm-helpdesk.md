---
title: ITSM Helpdesk System
status: planning
category: SaaS / Enterprise / ITSM
tags: [itsm, helpdesk, ticketing, saas, nextjs, postgresql, groq, ai, cmdb, change-management]
keywords: [it service management, helpdesk software, ticketing system, itil, service desk, asset management]
created: 2025-01-XX
---

# ITSM Helpdesk System

**Complete IT Service Management platform** - Full-featured helpdesk and ticketing system with AI-powered support, knowledge base, CMDB, change management, and comprehensive analytics.

A comprehensive, self-hostable ITSM solution built with Next.js, featuring ticket management, AI chat widget, knowledge base, asset management (CMDB), change management, SLA tracking, and complete analytics. Designed to compete with Freshservice and Freshdesk.

## Concept

**Problem Statement:** 
Organizations need a complete IT Service Management system that:
- Handles tickets from multiple sources (email, form, API)
- Provides AI-powered support through chat widget
- Maintains a searchable knowledge base
- Tracks IT assets (CMDB)
- Manages change requests with approval workflows
- Provides comprehensive analytics and reporting
- Is self-hostable and configurable without code changes
- Supports multiple user roles with proper permissions
- Offers a modern, beautiful UI that works on all devices

Current solutions are either too expensive (monthly SaaS fees), too complex to configure, lack essential features, or have outdated interfaces.

**Solution Vision:**
A single, comprehensive ITSM application that combines:
- Multi-channel ticket intake (email, form, API, AI chat widget)
- AI-powered chat widget with knowledge base access
- Automatic knowledge base article creation from resolved tickets
- Complete asset management (CMDB) with auto-discovery
- Change management with flexible approval workflows
- SLA tracking and escalation
- Comprehensive analytics and custom reporting
- Self-hostable on organization's own VM
- Fully configurable through admin interface (no env file dependencies)

**Core Philosophy:**
- **Fully Featured:** Everything needed in one system - tickets, KB, CMDB, changes, analytics
- **AI-Enhanced:** AI chat widget learns from resolved tickets and helps users before creating tickets
- **Self-Hostable:** Organizations control their data and avoid recurring fees
- **Configurable:** All settings (email, auth, etc.) configurable through admin UI, stored in database
- **Beautiful UI:** Top-tier design inspired by Freshservice, dark mode default, fully responsive
- **Test-Driven:** 90% coverage, 100% passing tests at every stage
- **Demo-Ready:** Comprehensive seed data for showcasing all features

**Target Users:**
- **Primary:** IT Managers and Administrators (system configuration, user management)
- **Secondary:** IT Agents (ticket resolution, asset management, change management)
- **Tertiary:** End Users (submit tickets via form or email, use AI chat widget)
- **End Users:** Can submit tickets without accounts (public form)

**Success Metrics:**
- **Adoption:** Number of organizations using the system
- **Ticket Resolution:** Average resolution time, first response time
- **AI Effectiveness:** Percentage of issues resolved by AI chat widget
- **User Satisfaction:** Ease of use, UI quality
- **Technical:** 90%+ test coverage, 100% pass rate, zero critical bugs
- **Performance:** <2s page load times, 99.9% uptime

---

## 📚 Documentation Index

### Getting Started
- **[Setup & Installation Guide](docs/setup-installation.md)** - Complete setup instructions, VM deployment, initial configuration
- **[Development Guide](docs/development-guide.md)** - Development environment setup, milestones, testing methodology
- **[Environment Variables](docs/environment-variables.md)** - Complete ENV configuration reference

### Architecture & Design
- **[System Architecture](docs/architecture.md)** - Complete system design, component breakdown, technology stack
- **[Database Schema](docs/database-schema.md)** - Complete database schema, relationships, indexes, migrations
- **[API Specifications](docs/api-specifications.md)** - All API endpoints, request/response formats, authentication
- **[Implementation Specifications](docs/implementation-specifications.md)** - Exact versions, configurations, file structures, code patterns
- **[Exact Specifications](docs/EXACT_SPECIFICATIONS.md)** - **CRITICAL:** Every exact specification with no ambiguity - use this as reference
- **[AI Integration Guide](docs/ai-integration-guide.md)** - Complete implementation guide for Groq API, tool calling, streaming
- **[Decisions & Patterns](docs/decisions-patterns.md)** - Key architectural decisions, design patterns, and conventions

### Features & Functionality
- **[Ticket Management](docs/features/ticket-management.md)** - Ticket lifecycle, workflows, SLA tracking
- **[AI Chat Widget](docs/features/ai-chat-widget.md)** - AI integration, tool calling, KB access
- **[AI Integration Guide](docs/ai-integration-guide.md)** - Complete implementation guide for Groq API, tool calling, streaming
- **[Knowledge Base](docs/features/knowledge-base.md)** - KB management, auto-creation from tickets, search
- **[Asset Management (CMDB)](docs/features/asset-management.md)** - Asset tracking, relationships, auto-discovery, CSV import/export
- **[Change Management](docs/features/change-management.md)** - Change requests, approval workflows, risk assessment
- **[Analytics & Reporting](docs/features/analytics-reporting.md)** - Dashboards, metrics, custom reports, exports

### Operations
- **[Testing Guide](docs/testing-guide.md)** - Testing strategy, coverage requirements, E2E tests with Playwright
- **[Deployment Guide](docs/deployment-guide.md)** - Production deployment, scaling, monitoring
- **[Security Guide](docs/security-guide.md)** - Security best practices, data protection, authentication
- **[Troubleshooting Guide](docs/troubleshooting-guide.md)** - Common issues and solutions

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ LTS
- PostgreSQL 16.0 (already installed on VM)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd itsm-helpdesk
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Seed demo data:**
   ```bash
   npm run db:seed
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

For detailed setup instructions, see [Setup & Installation Guide](docs/setup-installation.md).

---

## 📋 Project Overview

### Core Features

- **Multi-Channel Ticket Intake**
  - Email tickets (IMAP/POP3 polling, SMTP forwarding, webhook)
  - Public ticket form (no account required)
  - API for programmatic ticket creation
  - AI chat widget (creates tickets when needed)

- **AI-Powered Support**
  - Groq GPT OSS 20B model with OpenAI-compatible tool calling
  - Chat widget with knowledge base access
  - Learns from resolved tickets
  - Creates tickets when issues can't be resolved

- **Knowledge Base**
  - Auto-creation of KB articles from resolved tickets
  - Categories and tags for organization
  - Semantic and keyword search
  - AI has access to KB (not direct ticket access)

- **Asset Management (CMDB)**
  - Hardware, software, network devices, cloud resources
  - Relationship mapping (tickets ↔ assets, assets ↔ users)
  - Auto-discovery capabilities
  - CSV import/export

- **Change Management**
  - Change requests with approval workflows
  - Change types: Standard, Normal, Emergency
  - Risk assessment
  - Integration with tickets

- **SLA & Escalation**
  - SLA tracking (response time, resolution time)
  - Priority levels (Low, Medium, High, Critical)
  - Auto-escalation rules
  - Assignment (auto-assign, round-robin, manual)

- **Analytics & Reporting**
  - MTTR, ticket volume, agent performance
  - SLA compliance tracking
  - Custom reports
  - CSV/PDF exports
  - Historical data analysis

- **User Management**
  - Roles: Admin, IT Manager, Agent, End User, Requester
  - JWT authentication
  - SSO and LDAP support
  - Configurable registration and password reset
  - Demo accounts with auto-fill on login page

- **Configuration**
  - All settings configurable through admin UI
  - Email settings stored in database (not env file)
  - Custom fields and ticket types
  - Branding customization (logo, colors)
  - File upload limits (default 100MB, configurable)

### Technology Stack

**Frontend:**
- Next.js 15+ (App Router)
- React 19
- TypeScript 5.x
- Custom CSS (not Tailwind) - beautiful design system
- Dark mode default with light mode toggle
- Fully responsive (desktop to mobile)

**Backend:**
- Next.js API Routes
- Node.js 20+
- Prisma ORM
- PostgreSQL 16.0 (with pgvector for semantic search)

**AI & External Services:**
- Groq API (GPT OSS 20B model)
- OpenAI-compatible tool calling
- Email processing (IMAP/POP3/SMTP)
- File storage (local filesystem)

**Testing:**
- Jest (unit/integration tests)
- Playwright (E2E tests)
- 90% coverage requirement
- 100% pass rate requirement

**Real-Time:**
- WebSockets for live updates
- Real-time notifications

---

## Core Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
│  (React, Custom CSS, Dark Mode, Responsive)                  │
│  - Ticket Management UI                                      │
│  - AI Chat Widget                                           │
│  - Knowledge Base                                           │
│  - CMDB Interface                                           │
│  - Change Management                                        │
│  - Analytics Dashboard                                       │
│  - Admin Configuration                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/WebSocket
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  Next.js API Routes                          │
│  (JWT Auth, RBAC, Groq AI Integration)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│  PostgreSQL  │ │    Groq     │ │  Email     │
│  + pgvector  │ │    API      │ │  Service   │
│  (Data,      │ │  (GPT OSS   │ │  (IMAP/    │
│   Vectors,   │ │   20B, Tool │ │  POP3/     │
│   KB Search)│ │  Calling)   │ │  SMTP)     │
└──────────────┘ └─────────────┘ └────────────┘
        │
        │
┌───────▼──────┐
│  Filesystem  │
│  (File       │
│   Storage)   │
└──────────────┘
```

### Key Technologies

- **Frontend:** Next.js 16.0.7, React 19, TypeScript 5.x, Custom CSS
- **Backend:** Next.js API Routes, Node.js 20+
- **Database:** PostgreSQL 16.0 with pgvector extension
- **AI:** Groq GPT OSS 20B with OpenAI-compatible tool calling
- **Authentication:** JWT, SSO (OAuth2/SAML), LDAP
- **File Storage:** Local filesystem (hosted on app)
- **Real-Time:** WebSockets for live updates
- **Email:** IMAP/POP3 polling, SMTP forwarding, webhook support

---

## Project Artifacts

**Architecture:**
- [Detailed Architecture](docs/architecture.md) - Complete system design, database schema, component interactions, technology stack details

**API Specifications:**
- [API Specifications](docs/api-specifications.md) - All API endpoints, request/response formats, authentication, WebSocket events

**Implementation:**
- [Build Plan & Implementation Guide](docs/development-guide.md) - Phased development approach, setup instructions, coding patterns, deployment strategy, testing requirements

**Database:**
- [Database Schema](docs/database-schema.md) - Complete database schema, indexes, migrations

**Testing:**
- [Testing Guide](docs/testing-guide.md) - Complete testing strategy, coverage requirements, E2E tests with Playwright

**Decisions:**
- [Decisions & Patterns](docs/decisions-patterns.md) - Key architectural decisions, design patterns, and conventions

---

## Status

**Current Phase:** Planning

**Project Status:** Project in planning phase - comprehensive documentation being created

**Key Accomplishments:**
- ✅ Requirements gathering and clarification complete
- ✅ Technology stack selected (Groq GPT OSS 20B, Next.js, PostgreSQL)
- ✅ Feature set defined (tickets, KB, CMDB, changes, analytics, AI)

**Next Steps:**
- [ ] Complete architecture documentation
- [ ] Design database schema
- [ ] Create API specifications
- [ ] Build implementation plan with milestones
- [ ] Design seed script for demo data
- [ ] Create testing strategy

**Completion Goals:**
- Full-featured ITSM system with all core features
- AI-powered chat widget with KB access
- Complete asset management and change management
- Comprehensive analytics and reporting
- Beautiful, responsive UI (Freshservice-inspired)
- 90% test coverage, 100% passing tests
- Production-ready deployment

---

## Testing Requirements

**CRITICAL:** All features must meet the following testing requirements:
- **Code Coverage:** Minimum 90% test coverage
- **Test Pass Rate:** 100% of tests must pass
- **Test Types:** Unit tests, integration tests, E2E tests with Playwright
- **Definition of Done:** Feature is only considered complete when:
  1. Code coverage is ≥ 90%
  2. All tests pass (100%)
  3. Tests are properly documented
  4. Edge cases are covered
  5. E2E tests cover critical user flows

**Testing Strategy:**
- Unit tests for all utilities, helpers, and business logic
- Integration tests for API endpoints, database operations, external APIs
- E2E tests for critical user flows (ticket creation, AI chat, KB search, etc.)
- Mock external services (Groq API, email service) in tests
- Test all user roles and permissions thoroughly

---

## Demo Accounts

The login page will feature demo account buttons that auto-fill credentials:

- **Admin:** Full system access, configuration
- **IT Manager:** Team management, analytics, change approval
- **Agent:** Ticket resolution, asset management
- **End User:** Ticket submission, KB access

All demo accounts are pre-seeded with realistic data for showcasing all features.

---

## Related Projects

- **[Restaurant Order & Delivery App](../restaurant-order-delivery-app/README.md)** - Similar architecture patterns, testing requirements, seed script approach
- **[Organizational AI Assistant](../organizational-ai-assistant/organizational-ai-assistant.md)** - AI integration patterns, tool calling, semantic search

---

## Notes

- **Single-Tenant:** One organization per VM instance
- **Self-Hostable:** Designed for organization's own VM
- **Configurable:** All settings through admin UI, stored in database
- **No Tailwind:** Custom CSS design system for top-tier UI
- **Dark Mode Default:** Beautiful dark theme with light mode option
- **Fully Responsive:** Works perfectly on desktop, tablet, and mobile
- **Demo-Ready:** Comprehensive seed data for showcasing all features

