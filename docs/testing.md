# Testing Guide

Complete testing strategy and procedures for the ITSM Helpdesk System.

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
- **Mocking:** Jest mocks for external dependencies

## Test Structure

### Directory Structure

```
__tests__/
  unit/
    services/           # Service layer tests
    api/                # API route tests
    components/         # Component tests
    lib/                # Utility function tests
  integration/          # Integration tests
  e2e/                  # E2E tests (Playwright)
    *.spec.ts
```

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Component tests: `*.test.tsx`
- E2E tests: `*.spec.ts`

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
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## Coverage Requirements

### Minimum Coverage

- **Overall:** 90%
- **Services:** 95%+
- **API Routes:** 95%+
- **Components:** 85%+
- **Utils:** 90%+

### Current Coverage

Run `npm run test:coverage` to see current coverage statistics.

## Test Types

### Unit Tests

Test individual functions, services, and utilities in isolation.

**Example:**
```typescript
import { generateTicketNumber } from '@/lib/services/ticket-service'

describe('generateTicketNumber', () => {
  it('should generate ticket number with correct format', () => {
    const number = generateTicketNumber()
    expect(number).toMatch(/^TKT-\d{4}-\d{4}$/)
  })
})
```

### Integration Tests

Test component interactions, API endpoints, and database operations.

**Example:**
```typescript
import { POST } from '@/app/api/v1/tickets/route'

describe('POST /api/v1/tickets', () => {
  it('should create ticket', async () => {
    // Test implementation
  })
})
```

### E2E Tests

Test complete user flows from start to finish.

**Example:**
```typescript
import { test, expect } from '@playwright/test'

test('should create ticket via form', async ({ page }) => {
  await page.goto('/tickets/new')
  await page.fill('[name="subject"]', 'Test ticket')
  await page.fill('[name="description"]', 'Test description')
  await page.click('button[type="submit"]')
  await expect(page.locator('.ticket-number')).toBeVisible()
})
```

## Mocking

### Prisma Mocking

Service tests mock Prisma client:

```typescript
const mockPrisma = {
  ticket: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get default() {
    return mockPrisma
  },
}))
```

### External Services

Mock external APIs and services:

```typescript
jest.mock('@/lib/services/email-service', () => ({
  sendEmail: jest.fn(),
}))
```

## Test Best Practices

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

## E2E Test Scenarios

### Critical Flows

- **Ticket Creation:** User creates ticket via form
- **AI Chat Widget:** User interacts with AI assistant
- **KB Search:** User searches knowledge base
- **Change Approval:** Change request workflow
- **Login Flow:** User authentication

## Continuous Integration

Tests should run automatically on:
- Pull requests
- Commits to main/develop
- Before deployment

## Related Documentation

- [Development Guide](./development.md)
- [Architecture Overview](./architecture.md)

