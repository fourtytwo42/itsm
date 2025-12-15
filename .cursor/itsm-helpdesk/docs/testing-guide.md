# Testing Guide

**Complete testing strategy, coverage requirements, and testing procedures.**

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Testing Requirements](#testing-requirements)
3. [Test Types](#test-types)
4. [Test Structure](#test-structure)
5. [Writing Tests](#writing-tests)
6. [Running Tests](#running-tests)
7. [Coverage Requirements](#coverage-requirements)
8. [E2E Testing](#e2e-testing)
9. [Test Data Management](#test-data-management)
10. [Mocking External Services](#mocking-external-services)

---

## Testing Overview

### Testing Philosophy

- **Test-Driven Development (TDD):** Write tests first, then implement
- **90%+ Coverage:** Minimum coverage requirement
- **100% Pass Rate:** All tests must pass
- **Test-as-you-go:** Test each milestone before moving forward
- **Comprehensive Testing:** Unit, integration, and E2E tests

### Testing Tools

- **Unit/Integration:** Jest + React Testing Library
- **E2E:** Playwright
- **Coverage:** Jest coverage reports
- **Mocking:** Jest mocks, MSW for API mocking

---

## Testing Requirements

### Coverage Targets

- **Overall Coverage:** 90%+
- **Critical Paths:** 100% coverage
- **Business Logic:** 95%+ coverage
- **UI Components:** 85%+ coverage
- **API Endpoints:** 95%+ coverage

### Pass Rate

- **All Tests:** 100% must pass
- **No Skipped Tests:** All tests must run
- **No Flaky Tests:** Tests must be deterministic

### Test Methodology

1. Write tests for milestone
2. Implement features to pass tests
3. Achieve 90%+ coverage
4. Ensure 100% pass rate
5. Commit and push
6. Move to next milestone

---

## Test Types

### Unit Tests

**Purpose:** Test individual functions, utilities, and pure logic

**Examples:**
- Ticket number generation
- SLA calculations
- Date formatting
- Validation functions
- Utility functions

**Location:** `__tests__/unit/`

**Example:**
```typescript
import { generateTicketNumber } from '@/lib/ticket-utils'

describe('generateTicketNumber', () => {
  it('should generate ticket number with correct format', () => {
    const number = generateTicketNumber()
    expect(number).toMatch(/^TKT-\d{4}-\d{4}$/)
  })
  
  it('should generate unique ticket numbers', () => {
    const number1 = generateTicketNumber()
    const number2 = generateTicketNumber()
    expect(number1).not.toBe(number2)
  })
})
```

### Integration Tests

**Purpose:** Test component interactions, API endpoints, database operations

**Examples:**
- API endpoint tests
- Database query tests
- Service integration tests
- Email processing tests

**Location:** `__tests__/integration/`

**Example:**
```typescript
import { createTicket } from '@/lib/ticket-service'
import { prisma } from '@/lib/prisma'

describe('Ticket Service', () => {
  beforeEach(async () => {
    await prisma.ticket.deleteMany()
  })
  
  it('should create ticket with all fields', async () => {
    const ticket = await createTicket({
      subject: 'Test ticket',
      description: 'Test description',
      requesterEmail: 'test@example.com',
      priority: 'MEDIUM'
    })
    
    expect(ticket).toHaveProperty('id')
    expect(ticket.ticketNumber).toMatch(/^TKT-/)
    expect(ticket.status).toBe('NEW')
  })
})
```

### E2E Tests

**Purpose:** Test complete user flows in real browser

**Examples:**
- Ticket creation flow
- AI chat widget flow
- KB search flow
- Change approval flow
- Login flow

**Location:** `__tests__/e2e/`

**Example:**
```typescript
import { test, expect } from '@playwright/test'

test('should create ticket via public form', async ({ page }) => {
  await page.goto('/tickets/new')
  
  await page.fill('[name="subject"]', 'Test ticket')
  await page.fill('[name="description"]', 'Test description')
  await page.fill('[name="requesterEmail"]', 'test@example.com')
  await page.selectOption('[name="priority"]', 'MEDIUM')
  
  await page.click('button[type="submit"]')
  
  await expect(page.locator('.ticket-number')).toBeVisible()
  await expect(page.locator('.ticket-number')).toContainText('TKT-')
})
```

---

## Test Structure

### Directory Structure

```
__tests__/
  unit/
    services/
      ticket-service.test.ts
      kb-service.test.ts
      asset-service.test.ts
    lib/
      ticket-utils.test.ts
      sla-calculations.test.ts
      validations.test.ts
    utils/
      formatters.test.ts
  integration/
    api/
      tickets.test.ts
      kb.test.ts
      assets.test.ts
    database/
      queries.test.ts
  components/
    TicketCard.test.tsx
    TicketForm.test.tsx
    ChatWidget.test.tsx
  e2e/
    ticket-creation.spec.ts
    ai-chat.spec.ts
    kb-search.spec.ts
    change-approval.spec.ts
    login.spec.ts
  fixtures/
    tickets.ts
    users.ts
    assets.ts
    kb-articles.ts
  mocks/
    groq.ts
    email.ts
```

### Test File Naming

- Unit tests: `*.test.ts`
- Component tests: `*.test.tsx`
- E2E tests: `*.spec.ts`

---

## Writing Tests

### Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  })
  
  afterEach(() => {
    // Cleanup after each test
  })
  
  it('should do something specific', () => {
    // Arrange
    const input = ...
    
    // Act
    const result = functionUnderTest(input)
    
    // Assert
    expect(result).toBe(expected)
  })
})
```

### Best Practices

1. **Arrange-Act-Assert Pattern:**
   - Arrange: Setup test data
   - Act: Execute function
   - Assert: Verify results

2. **Descriptive Test Names:**
   - Use "should" format
   - Be specific about what is tested

3. **One Assertion Per Test:**
   - Focus on one behavior
   - Easier to debug failures

4. **Mock External Dependencies:**
   - Mock API calls
   - Mock database
   - Mock external services

5. **Use Test Fixtures:**
   - Reusable test data
   - Consistent test setup

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- path/to/test.ts

# Run E2E tests
npm run test:e2e

# Run E2E tests in specific browser
npm run test:e2e -- --browser chromium
npm run test:e2e -- --browser firefox
npm run test:e2e -- --browser webkit
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### CI/CD Integration

Tests should run automatically on:
- Pull requests
- Commits to main/develop
- Before deployment

---

## Coverage Requirements

### Minimum Coverage

- **Overall:** 90%
- **Services:** 95%
- **API Routes:** 95%
- **Components:** 85%
- **Utils:** 90%

### Coverage Exclusions

- Test files
- Configuration files
- Type definitions
- Migration files

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
}
```

---

## E2E Testing

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

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
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Scenarios

**Ticket Creation Flow:**
1. Navigate to ticket form
2. Fill in ticket details
3. Submit ticket
4. Verify ticket created
5. Check email confirmation

**AI Chat Widget Flow:**
1. Open chat widget
2. Send message
3. Verify AI response
4. Test KB search tool
5. Test ticket creation tool

**KB Search Flow:**
1. Navigate to KB
2. Search for article
3. View article
4. Mark as helpful

**Change Approval Flow:**
1. Create change request
2. Submit for approval
3. Approve as approver
4. Verify status change

**Login Flow:**
1. Navigate to login
2. Click demo account button
3. Verify auto-fill
4. Click login
5. Verify dashboard access

---

## Test Data Management

### Test Fixtures

```typescript
// __tests__/fixtures/tickets.ts
export const mockTicket = {
  id: 'ticket_123',
  ticketNumber: 'TKT-2025-0001',
  subject: 'Test ticket',
  description: 'Test description',
  status: 'NEW',
  priority: 'MEDIUM',
  requesterEmail: 'test@example.com'
}

export const mockTickets = [
  mockTicket,
  { ...mockTicket, id: 'ticket_124', ticketNumber: 'TKT-2025-0002' }
]
```

### Database Seeding for Tests

```typescript
// __tests__/setup.ts
import { prisma } from '@/lib/prisma'

export async function setupTestDatabase() {
  // Clear database
  await prisma.ticket.deleteMany()
  await prisma.user.deleteMany()
  
  // Seed test data
  await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      roles: {
        create: {
          role: {
            connect: { name: 'AGENT' }
          }
        }
      }
    }
  })
}
```

---

## Mocking External Services

### Mock Groq API

```typescript
// __tests__/mocks/groq.ts
export const mockGroqResponse = {
  id: 'chatcmpl-123',
  choices: [{
    message: {
      role: 'assistant',
      content: 'Test response'
    }
  }]
}

export const mockGroqClient = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue(mockGroqResponse)
    }
  }
}
```

### Mock Email Service

```typescript
// __tests__/mocks/email.ts
export const mockEmailService = {
  send: jest.fn().mockResolvedValue({ success: true }),
  receive: jest.fn().mockResolvedValue([]),
  parse: jest.fn().mockResolvedValue({
    subject: 'Test email',
    body: 'Test body',
    attachments: []
  })
}
```

### Using Mocks in Tests

```typescript
import { mockGroqClient } from '@/__tests__/mocks/groq'

jest.mock('@groq/sdk', () => ({
  Groq: jest.fn().mockImplementation(() => mockGroqClient)
}))

describe('AI Service', () => {
  it('should call Groq API', async () => {
    await aiService.sendMessage('Test message')
    expect(mockGroqClient.chat.completions.create).toHaveBeenCalled()
  })
})
```

---

## Test Data Cleanup

### After Each Test

```typescript
afterEach(async () => {
  // Clean up test data
  await prisma.ticket.deleteMany({
    where: {
      ticketNumber: { startsWith: 'TKT-TEST-' }
    }
  })
})
```

### Database Transactions

For integration tests, use database transactions:

```typescript
import { prisma } from '@/lib/prisma'

describe('Ticket Service', () => {
  it('should create ticket', async () => {
    await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({ ... })
      // Test assertions
      // Transaction will rollback automatically
    })
  })
})
```

---

This testing guide ensures comprehensive test coverage and quality assurance throughout development.

