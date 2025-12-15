# API Specifications

**Complete API endpoint documentation, request/response formats, authentication, and error handling.**

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Ticket Endpoints](#ticket-endpoints)
4. [Knowledge Base Endpoints](#knowledge-base-endpoints)
5. [Asset Management Endpoints](#asset-management-endpoints)
6. [Change Management Endpoints](#change-management-endpoints)
7. [AI Chat Widget Endpoints](#ai-chat-widget-endpoints)
8. [Analytics Endpoints](#analytics-endpoints)
9. [Configuration Endpoints](#configuration-endpoints)
10. [WebSocket Events](#websocket-events)
11. [Error Handling](#error-handling)

---

## API Overview

### Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-domain.com/api`

### API Versioning

All endpoints are under `/api/v1/` (future versions will use `/api/v2/`, etc.)

### Response Format

All responses are JSON:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

### Rate Limiting

- **Public endpoints:** 100 requests/minute per IP
- **Authenticated endpoints:** 1000 requests/minute per user
- **AI chat endpoints:** 50 requests/minute per user

---

## Authentication

### Register

**Endpoint:** `POST /api/v1/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt_token_here",
    "expiresIn": 259200
  }
}
```

### Login

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "roles": ["AGENT"]
    },
    "token": "jwt_token_here",
    "expiresIn": 259200
  }
}
```

### Password Reset Request

**Endpoint:** `POST /api/v1/auth/forgot-password`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Password Reset

**Endpoint:** `POST /api/v1/auth/reset-password`

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## Ticket Endpoints

### Create Ticket (Public)

**Endpoint:** `POST /api/v1/tickets`

**Authentication:** Not required (public form)

**Request:**
```json
{
  "subject": "Printer not working",
  "description": "The printer in the office is not printing.",
  "priority": "MEDIUM",
  "category": "HARDWARE",
  "requesterEmail": "user@example.com",
  "requesterName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "ticket_123",
      "ticketNumber": "TKT-2025-0001",
      "subject": "Printer not working",
      "status": "NEW",
      "priority": "MEDIUM",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  }
}
```

### Get Tickets

**Endpoint:** `GET /api/v1/tickets`

**Authentication:** Required

**Query Parameters:**
- `status` - Filter by status (NEW, IN_PROGRESS, RESOLVED, CLOSED)
- `priority` - Filter by priority (LOW, MEDIUM, HIGH, CRITICAL)
- `assignedTo` - Filter by assigned user ID
- `requester` - Filter by requester email or ID
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sort` - Sort field (default: createdAt)
- `order` - Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Get Ticket

**Endpoint:** `GET /api/v1/tickets/:id`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "ticket_123",
      "ticketNumber": "TKT-2025-0001",
      "subject": "Printer not working",
      "description": "...",
      "status": "IN_PROGRESS",
      "priority": "MEDIUM",
      "assignedTo": {
        "id": "user_456",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "requesterEmail": "user@example.com",
      "comments": [...],
      "attachments": [...],
      "history": [...],
      "createdAt": "2025-01-15T10:00:00Z"
    }
  }
}
```

### Update Ticket

**Endpoint:** `PATCH /api/v1/tickets/:id`

**Authentication:** Required (Agent or higher)

**Request:**
```json
{
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "assignedToId": "user_456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": { ... }
  }
}
```

### Add Comment

**Endpoint:** `POST /api/v1/tickets/:id/comments`

**Authentication:** Required

**Request:**
```json
{
  "comment": "I've restarted the printer. Please try again.",
  "isInternal": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "comment_123",
      "comment": "...",
      "user": { ... },
      "createdAt": "2025-01-15T11:00:00Z"
    }
  }
}
```

### Upload Attachment

**Endpoint:** `POST /api/v1/tickets/:id/attachments`

**Authentication:** Required

**Request:** Multipart form data
- `file` - File to upload
- `commentId` - Optional comment ID to attach to

**Response:**
```json
{
  "success": true,
  "data": {
    "attachment": {
      "id": "attach_123",
      "fileName": "screenshot.png",
      "fileSize": 102400,
      "mimeType": "image/png",
      "createdAt": "2025-01-15T11:00:00Z"
    }
  }
}
```

---

## Knowledge Base Endpoints

### Search KB Articles

**Endpoint:** `GET /api/v1/kb/search`

**Authentication:** Not required (public)

**Query Parameters:**
- `q` - Search query (required)
- `category` - Filter by category ID
- `tags` - Filter by tags (comma-separated)
- `semantic` - Use semantic search (default: true)
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "kb_123",
        "title": "How to reset printer",
        "summary": "...",
        "category": { ... },
        "tags": ["printer", "hardware"],
        "viewCount": 42
      }
    ],
    "pagination": { ... }
  }
}
```

### Get KB Article

**Endpoint:** `GET /api/v1/kb/articles/:id`

**Authentication:** Not required (public)

**Response:**
```json
{
  "success": true,
  "data": {
    "article": {
      "id": "kb_123",
      "title": "How to reset printer",
      "content": "...",
      "category": { ... },
      "tags": [...],
      "viewCount": 43,
      "helpfulCount": 5,
      "createdAt": "2025-01-10T10:00:00Z"
    }
  }
}
```

