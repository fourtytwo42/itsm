# E2E Test Plan

This document outlines the comprehensive E2E test coverage plan for the ITSM Helpdesk System.

## Current Coverage

**Existing Tests (11 tests in 2 files):**
- ✅ Login Flow (6 tests)
- ✅ AI Chat Widget (5 tests)

## Proposed E2E Test Coverage

### 1. Authentication & User Management

#### 1.1 Authentication Flows
- [ ] **Login Flow** (already partially covered)
  - ✅ Display login page
  - ✅ Show error for invalid credentials
  - ✅ Navigate to register page
  - ✅ Navigate to reset password page
  - ✅ Auto-fill demo account credentials
  - ✅ Show all demo account buttons
  - [ ] **NEW**: Successful login with valid credentials
  - [ ] **NEW**: Remember me functionality
  - [ ] **NEW**: Logout functionality

#### 1.2 Registration Flow
- [ ] Display registration page
- [ ] Register new user successfully
- [ ] Show validation errors (invalid email, weak password, etc.)
- [ ] Handle duplicate email registration
- [ ] Auto-login after successful registration

#### 1.3 Password Reset Flow
- [ ] Display reset password page
- [ ] Request password reset (enter email)
- [ ] Show success message
- [ ] Handle invalid email
- [ ] Complete password reset with token

#### 1.4 Admin User Management
- [ ] **Admin Dashboard - Users**
  - [ ] List all users
  - [ ] Search/filter users
  - [ ] Create new user
  - [ ] View user details
  - [ ] Update user (email, roles, status)
  - [ ] Deactivate/activate user
  - [ ] Delete user (soft delete)
  - [ ] Assign user to tenant
  - [ ] Remove user from tenant

### 2. Ticket Management

#### 2.1 End User Ticket Flows
- [ ] **Create Ticket**
  - [ ] Display create ticket form
  - [ ] Create ticket with required fields
  - [ ] Create ticket with optional fields (priority, category, attachments)
  - [ ] Show validation errors
  - [ ] Create ticket via public form (unauthenticated)
  - [ ] Create ticket via public token

- [ ] **View Tickets**
  - [ ] List user's tickets
  - [ ] Filter tickets by status/priority
  - [ ] Search tickets
  - [ ] View ticket details
  - [ ] View ticket comments/history

- [ ] **Update Ticket (Requester)**
  - [ ] Add comment to ticket
  - [ ] Close own ticket (if allowed)
  - [ ] Reopen closed ticket (if allowed)

#### 2.2 Agent Ticket Flows
- [ ] **Ticket Assignment**
  - [ ] View assigned tickets
  - [ ] Assign ticket to self
  - [ ] Assign ticket to another agent
  - [ ] Unassign ticket
  - [ ] View unassigned tickets queue

- [ ] **Ticket Management**
  - [ ] Update ticket status (New → In Progress → Resolved → Closed)
  - [ ] Change ticket priority
  - [ ] Add internal notes
  - [ ] Add public comments
  - [ ] Upload attachments
  - [ ] Link assets to ticket
  - [ ] Escalate ticket

#### 2.3 IT Manager Ticket Flows
- [ ] View all organization tickets
- [ ] Filter tickets by agent/tenant/status
- [ ] Bulk assign tickets
- [ ] View ticket analytics/metrics
- [ ] Export tickets to CSV

#### 2.4 Ticket Auto-Routing
- [ ] Create ticket with category (should auto-assign)
- [ ] Verify auto-assignment based on category
- [ ] Verify auto-assignment based on tenant assignments

### 3. Tenant Management

#### 3.1 Admin Tenant Management
- [ ] **List Tenants**
  - [ ] View all tenants
  - [ ] Search/filter tenants
  - [ ] View tenant details

- [ ] **Create Tenant**
  - [ ] Display create tenant form
  - [ ] Create tenant with required fields
  - [ ] Create tenant with optional fields
  - [ ] Handle duplicate slug validation
  - [ ] Handle invalid slug format

- [ ] **Update Tenant**
  - [ ] Update tenant details
  - [ ] Update tenant logo
  - [ ] Change tenant owner
  - [ ] Update tenant categories

- [ ] **Delete Tenant**
  - [ ] Soft delete tenant
  - [ ] Handle tenant with active tickets

- [ ] **Tenant Configuration**
  - [ ] Manage tenant categories
  - [ ] Manage KB article associations
  - [ ] Manage custom fields
  - [ ] Assign agents to tenant
  - [ ] Remove agents from tenant

