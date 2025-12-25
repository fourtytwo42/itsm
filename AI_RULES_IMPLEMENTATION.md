# AI Rules Implementation - Tenant-Specific AI Behavior Customization

This document describes the implementation of a Cursor Rules-like system for customizing AI assistant behavior per tenant or organization.

## Overview

Similar to how Cursor uses `.cursor/rules/` files to guide AI behavior, this system allows org admins and IT managers to create custom rules that modify how the AI assistant responds to users within their tenant or organization.

## Database Schema

### AIRule Model

- **id**: UUID primary key
- **tenantId**: Optional foreign key to Tenant (mutually exclusive with organizationId)
- **organizationId**: Optional foreign key to Organization (mutually exclusive with tenantId)
- **name**: Rule identifier (e.g., "system-behavior", "ticket-creation")
- **description**: Optional description
- **content**: Markdown/text content with instructions (similar to Cursor rule files)
- **priority**: Integer (higher priority rules are applied first)
- **isActive**: Boolean flag to enable/disable rules
- **createdById/updatedById**: User tracking
- **createdAt/updatedAt**: Timestamps

## Architecture

### Service Layer (`lib/services/ai-rule-service.ts`)

- `createAIRule()` - Create new rule
- `updateAIRule()` - Update existing rule
- `getAIRuleById()` - Get single rule
- `listAIRulesForTenant()` - Get all rules for a tenant
- `listAIRulesForOrganization()` - Get all rules for an organization
- `getActiveAIRulesForTenant()` - Get active rules for tenant (including org-level)
- `deleteAIRule()` - Soft delete (sets isActive=false)
- `hardDeleteAIRule()` - Permanent delete

### API Endpoints

**Tenant-level rules:**
- `GET /api/v1/admin/tenants/[id]/ai-rules` - List all rules for a tenant
- `POST /api/v1/admin/tenants/[id]/ai-rules` - Create new rule
- `GET /api/v1/admin/tenants/[id]/ai-rules/[ruleId]` - Get specific rule
- `PUT /api/v1/admin/tenants/[id]/ai-rules/[ruleId]` - Update rule
- `DELETE /api/v1/admin/tenants/[id]/ai-rules/[ruleId]` - Delete rule

**Access Control:**
- Requires ADMIN or IT_MANAGER role
- IT_MANAGER can only access tenants in their organization
- ADMIN (global) can access any tenant

### AI Service Integration

The `chatWithTools()` function in `lib/services/ai-service.ts` has been updated to:

1. Check if `tenantId` is provided
2. Fetch active AI rules for that tenant (including organization-level rules)
3. Merge rule content with the default `SYSTEM_MESSAGE`
4. Apply the merged system message to the AI conversation

**Rule Application:**
- Rules are ordered by priority (higher priority first)
- Tenant-specific rules override organization-level rules of the same priority
- Rules are appended to the base system message with a clear separator
- If rule fetching fails, the system falls back to default behavior

## Usage Example

### Creating a Rule

```json
POST /api/v1/admin/tenants/{tenantId}/ai-rules
{
  "name": "ticket-priority-guidelines",
  "description": "Custom priority assignment rules for this tenant",
  "content": "When creating tickets, always use MEDIUM priority unless the user explicitly states the issue is blocking their work.",
  "priority": 10,
  "isActive": true
}
```

### How Rules Are Applied

When a user chats with the AI:

1. Base system message is loaded (default AI behavior)
2. Active rules for the tenant are fetched
3. Rules are sorted by priority (descending)
4. Rule content is appended to system message:

```
[Base System Message]

---

## TENANT-SPECIFIC RULES

The following rules apply to this tenant and take precedence over the default instructions:

[Rule 1 content (highest priority)]

[Rule 2 content]

[Rule 3 content]
```

## Migration

To apply the database changes:

```bash
npm run db:migrate -- --name add_ai_rules
```

Or for development (if migration has issues):

```bash
npx prisma db push
npx prisma generate
```

## Future Enhancements

- Organization-level rules (currently tenant-focused)
- Rule templates/pre-sets
- Rule validation/testing interface
- Rule versioning/history
- UI for managing rules (admin dashboard)
- Rule syntax validation
- Support for rule variables/placeholders