### Create KB Article

**Endpoint:** `POST /api/v1/kb/articles`

**Authentication:** Required (Agent or higher)

**Request:**
```json
{
  "title": "How to reset printer",
  "content": "...",
  "summary": "Quick guide to resetting office printers",
  "categoryId": "cat_123",
  "tags": ["printer", "hardware"],
  "status": "PUBLISHED"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "article": { ... }
  }
}
```

### Update KB Article

**Endpoint:** `PATCH /api/v1/kb/articles/:id`

**Authentication:** Required (Agent or higher)

**Request:**
```json
{
  "title": "Updated title",
  "content": "Updated content"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "article": { ... }
  }
}
```

---

## Asset Management Endpoints

### Get Assets

**Endpoint:** `GET /api/v1/assets`

**Authentication:** Required

**Query Parameters:**
- `type` - Filter by type (HARDWARE, SOFTWARE, NETWORK_DEVICE, CLOUD_RESOURCE)
- `status` - Filter by status
- `assignedTo` - Filter by assigned user ID
- `page`, `limit`, `sort`, `order`

**Response:**
```json
{
  "success": true,
  "data": {
    "assets": [...],
    "pagination": { ... }
  }
}
```

### Get Asset

**Endpoint:** `GET /api/v1/assets/:id`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "asset": {
      "id": "asset_123",
      "assetNumber": "AST-2025-0001",
      "name": "Dell Laptop XPS 15",
      "type": "HARDWARE",
      "category": "LAPTOP",
      "status": "ACTIVE",
      "assignedTo": { ... },
      "relationships": [...],
      "createdAt": "2025-01-01T10:00:00Z"
    }
  }
}
```

### Create Asset

**Endpoint:** `POST /api/v1/assets`

**Authentication:** Required (Agent or higher)

**Request:**
```json
{
  "name": "Dell Laptop XPS 15",
  "type": "HARDWARE",
  "category": "LAPTOP",
  "manufacturer": "Dell",
  "model": "XPS 15",
  "serialNumber": "SN123456",
  "assignedToId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "asset": { ... }
  }
}
```

### Import Assets (CSV)

**Endpoint:** `POST /api/v1/assets/import`

**Authentication:** Required (Agent or higher)

**Request:** Multipart form data
- `file` - CSV file

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 50,
    "errors": []
  }
}
```

### Export Assets (CSV)

**Endpoint:** `GET /api/v1/assets/export`

**Authentication:** Required (Agent or higher)

**Query Parameters:** Same filters as GET /api/v1/assets

**Response:** CSV file download

---

## Change Management Endpoints

### Get Change Requests

**Endpoint:** `GET /api/v1/changes`

**Authentication:** Required

**Query Parameters:**
- `status` - Filter by status
- `type` - Filter by type (STANDARD, NORMAL, EMERGENCY)
- `requestedBy` - Filter by requester ID
- `page`, `limit`, `sort`, `order`

**Response:**
```json
{
  "success": true,
  "data": {
    "changes": [...],
    "pagination": { ... }
  }
}
```
### Get Change Request

**Endpoint:** `GET /api/v1/changes/:id`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "change": {
      "id": "change_123",
      "changeNumber": "CHG-2025-0001",
      "title": "Upgrade server OS",
      "description": "...",
      "type": "NORMAL",
      "status": "IN_REVIEW",
      "approvals": [...],
      "createdAt": "2025-01-15T10:00:00Z"
    }
  }
}
```

### Create Change Request

**Endpoint:** `POST /api/v1/changes`

**Authentication:** Required

**Request:**
```json
{
  "title": "Upgrade server OS",
  "description": "Upgrade production server to latest OS version",
  "type": "NORMAL",
  "priority": "HIGH",
  "riskLevel": "MEDIUM",
  "plannedStartDate": "2025-02-01T00:00:00Z",
  "plannedEndDate": "2025-02-01T04:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "change": { ... }
  }
}
```

### Approve/Reject Change

**Endpoint:** `POST /api/v1/changes/:id/approve`

**Authentication:** Required (Approver)

**Request:**
```json
{
  "status": "APPROVED",
  "comments": "Approved for implementation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "approval": { ... }
  }
}
```

---

## AI Chat Widget Endpoints

### Send Message

**Endpoint:** `POST /api/v1/ai/chat`

**Authentication:** Not required (public widget)

**Request:**
```json
{
  "message": "My printer is not working",
  "conversationId": "conv_123" // Optional, for continuing conversation
}
```

**Response:** (Streaming via WebSocket or SSE)
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_123",
    "message": "I can help you with printer issues. Let me search our knowledge base...",
    "toolCalls": [
      {
        "tool": "search_knowledge_base",
        "query": "printer not working"
      }
    ],
    "response": "Based on our knowledge base, try these steps: 1. Check if printer is powered on..."
  }
}
```

### Create Ticket from Chat

**Endpoint:** `POST /api/v1/ai/chat/create-ticket`

**Authentication:** Not required (public widget)