### 4. Asset Management

#### 4.1 Asset CRUD Operations
- [ ] **List Assets**
  - [ ] View all assets
  - [ ] Filter assets by type/status/assigned user
  - [ ] Search assets
  - [ ] View asset details

- [ ] **Create Asset**
  - [ ] Display create asset form
  - [ ] Create asset with required fields
  - [ ] Create asset with custom fields
  - [ ] Assign asset to user
  - [ ] Handle asset number generation

- [ ] **Update Asset**
  - [ ] Update asset details
  - [ ] Change asset status
  - [ ] Reassign asset to different user
  - [ ] Unassign asset
  - [ ] Update custom fields

- [ ] **Delete Asset**
  - [ ] Soft delete asset
  - [ ] Handle asset linked to tickets

#### 4.2 Asset Relationships
- [ ] Create asset relationship (parent/child)
- [ ] View asset relationships
- [ ] Delete asset relationship

#### 4.3 Asset Import/Export
- [ ] Import assets from CSV
- [ ] Handle CSV import errors
- [ ] Export assets to CSV
- [ ] Handle empty export

### 5. Knowledge Base Management

#### 5.1 KB Article CRUD
- [ ] **List Articles**
  - [ ] View all published articles
  - [ ] Filter articles by status/tags
  - [ ] Search articles
  - [ ] View article details

- [ ] **Create Article**
  - [ ] Display create article form
  - [ ] Create article (draft)
  - [ ] Create article (published)
  - [ ] Associate article with tenants
  - [ ] Add tags to article

- [ ] **Update Article**
  - [ ] Update article content
  - [ ] Change article status (draft → published)
  - [ ] Update tenant associations
  - [ ] Update tags

- [ ] **Delete Article**
  - [ ] Delete article

#### 5.2 KB Article Viewing (Public)
- [ ] View article via tenant slug
- [ ] Search articles from tenant page
- [ ] View article without authentication

### 6. Dashboard & Analytics

#### 6.1 Dashboard Views (by Role)
- [ ] **End User Dashboard**
  - [ ] View own tickets summary
  - [ ] View recent tickets
  - [ ] View notifications

- [ ] **Agent Dashboard**
  - [ ] View assigned tickets
  - [ ] View ticket queue
  - [ ] View personal metrics

- [ ] **IT Manager Dashboard**
  - [ ] View organization metrics
  - [ ] View agent performance
  - [ ] View ticket volume charts
  - [ ] View MTTR metrics

- [ ] **Admin Dashboard**
  - [ ] View global metrics
  - [ ] View all organization data
  - [ ] View system-wide analytics

#### 6.2 Analytics & Reports
- [ ] Filter analytics by date range
- [ ] Filter analytics by priority/status
- [ ] Export analytics to CSV
- [ ] View agent performance reports
- [ ] View ticket volume by day

### 7. Notifications

#### 7.1 Notification Center
- [ ] View notification list
- [ ] Mark notification as read
- [ ] Mark all notifications as read
- [ ] Filter unread notifications
- [ ] View notification details

#### 7.2 Notification Triggers
- [ ] Receive notification on ticket assignment
- [ ] Receive notification on ticket comment
- [ ] Receive notification on ticket status change
- [ ] Receive notification on ticket escalation

#### 7.3 Notification Preferences
- [ ] View notification preferences
- [ ] Update notification preferences
- [ ] Enable/disable specific notification types

### 8. Multi-Role Testing

#### 8.1 Role-Based Access Control
- [ ] **End User Role**
  - [ ] Cannot access admin features
  - [ ] Cannot view other users' tickets
  - [ ] Cannot manage tenants/assets

- [ ] **Agent Role**
  - [ ] Can access agent dashboard
  - [ ] Can manage assigned tickets
  - [ ] Cannot access admin features
  - [ ] Cannot manage users/tenants

- [ ] **IT Manager Role**
  - [ ] Can access organization management
  - [ ] Can view organization tickets
  - [ ] Can manage agents in organization
  - [ ] Cannot access global admin features

- [ ] **Admin Role**
  - [ ] Can access all features
  - [ ] Can manage users/tenants/organizations
  - [ ] Can view all data

#### 8.2 Cross-Role Interactions
- [ ] End user creates ticket → Agent assigns to self → Agent updates → End user sees update
- [ ] Agent escalates ticket → IT Manager receives notification → IT Manager assigns to agent
- [ ] Admin creates tenant → Assigns agent → Agent can see tenant tickets

### 9. Error Handling & Edge Cases

