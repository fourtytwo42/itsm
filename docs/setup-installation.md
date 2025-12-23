# Setup & Installation Guide

Complete guide for setting up the ITSM Helpdesk System.

## Prerequisites

- **Node.js:** Version 20+ LTS
- **PostgreSQL:** Version 16.0 or higher
- **Git:** For cloning the repository
- **PM2:** For production process management (optional but recommended)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd itsm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/itsm?schema=public"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email Configuration (for email ticket intake)
EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="noreply@example.com"
EMAIL_PASSWORD="your-email-password"
EMAIL_FROM="noreply@example.com"

# AI Configuration (Groq)
GROQ_API_KEY="your-groq-api-key"

# Storage
STORAGE_PATH="./storage"

# WebSocket
WS_PORT=3001
```

### 4. Database Setup

Run database migrations:

```bash
npm run db:migrate
```

Seed demo data:

```bash
npm run db:seed
```

This will create:
- Demo organizations
- Demo users (Admin, IT Manager, Agent, End User)
- Sample tickets
- Sample knowledge base articles
- Sample assets

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Demo Accounts

After seeding, you can log in with these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Global Admin | admin@demo.com | demo123 |
| IT Manager | manager@demo.com | demo123 |
| Agent | agent@demo.com | demo123 |
| End User | user@demo.com | demo123 |

## Production Deployment

### Using PM2

1. Build the application:

```bash
npm run build
```

2. Start with PM2:

```bash
pm2 start ecosystem.config.js
```

3. Save PM2 configuration:

```bash
pm2 save
```

### Using Docker (if configured)

```bash
docker-compose up -d
```

## Verification

After installation, verify everything is working:

1. Access the login page: `http://localhost:3000/login`
2. Log in with a demo account
3. Check that the dashboard loads
4. Create a test ticket
5. Verify database connections

## Troubleshooting

See [Troubleshooting Guide](./troubleshooting.md) for common issues and solutions.

## Next Steps

- Read the [Quick Start Guide](./quick-start.md)
- Review [Configuration](./configuration.md) options
- Check [Development Guide](./development.md) for development workflow