**Request:**
```json
{
  "conversationId": "conv_123",
  "subject": "Printer not working",
  "description": "User reported printer issue after trying KB solutions",
  "priority": "MEDIUM",
  "requesterEmail": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "ticket_123",
      "ticketNumber": "TKT-2025-0001"
    }
  }
}
```

---

## Analytics Endpoints

### Get Dashboard Metrics

**Endpoint:** `GET /api/v1/analytics/dashboard`

**Authentication:** Required (Agent or higher)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalTickets": 150,
      "openTickets": 25,
      "resolvedTickets": 120,
      "averageResolutionTime": 1440, // minutes
      "slaCompliance": 95.5, // percentage
      "ticketsByPriority": {
        "LOW": 50,
        "MEDIUM": 60,
        "HIGH": 30,
        "CRITICAL": 10
      },
      "ticketsByStatus": {
        "NEW": 10,
        "IN_PROGRESS": 15,
        "RESOLVED": 120,
        "CLOSED": 5
      }
    }
  }
}
```

### Get Agent Performance

**Endpoint:** `GET /api/v1/analytics/agents`

**Authentication:** Required (IT Manager or Admin)

**Query Parameters:**
- `startDate`, `endDate`
- `agentId` - Filter by specific agent

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "user_123",
        "name": "Jane Smith",
        "ticketsResolved": 45,
        "averageResolutionTime": 1200,
        "slaCompliance": 98.5
      }
    ]
  }
}
```

### Export Report

**Endpoint:** `GET /api/v1/analytics/export`

**Authentication:** Required (Agent or higher)

**Query Parameters:**
- `type` - Report type (tickets, agents, sla, etc.)
- `format` - Export format (csv, pdf)
- `startDate`, `endDate`
- Other filters

**Response:** File download (CSV or PDF)

---

## Configuration Endpoints

### Get System Settings

**Endpoint:** `GET /api/v1/config/settings`

**Authentication:** Required (Admin)

**Query Parameters:**
- `category` - Filter by category (AUTH, EMAIL, FILE, BRANDING, GENERAL)

**Response:**
```json
{
  "success": true,
  "data": {
    "settings": [
      {
        "key": "auth.registration_enabled",
        "value": "true",
        "type": "BOOLEAN",
        "category": "AUTH"
      }
    ]
  }
}
```
### Update System Setting

**Endpoint:** `PATCH /api/v1/config/settings/:key`

**Authentication:** Required (Admin)

**Request:**
```json
{
  "value": "false"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "setting": { ... }
  }
}
```

### Get Email Configurations

**Endpoint:** `GET /api/v1/config/email`

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "configurations": [
      {
        "id": "email_123",
        "name": "Primary Email",
        "type": "IMAP",
        "active": true
      }
    ]
  }
}
```

### Create/Update Email Configuration

**Endpoint:** `POST /api/v1/config/email` or `PATCH /api/v1/config/email/:id`

**Authentication:** Required (Admin)

**Request:**
```json
{
  "name": "Primary Email",
  "type": "IMAP",
  "imapHost": "imap.example.com",
  "imapPort": 993,
  "imapUser": "support@example.com",
  "imapPassword": "password",
  "imapEncryption": "SSL",
  "pollInterval": 5,
  "ticketQueueId": "queue_123",
  "autoAssign": true,
  "defaultPriority": "MEDIUM"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "configuration": { ... }
  }
}
```

---

## WebSocket Events

### Connection

**URL:** `ws://localhost:3000/ws` (or `wss://` for production)

**Authentication:** JWT token in query parameter or Authorization header

### Events

**Client → Server:**

- `subscribe:ticket` - Subscribe to ticket updates
  ```json
  {
    "event": "subscribe:ticket",
    "data": {
      "ticketId": "ticket_123"
    }
  }
  ```

- `unsubscribe:ticket` - Unsubscribe from ticket updates

**Server → Client:**

- `ticket:created` - New ticket created
  ```json
  {
    "event": "ticket:created",
    "data": {
      "ticket": { ... }
    }
  }
  ```

- `ticket:updated` - Ticket updated
  ```json
  {
    "event": "ticket:updated",
    "data": {
      "ticket": { ... },
      "changes": { ... }
    }
  }
  ```

- `ticket:assigned` - Ticket assigned
  ```json
  {
    "event": "ticket:assigned",
    "data": {
      "ticketId": "ticket_123",
      "assignedTo": { ... }
    }
  }
  ```

- `comment:added` - New comment added
  ```json
  {
    "event": "comment:added",
    "data": {
      "ticketId": "ticket_123",
      "comment": { ... }
    }
  }
  ```

- `notification:new` - New notification
  ```json
  {
    "event": "notification:new",
    "data": {
      "notification": { ... }
    }
  }
  ```

- `ai:response` - AI chat response (streaming)
  ```json
  {
    "event": "ai:response",
    "data": {
      "conversationId": "conv_123",
      "chunk": "Response text chunk",
      "done": false
    }
  }
  ```

---

## Error Handling

### Error Codes

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "email",
      "message": "Email is required"
    }
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

This API specification provides a complete reference for all endpoints in the ITSM system.

