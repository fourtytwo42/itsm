# Database Schema

**Complete database schema, relationships, indexes, and migrations for the ITSM Helpdesk System.**

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [User & Authentication Tables](#user--authentication-tables)
3. [Ticket Tables](#ticket-tables)
4. [Knowledge Base Tables](#knowledge-base-tables)
5. [Asset Management (CMDB) Tables](#asset-management-cmdb-tables)
6. [Change Management Tables](#change-management-tables)
7. [SLA & Escalation Tables](#sla--escalation-tables)
8. [Email Configuration Tables](#email-configuration-tables)
9. [System Configuration Tables](#system-configuration-tables)
10. [Analytics & Audit Tables](#analytics--audit-tables)
11. [Indexes Strategy](#indexes-strategy)
12. [Migrations](#migrations)

---

## Schema Overview

### Design Principles

1. **Single-Tenant:** One organization per database instance
2. **Audit Trail:** All critical tables include `created_at`, `updated_at`, `created_by`, `updated_by`
3. **Soft Deletes:** Important records use `deleted_at` for soft deletes
4. **Data Integrity:** Foreign keys, constraints, validation
5. **Performance:** Comprehensive indexes on frequently queried fields
6. **Vector Search:** pgvector extension for KB semantic search

### Database Technology

- **Database:** PostgreSQL 16.0
- **ORM:** Prisma 7.0.0
- **Migrations:** Prisma Migrate
- **Seeding:** Prisma seed script
- **Vector Extension:** pgvector (for KB semantic search)

---

## User & Authentication Tables

### Users Table

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  firstName     String?
  lastName      String?
  phone         String?
  avatar        String?   // URL to avatar image
  emailVerified Boolean   @default(false)
  emailVerificationToken String? @unique
  passwordResetToken String? @unique
  passwordResetExpires DateTime?
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete
  
  // Relations
  roles         UserRole[]
  createdTickets Ticket[] @relation("TicketCreator")
  assignedTickets Ticket[] @relation("TicketAssignee")
  ticketComments TicketComment[]
  ticketHistory TicketHistory[]
  changeRequests ChangeRequest[] @relation("ChangeCreator")
  changeApprovals ChangeApproval[]
  assignedAssets Asset[]
  notifications Notification[]
  auditLogs     AuditLog[] @relation("UserAuditLogs")
  
  @@index([email])
  @@index([createdAt])
  @@index([deletedAt])
}
```

### Roles Table

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique // "ADMIN", "IT_MANAGER", "AGENT", "END_USER", "REQUESTER"
  description String?
  permissions String[] // Array of permission strings
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       UserRole[]
  
  @@index([name])
}
```

### UserRole Junction Table

```prisma
model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
}
```

---

## Ticket Tables

### Tickets Table

```prisma
model Ticket {
  id            String    @id @default(cuid())
  ticketNumber  String    @unique // Auto-generated: TKT-2025-0001
  subject       String
  description   String    @db.Text
  status        String    @default("NEW") // "NEW", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"
  priority      String    @default("MEDIUM") // "LOW", "MEDIUM", "HIGH", "CRITICAL"
  source        String    // "EMAIL", "FORM", "API", "AI_CHAT", "PHONE"
  category      String?   // Custom category
  subcategory   String?   // Custom subcategory
  
  // Assignment
  assignedToId String?
  assignedAt    DateTime?
  assignedBy    String?
  
  // Requester (can be unauthenticated)
  requesterEmail String
  requesterName  String?
  requesterId    String? // If authenticated user
  
  // SLA Tracking
  slaPolicyId   String?
  firstResponseAt DateTime?
  firstResponseSla DateTime? // Target time for first response
  resolutionSla  DateTime? // Target time for resolution
  resolvedAt     DateTime?
  closedAt       DateTime?
  
  // Email Integration
  emailMessageId String? // For email tickets
  replyToEmail   String? // Unique reply-to address
  
  // Custom Fields (JSON)
  customFields   Json? // { field1: "value1", field2: "value2" }
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete
  createdById   String?
  
  // Relations
  creator       User?     @relation("TicketCreator", fields: [createdById], references: [id])
  assignee      User?     @relation("TicketAssignee", fields: [assignedToId], references: [id])
  slaPolicy     SLAPolicy? @relation(fields: [slaPolicyId], references: [id])
  comments      TicketComment[]
  attachments   TicketAttachment[]
  history       TicketHistory[]
  linkedTickets TicketLink[] @relation("SourceTicket")
  linkedFromTickets TicketLink[] @relation("TargetTicket")
  assetRelations TicketAssetRelation[]
  changeRequests ChangeRequest[]
  
  @@index([ticketNumber])
  @@index([status])
  @@index([priority])
  @@index([assignedToId])
  @@index([requesterEmail])
  @@index([requesterId])
  @@index([createdAt])
  @@index([slaPolicyId])
  @@index([deletedAt])
}
```

### Ticket Comments Table

```prisma
model TicketComment {
  id            String    @id @default(cuid())
  ticketId      String
  userId        String?   // Null for public comments
  comment       String    @db.Text
  isInternal    Boolean   @default(false) // Internal note vs public comment
  isFromEmail   Boolean   @default(false) // Comment from email reply
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete
  
  // Relations
  ticket        Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  user          User?     @relation(fields: [userId], references: [id])
  attachments   TicketAttachment[]
  
  @@index([ticketId])
  @@index([userId])
  @@index([createdAt])
  @@index([deletedAt])
}
```

### Ticket Attachments Table

```prisma
model TicketAttachment {
  id            String    @id @default(cuid())
  ticketId      String?
  commentId     String?
  fileName      String
  filePath      String    // Path on filesystem
  fileSize      Int       // Bytes
  mimeType      String
  uploadedById  String?
  
  createdAt     DateTime  @default(now())
  
  // Relations
  ticket        Ticket?   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  comment       TicketComment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
  
  @@index([ticketId])
  @@index([commentId])
  @@index([createdAt])
}
```

### Ticket History Table

```prisma
model TicketHistory {
  id            String    @id @default(cuid())
  ticketId      String
  userId        String?
  action        String    // "CREATED", "UPDATED", "ASSIGNED", "STATUS_CHANGED", "PRIORITY_CHANGED", "COMMENT_ADDED"
  field         String?   // Field that changed
  oldValue      String?   // Old value (JSON string if complex)
  newValue      String?   // New value (JSON string if complex)
  description   String?   // Human-readable description
  
  createdAt     DateTime  @default(now())
  
  // Relations
  ticket        Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  user          User?     @relation(fields: [userId], references: [id])
  
  @@index([ticketId])
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

### Ticket Links Table

```prisma
model TicketLink {
  id            String    @id @default(cuid())
  sourceTicketId String
  targetTicketId String
  linkType      String    // "RELATED", "DUPLICATE", "BLOCKS", "BLOCKED_BY"
  
  createdAt     DateTime  @default(now())
  createdById   String?
  
  // Relations
  sourceTicket  Ticket    @relation("SourceTicket", fields: [sourceTicketId], references: [id], onDelete: Cascade)
  targetTicket  Ticket    @relation("TargetTicket", fields: [targetTicketId], references: [id], onDelete: Cascade)
  
  @@unique([sourceTicketId, targetTicketId, linkType])
  @@index([sourceTicketId])
  @@index([targetTicketId])
}
```

---

## Knowledge Base Tables

### Knowledge Base Articles Table

```prisma
model KnowledgeBaseArticle {
  id            String    @id @default(cuid())
  title         String
  content       String    @db.Text
  summary       String?   @db.Text
  categoryId    String?
  tags          String[]   // Array of tag strings
  status        String    @default("DRAFT") // "DRAFT", "PUBLISHED", "ARCHIVED"
  viewCount     Int       @default(0)
  helpfulCount  Int       @default(0)
  notHelpfulCount Int     @default(0)
  
  // Auto-creation from ticket
  createdFromTicketId String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete
  createdById   String?
  publishedAt   DateTime?
  
  // Relations
  category      KnowledgeBaseCategory? @relation(fields: [categoryId], references: [id])
  createdFromTicket Ticket? @relation(fields: [createdFromTicketId], references: [id])
  attachments   KBArticleAttachment[]
  embeddings    KBArticleEmbedding[]
  
  @@index([status])
  @@index([categoryId])
  @@index([createdAt])
  @@index([publishedAt])
  @@index([deletedAt])
  @@index([tags]) // GIN index for array search
}
```

### Knowledge Base Categories Table

```prisma
model KnowledgeBaseCategory {
  id            String    @id @default(cuid())
  name          String
  description   String?   @db.Text
  parentId      String?   // For nested categories
  order         Int       @default(0)
  active        Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  parent        KnowledgeBaseCategory? @relation("CategoryParent", fields: [parentId], references: [id])
  children      KnowledgeBaseCategory[] @relation("CategoryParent")
  articles      KnowledgeBaseArticle[]
  
  @@index([parentId])
  @@index([active])
  @@index([order])
}
```

### KB Article Embeddings Table (for Semantic Search)

```prisma
model KBArticleEmbedding {
  id            String    @id @default(cuid())
  articleId     String
  embedding     Unsupported("vector(1536)") // pgvector - 1536 dimensions for OpenAI embeddings
  chunkIndex    Int       @default(0) // For chunked articles
  chunkText     String    @db.Text // Text that was embedded
  
  createdAt     DateTime  @default(now())
  
  // Relations
  article       KnowledgeBaseArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)
  
  @@index([articleId])
  @@index([chunkIndex])
}
```

### KB Article Attachments Table

```prisma
model KBArticleAttachment {
  id            String    @id @default(cuid())
  articleId     String
  fileName      String
  filePath      String
  fileSize      Int
  mimeType      String
  
  createdAt     DateTime  @default(now())
  
  // Relations
  article       KnowledgeBaseArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)
  
  @@index([articleId])
}
```

---

## Asset Management (CMDB) Tables

### Assets Table

```prisma
model Asset {
  id            String    @id @default(cuid())
  assetNumber   String    @unique // Auto-generated: AST-2025-0001
  name          String
  type          String    // "HARDWARE", "SOFTWARE", "NETWORK_DEVICE", "CLOUD_RESOURCE"
  category      String?   // "LAPTOP", "SERVER", "MONITOR", "LICENSE", etc.
  manufacturer  String?
  model         String?
  serialNumber  String?
  status        String    @default("ACTIVE") // "ACTIVE", "INACTIVE", "RETIRED", "MAINTENANCE"
  
  // Assignment
  assignedToId  String?
  assignedAt    DateTime?
  
  // Location
  location      String?
  building      String?
  floor         String?
  room          String?
  
  // Purchase Info
  purchaseDate  DateTime?
  purchasePrice Decimal?   @db.Decimal(10, 2)
  warrantyExpiry DateTime?
  
  // Custom Fields (JSON)
  customFields  Json?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete
  createdById   String?
  
  // Relations
  assignedTo    User?     @relation(fields: [assignedToId], references: [id])
  relationships AssetRelationship[] @relation("SourceAsset")
  relatedAssets AssetRelationship[] @relation("TargetAsset")
  ticketRelations TicketAssetRelation[]
  
  @@index([assetNumber])
  @@index([type])
  @@index([status])
  @@index([assignedToId])
  @@index([createdAt])
  @@index([deletedAt])
}
```

### Asset Relationships Table

```prisma
model AssetRelationship {
  id            String    @id @default(cuid())
  sourceAssetId String
  targetAssetId String
  relationshipType String  // "CONTAINS", "DEPENDS_ON", "CONNECTED_TO", "LICENSED_FOR"
  description   String?   @db.Text
  
  createdAt     DateTime  @default(now())
  createdById   String?
  
  // Relations
  sourceAsset   Asset     @relation("SourceAsset", fields: [sourceAssetId], references: [id], onDelete: Cascade)
  targetAsset   Asset     @relation("TargetAsset", fields: [targetAssetId], references: [id], onDelete: Cascade)
  
  @@unique([sourceAssetId, targetAssetId, relationshipType])
  @@index([sourceAssetId])
  @@index([targetAssetId])
}
```

### Ticket Asset Relations Table

```prisma
model TicketAssetRelation {
  id            String    @id @default(cuid())
  ticketId      String
  assetId       String
  relationType  String    @default("AFFECTED_BY") // "AFFECTED_BY", "CAUSED_BY", "RELATED_TO"
  
  createdAt     DateTime  @default(now())
  createdById   String?
  
  // Relations
  ticket        Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  asset         Asset     @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  @@unique([ticketId, assetId, relationType])
  @@index([ticketId])
  @@index([assetId])
}
```

---

## Change Management Tables

### Change Requests Table

```prisma
model ChangeRequest {
  id            String    @id @default(cuid())
  changeNumber  String    @unique // Auto-generated: CHG-2025-0001
  title         String
  description   String    @db.Text
  type          String    // "STANDARD", "NORMAL", "EMERGENCY"
  status        String    @default("DRAFT") // "DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "IMPLEMENTED", "CLOSED"
  priority      String    @default("MEDIUM") // "LOW", "MEDIUM", "HIGH", "CRITICAL"
  riskLevel     String?   // "LOW", "MEDIUM", "HIGH", "CRITICAL"
  
  // Request Info
  requestedById String
  requestedAt   DateTime  @default(now())
  
  // Implementation
  plannedStartDate DateTime?
  plannedEndDate   DateTime?
  actualStartDate  DateTime?
  actualEndDate    DateTime?
  implementationNotes String? @db.Text
  
  // Related Ticket
  relatedTicketId String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete
  
  // Relations
  requester     User      @relation("ChangeCreator", fields: [requestedById], references: [id])
  relatedTicket Ticket?   @relation(fields: [relatedTicketId], references: [id])
  approvals     ChangeApproval[]
  attachments   ChangeAttachment[]
  
  @@index([changeNumber])
  @@index([status])
  @@index([type])
  @@index([requestedById])
  @@index([createdAt])
  @@index([deletedAt])
}
```

### Change Approvals Table

```prisma
model ChangeApproval {
  id            String    @id @default(cuid())
  changeRequestId String
  approverId    String
  stage         Int       // Approval stage (1, 2, 3, etc.)
  status        String    @default("PENDING") // "PENDING", "APPROVED", "REJECTED"
  comments      String?    @db.Text
  approvedAt    DateTime?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  changeRequest ChangeRequest @relation(fields: [changeRequestId], references: [id], onDelete: Cascade)
  approver      User      @relation(fields: [approverId], references: [id])
  
  @@unique([changeRequestId, approverId, stage])
  @@index([changeRequestId])
  @@index([approverId])
  @@index([status])
}
```

### Change Attachments Table

```prisma
model ChangeAttachment {
  id            String    @id @default(cuid())
  changeRequestId String
  fileName      String
  filePath      String
  fileSize      Int
  mimeType      String
  
  createdAt     DateTime  @default(now())
  
  // Relations
  changeRequest ChangeRequest @relation(fields: [changeRequestId], references: [id], onDelete: Cascade)
  
  @@index([changeRequestId])
}
```

---

## SLA & Escalation Tables

### SLA Policies Table

```prisma
model SLAPolicy {
  id            String    @id @default(cuid())
  name          String
  description   String?   @db.Text
  priority      String    // "LOW", "MEDIUM", "HIGH", "CRITICAL"
  firstResponseTime Int   // Minutes
  resolutionTime     Int   // Minutes
  businessHours      Json? // Business hours definition
  active        Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  tickets       Ticket[]
  tracking      SLATracking[]
  
  @@index([priority])
  @@index([active])
}
```

### SLA Tracking Table

```prisma
model SLATracking {
  id            String    @id @default(cuid())
  ticketId      String
  slaPolicyId   String
  firstResponseTarget DateTime?
  firstResponseActual DateTime?
  firstResponseBreached Boolean @default(false)
  resolutionTarget DateTime?
  resolutionActual DateTime?
  resolutionBreached Boolean @default(false)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  ticket        Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  slaPolicy     SLAPolicy @relation(fields: [slaPolicyId], references: [id])
  
  @@index([ticketId])
  @@index([slaPolicyId])
  @@index([firstResponseBreached])
  @@index([resolutionBreached])
}
```

---

## Email Configuration Tables

### Email Configurations Table

```prisma
model EmailConfiguration {
  id            String    @id @default(cuid())
  name          String    // Configuration name
  type          String    // "SMTP", "IMAP", "POP3", "WEBHOOK"
  
  // SMTP Settings
  smtpHost      String?
  smtpPort      Int?
  smtpUser      String?
  smtpPassword  String?   // Encrypted
  smtpEncryption String?  // "NONE", "SSL", "TLS"
  smtpFromEmail String?
  smtpFromName  String?
  
  // IMAP/POP3 Settings
  imapHost      String?
  imapPort      Int?
  imapUser      String?
  imapPassword  String?   // Encrypted
  imapEncryption String?  // "NONE", "SSL", "TLS"
  pollInterval  Int?      // Minutes
  
  // Webhook Settings
  webhookUrl    String?
  webhookSecret String?   // Encrypted
  
  // Ticket Creation Settings
  ticketQueueId String?   // Default queue for email tickets
  autoAssign    Boolean   @default(false)
  defaultPriority String? @default("MEDIUM")
  
  active        Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  createdById   String?
  
  @@index([active])
  @@index([type])
}
```

---

## System Configuration Tables

### System Settings Table

```prisma
model SystemSetting {
  id            String    @id @default(cuid())
  key           String    @unique
  value         String    @db.Text
  type          String    @default("STRING") // "STRING", "NUMBER", "BOOLEAN", "JSON"
  category      String?   // "AUTH", "EMAIL", "FILE", "BRANDING", "GENERAL"
  description   String?   @db.Text
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  updatedById   String?
  
  @@index([key])
  @@index([category])
}
```

**Example Settings:**
- `auth.registration_enabled` - Boolean
- `auth.password_reset_enabled` - Boolean
- `auth.email_verification_enabled` - Boolean
- `auth.sso_enabled` - Boolean
- `auth.ldap_enabled` - Boolean
- `file.max_upload_size` - Number (bytes, default 100MB)
- `branding.logo_url` - String
- `branding.primary_color` - String
- `branding.secondary_color` - String
- `sla.default_policy_id` - String

---

## Analytics & Audit Tables

### Notifications Table

```prisma
model Notification {
  id            String    @id @default(cuid())
  userId        String
  type          String    // "TICKET_CREATED", "TICKET_ASSIGNED", "TICKET_UPDATED", "COMMENT_ADDED", etc.
  title         String
  message       String    @db.Text
  link          String?   // URL to related resource
  read          Boolean   @default(false)
  readAt        DateTime?
  
  createdAt     DateTime  @default(now())
  
  // Relations
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([read])
  @@index([createdAt])
}
```

### Audit Logs Table

```prisma
model AuditLog {
  id            String    @id @default(cuid())
  userId        String?
  action        String    // "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", etc.
  entityType    String?   // "TICKET", "USER", "ASSET", etc.
  entityId      String?
  changes       Json?     // Before/after values
  ipAddress     String?
  userAgent     String?
  description   String?   @db.Text
  
  createdAt     DateTime  @default(now())
  
  // Relations
  user          User?     @relation("UserAuditLogs", fields: [userId], references: [id])
  
  @@index([userId])
  @@index([action])
  @@index([entityType])
  @@index([entityId])
  @@index([createdAt])
}
```

---

## Indexes Strategy

### Performance Indexes

**Tickets:**
- `ticketNumber` (unique) - Fast ticket lookup
- `status`, `priority` - Filtering
- `assignedToId` - Agent ticket lists
- `requesterEmail`, `requesterId` - User ticket lists
- `createdAt` - Sorting and date filtering
- `slaPolicyId` - SLA tracking

**Knowledge Base:**
- `status`, `categoryId` - Filtering
- `tags` (GIN index) - Tag search
- `publishedAt` - Sorting published articles

**Assets:**
- `assetNumber` (unique) - Fast asset lookup
- `type`, `status` - Filtering
- `assignedToId` - User asset lists

**Change Requests:**
- `changeNumber` (unique) - Fast change lookup
- `status`, `type` - Filtering
- `requestedById` - User change lists

**General:**
- All foreign keys indexed
- All `createdAt` fields indexed for sorting
- All `deletedAt` fields indexed for soft delete filtering

### Vector Indexes (pgvector)

**KB Article Embeddings:**
- HNSW index on `embedding` column for fast semantic search
- Index created via SQL migration (not Prisma)

```sql
CREATE INDEX kb_article_embedding_idx 
ON "KBArticleEmbedding" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## Migrations

### Initial Migration

1. Create all tables
2. Add foreign key constraints
3. Create indexes
4. Enable pgvector extension
5. Create vector index on KB embeddings

### Migration Commands

```bash
# Create migration
npx prisma migrate dev --name initial_schema

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### pgvector Setup

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Vector index will be created via migration
```

---

This schema provides a complete foundation for the ITSM system with all necessary tables, relationships, and indexes.

