# API Documentation

Complete API reference for the ITSM Helpdesk System.

## Base URL

All API endpoints are prefixed with `/api/v1`

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /api/v1/auth/login

Login and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "roles": ["END_USER"]
    },
    "token": "jwt-token-here"
  }
}
```

#### POST /api/v1/auth/register

Register a new user account.

#### POST /api/v1/auth/logout

Logout and invalidate token.

### Tickets

#### GET /api/v1/tickets

List tickets with filtering and pagination.

**Query Parameters:**
- `status` - Filter by status (NEW, IN_PROGRESS, RESOLVED, CLOSED)
- `priority` - Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `assigneeId` - Filter by assignee
- `requesterId` - Filter by requester
- `tenantId` - Filter by tenant
- `category` - Filter by category
- `search` - Search in subject/description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ticket-id",
      "ticketNumber": "TKT-2025-0001",
      "subject": "Ticket subject",
      "status": "NEW",
      "priority": "MEDIUM"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

#### POST /api/v1/tickets

Create a new ticket.

**Request:**
```json
{
  "subject": "Ticket subject",
  "description": "Ticket description",
  "priority": "MEDIUM",
  "assigneeId": "user-id" // Optional
}
```

#### GET /api/v1/tickets/:id

Get ticket details.

#### PUT /api/v1/tickets/:id

Update ticket.

#### DELETE /api/v1/tickets/:id

Delete ticket (soft delete).

### Knowledge Base

#### GET /api/v1/kb/articles

List knowledge base articles.

#### POST /api/v1/kb/articles

Create knowledge base article.

#### GET /api/v1/kb/articles/:id

Get article details.

#### PUT /api/v1/kb/articles/:id

Update article.

#### DELETE /api/v1/kb/articles/:id

Delete article.

### Assets

#### GET /api/v1/assets

List assets.

#### POST /api/v1/assets

Create asset.

#### GET /api/v1/assets/:id

Get asset details.

#### PUT /api/v1/assets/:id

Update asset.

#### DELETE /api/v1/assets/:id

Delete asset.

### Analytics

#### GET /api/v1/analytics/dashboard

Get dashboard metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTickets": 100,
    "openTickets": 25,
    "resolvedToday": 5,
    "averageResponseTime": 120
  }
}
```

#### GET /api/v1/analytics/reports

Generate custom reports.

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

### Error Codes

- `VALIDATION_ERROR` - Invalid input data (400)
- `UNAUTHORIZED` - Authentication required (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `INTERNAL_ERROR` - Server error (500)

## Rate Limiting

API endpoints may be rate-limited. Check response headers for rate limit information.

## Pagination

List endpoints support pagination:

- `page` - Page number (1-indexed)
- `limit` - Items per page (max 100)
- Response includes `pagination` object with `total`, `totalPages`, etc.

## Related Documentation

- [Architecture Overview](./architecture.md)
- [Development Guide](./development.md)