#### 9.1 Error Scenarios
- [ ] Handle 404 errors gracefully
- [ ] Handle 500 errors gracefully
- [ ] Handle network timeouts
- [ ] Handle invalid form submissions
- [ ] Handle expired sessions
- [ ] Handle unauthorized access attempts

#### 9.2 Edge Cases
- [ ] Create ticket with very long subject/description
- [ ] Upload large file attachments
- [ ] Handle concurrent ticket updates
- [ ] Handle bulk operations on many items
- [ ] Handle empty states (no tickets, no users, etc.)

### 10. Integration Flows

#### 10.1 Complete User Journeys
- [ ] **New User Onboarding**
  - [ ] Register → Verify email → Login → Create first ticket → Receive response

- [ ] **Ticket Lifecycle**
  - [ ] End user creates ticket → Auto-assigned to agent → Agent responds → End user adds comment → Agent resolves → End user closes

- [ ] **Agent Workflow**
  - [ ] Login → View queue → Assign ticket → Update status → Add comment → Link asset → Resolve ticket

- [ ] **Admin Setup Flow**
  - [ ] Login as admin → Create organization → Create tenant → Assign agent → Create KB article → Create ticket type

## Test File Organization

```
__tests__/e2e/
├── auth/
│   ├── login.spec.ts ✅ (existing)
│   ├── register.spec.ts
│   └── password-reset.spec.ts
├── tickets/
│   ├── ticket-create.spec.ts
│   ├── ticket-management.spec.ts
│   └── ticket-assignment.spec.ts
├── users/
│   └── user-management.spec.ts
├── tenants/
│   └── tenant-management.spec.ts
├── assets/
│   └── asset-management.spec.ts
├── kb/
│   └── kb-articles.spec.ts
├── dashboard/
│   └── dashboard.spec.ts
├── notifications/
│   └── notifications.spec.ts
├── roles/
│   └── role-based-access.spec.ts
└── integration/
    └── user-journeys.spec.ts
```

## Test Utilities & Helpers

### Authentication Helpers
- `loginAs(role)` - Login as specific role (admin, agent, manager, enduser)
- `loginAsUser(email, password)` - Login with specific credentials
- `logout()` - Logout current user

### Test Data Helpers
- `createTestTicket(data)` - Create test ticket via API
- `createTestUser(data)` - Create test user via API
- `createTestTenant(data)` - Create test tenant via API
- `cleanupTestData()` - Clean up test data after tests

### Page Object Models
- `LoginPage` - Login page interactions
- `DashboardPage` - Dashboard interactions
- `TicketPage` - Ticket list/detail interactions
- `UserManagementPage` - User management interactions

## Priority Levels

### P0 - Critical (Must Have)
- Authentication flows (login, logout)
- Ticket creation and viewing
- Basic ticket management (assign, update, close)
- Role-based access control

### P1 - High Priority (Should Have)
- Complete ticket lifecycle
- User management (admin)
- Tenant management (admin)
- Asset management
- KB article management
- Dashboard views

### P2 - Medium Priority (Nice to Have)
- Advanced ticket features (escalation, bulk operations)
- Analytics and reports
- Notification center
- Import/export features
- Complete integration flows

### P3 - Low Priority (Future)
- Edge cases and error scenarios
- Performance testing scenarios
- Cross-browser testing (currently only Chrome)

## Implementation Strategy

1. **Phase 1: Core Flows (P0)**
   - Complete authentication flows
   - Basic ticket management
   - Role-based access testing

2. **Phase 2: Admin Features (P1)**
   - User management
   - Tenant management
   - Asset management
   - KB management

3. **Phase 3: User Features (P1)**
   - Complete ticket lifecycle
   - Dashboard views
   - Notifications

4. **Phase 4: Advanced Features (P2)**
   - Analytics
   - Bulk operations
   - Import/export

5. **Phase 5: Integration & Edge Cases (P2-P3)**
   - Complete user journeys
   - Error handling
   - Edge cases

## Metrics & Goals

- **Target Coverage**: 80+ critical user flows
- **Test Execution Time**: < 15 minutes for full suite
- **Reliability**: > 95% pass rate (accounting for flakiness)
- **Maintenance**: Tests should be maintainable and well-documented

## Notes

- All E2E tests should use test data that can be cleaned up
- Tests should be independent and not rely on execution order
- Use proper waits instead of fixed timeouts where possible
- Mock external APIs (like AI chat) where appropriate
- Consider using Playwright's codegen for rapid test creation

