# ITSM Helpdesk System

Complete IT Service Management platform with AI-powered support, knowledge base, CMDB, change management, and comprehensive analytics.

## Features

- **Multi-Channel Ticket Management** - Email, form, API, and AI chat widget
- **AI-Powered Support** - Groq GPT OSS 20B integration with knowledge base access
- **Knowledge Base** - Auto-creation from resolved tickets, semantic search
- **Asset Management (CMDB)** - Complete IT asset tracking and relationships
- **Change Management** - Approval workflows and change tracking
- **Analytics & Reporting** - Comprehensive dashboards and custom reports
- **Multi-Tenant Support** - Organization and tenant isolation
- **Real-time Updates** - WebSocket-based live updates

## Quick Start

### Prerequisites

- Node.js 20+ LTS
- PostgreSQL 16.0+
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd itsm

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` and log in with demo accounts:
- Admin: `admin@demo.com` / `demo123`
- IT Manager: `manager@demo.com` / `demo123`
- Agent: `agent@demo.com` / `demo123`
- End User: `user@demo.com` / `demo123`

## Documentation

Complete documentation is available in the [`/docs`](./docs) directory:

### Getting Started
- [Setup & Installation](./docs/setup-installation.md) - Installation and configuration
- [Quick Start Guide](./docs/quick-start.md) - Get up and running quickly
- [Configuration](./docs/configuration.md) - Environment variables and settings

### Architecture & Development
- [Architecture Overview](./docs/architecture.md) - System architecture and design
- [API Documentation](./docs/api.md) - Complete API reference
- [Database Schema](./docs/database-schema.md) - Database structure
- [Development Guide](./docs/development.md) - Development workflow

### Features
- [Ticket Management](./docs/features/ticket-management.md) - Ticket workflows
- [AI Chat Widget](./docs/features/ai-chat.md) - AI-powered support
- [Knowledge Base](./docs/features/knowledge-base.md) - KB management
- [Asset Management](./docs/features/asset-management.md) - CMDB functionality
- [Change Management](./docs/features/change-management.md) - Change workflows
- [Analytics & Reporting](./docs/features/analytics.md) - Reports and analytics

### Operations
- [Deployment Guide](./docs/deployment.md) - Production deployment
- [Security Guide](./docs/security.md) - Security best practices
- [Troubleshooting](./docs/troubleshooting.md) - Common issues and solutions
- [Testing Guide](./docs/testing.md) - Testing strategy and procedures

## Technology Stack

- **Framework:** Next.js 16.0.7 (App Router)
- **Language:** TypeScript 5.3.3
- **Database:** PostgreSQL 16.0 with Prisma ORM
- **Authentication:** JWT
- **AI:** Groq GPT OSS 20B
- **Real-time:** WebSocket
- **Testing:** Jest, Playwright

## Development

```bash
# Development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Start production server
npm start
```

## Testing

The project maintains 90%+ test coverage with:
- Unit tests for services and utilities
- Integration tests for API routes
- E2E tests for critical user flows

See [Testing Guide](./docs/testing.md) for complete testing documentation.

## License

[Your License Here]

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests.

## Support

For issues, questions, or contributions, please use the GitHub issue tracker.

