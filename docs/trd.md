# TRD.md — RepairDesk

## 1. Document Information

| Field                       | Value                           |
| --------------------------- | ------------------------------- |
| Product                     | RepairDesk                      |
| Document                    | Technical Requirements Document |
| Version                     | 1.0                             |
| Backend                     | Supabase                        |
| Database                    | PostgreSQL via Supabase         |
| Frontend                    | React + TypeScript + Vite       |
| Styling                     | Tailwind CSS                    |
| UI Components               | shadcn/ui where appropriate     |
| Deployment                  | Vercel                          |
| Primary External Capability | WebMCP                          |
| Authentication              | Supabase Auth                   |

---

# 2. Technical Overview

RepairDesk is a role-based repair operations platform that manages:

- Company assets
- Repair tickets
- Technicians
- Employees
- Repair history
- Notifications
- Warranty information
- Operational settings
- WebMCP agent interactions

The application has three primary user experiences:

```text
Admin / Manager
Technician
Employee
```

All authenticated roles use the same application architecture and shared design system. Access to data and functionality is controlled through role-based authorization.

The system architecture is:

```text
                    ┌─────────────────────┐
                    │      User / Agent    │
                    └──────────┬──────────┘
                               │
                     ┌─────────▼─────────┐
                     │   RepairDesk Web  │
                     │ React + TypeScript│
                     └─────────┬─────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
        ┌───────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
        │ Supabase Auth│ │ Supabase │ │   WebMCP    │
        │              │ │ Database │ │   Tools     │
        └──────────────┘ └────┬─────┘ └──────┬──────┘
                              │              │
                              └──────┬───────┘
                                     │
                              ┌──────▼──────┐
                              │ PostgreSQL  │
                              │   + RLS     │
                              └─────────────┘
```

---

# 3. Technology Stack

## 3.1 Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui where useful
- Material Symbols / icon system used by the approved designs

The frontend is responsible for:

- Rendering role-specific interfaces
- Client-side navigation
- Form handling
- UI state
- Authentication state
- Calling Supabase services
- Displaying WebMCP-related activity
- Enforcing UX-level permissions

Client-side permission checks must never be considered the primary security mechanism.

---

## 3.2 Backend

Supabase is the primary backend platform.

Supabase provides:

- PostgreSQL database
- Authentication
- Row Level Security
- Database functions where required
- Realtime functionality where required
- Edge Functions where required
- Storage if attachments are implemented

Backend authorization must be enforced using Supabase/PostgreSQL security rules.

---

## 3.3 Database

PostgreSQL through Supabase.

The database must support:

- Multi-user access
- Role-based authorization
- Asset relationships
- Repair lifecycle
- Historical records
- Notifications
- Auditability
- WebMCP operation logging

---

## 3.4 Deployment

Frontend deployment:

```text
Vercel
```

Backend services:

```text
Supabase
```

Recommended production architecture:

```text
User
 ↓
Vercel
 ↓
React Application
 ↓
Supabase
 ├── Auth
 ├── PostgreSQL
 ├── Storage
 └── Edge Functions
```

Environment-specific secrets must be stored using Vercel/Supabase environment configuration.

Secrets must not be committed to Git.

---

# 4. Application Architecture

Use a modular frontend architecture.

Recommended structure:

```text
src/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── assets/
│   ├── repairs/
│   ├── notifications/
│   └── webmcp/
│
├── pages/
│   ├── public/
│   ├── auth/
│   ├── admin/
│   ├── technician/
│   └── employee/
│
├── hooks/
│
├── services/
│   ├── auth/
│   ├── assets/
│   ├── repairs/
│   ├── notifications/
│   └── webmcp/
│
├── lib/
│   ├── supabase/
│   ├── permissions/
│   └── validation/
│
├── types/
│
└── routes/
```

The final folder structure can be adjusted during implementation, but responsibilities should remain separated.

---

# 5. Authentication

Supabase Auth is used for authentication.

Required capabilities:

- Sign up
- Sign in
- Sign out
- Session persistence
- Password reset
- Protected application routes

Authentication flow:

```text
User
 ↓
Login / Signup
 ↓
Supabase Auth
 ↓
Authenticated Session
 ↓
Retrieve User Profile
 ↓
Determine Role
 ↓
Load Role-Specific Application
```

The user's role must be stored separately from authentication credentials and must not be trusted from client-controlled data.

---

# 6. Authorization / RBAC

RepairDesk uses:

```text
ADMIN
MANAGER
TECHNICIAN
EMPLOYEE
```

Authorization must be enforced at multiple layers:

```text
UI visibility
+
Route authorization
+
Supabase RLS
+
Server-side validation
+
WebMCP tool authorization
```

## 6.1 Admin

Full operational and system administration.

Can:

- Manage users
- Manage roles
- Manage technicians
- Manage employees
- Manage assets
- Manage repair operations
- Manage organization settings
- Manage system settings
- View all repair history
- View all notifications
- Manage security settings

---

## 6.2 Manager

Operational management.

Can:

- Manage assets
- Manage repair operations
- Manage technicians
- Manage employees
- View all repair history
- View operational notifications
- Manage operational settings
- Perform approved operational actions

Cannot perform restricted system-level operations such as:

- Changing Admin/System Admin authority
- Organization ownership changes
- Critical system security configuration

---

## 6.3 Technician

Repair execution role.

Can:

- View assigned repairs
- Update assigned repair status
- Add repair notes
- Resolve assigned repairs
- View relevant assets
- View asset warranty information
- View repair history
- View relevant notifications
- View assigned workload
- Report a repair issue when necessary

Cannot:

- Manage users
- Manage roles
- Manage technicians
- Create/delete organizational assets
- Reassign assets administratively
- Manage organization settings

---

## 6.4 Employee

Equipment end-user role.

Can:

- View own dashboard
- View own assets
- Report issues
- View own repair tickets
- Track repair status
- View assigned technician for own ticket
- View relevant notifications
- Manage personal settings

Cannot:

- Manage assets
- Assign technicians
- Manage repairs belonging to others
- Manage users
- Manage roles
- Manage technicians
- Manage organization settings

---

# 7. Database Design

The primary database entities are:

```text
organizations
users / profiles
assets
asset_categories
repair_tickets
repair_notes
repair_history
technicians
notifications
warranties
audit_logs
webmcp_tool_executions
```

Exact table naming may be adjusted during implementation, but the relationships below must be preserved.

---

# 8. Core Data Relationships

```text
Organization
    │
    ├── Users
    │     ├── Admin
    │     ├── Manager
    │     ├── Technician
    │     └── Employee
    │
    ├── Assets
    │      │
    │      └── Repair Tickets
    │               │
    │               ├── Reporter
    │               ├── Technician
    │               ├── Notes
    │               └── History
    │
    ├── Notifications
    │
    ├── Audit Logs
    │
    └── WebMCP Tool Executions
```

---

# 9. User/Profile Data

Recommended fields:

```text
id
auth_user_id
organization_id
full_name
email
role
department
employee_id / technician_id
specialization
created_at
updated_at
```

Role-specific fields should only be populated where applicable.

---

# 10. Asset Data

Recommended fields:

```text
id
organization_id
asset_id
name
category_id
serial_number
status
assigned_user_id
location
purchase_date
warranty_start
warranty_end
created_at
updated_at
```

Asset status:

```text
ACTIVE
IN_REPAIR
RETIRED
```

Warranty status should be derived from warranty dates where possible instead of being manually duplicated.

---

# 11. Repair Ticket Data

Recommended fields:

```text
id
ticket_number
organization_id
asset_id
reported_by
assigned_technician_id
title
description
priority
status
due_date
diagnosis
resolution
created_at
updated_at
resolved_at
closed_at
```

Priority:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Status:

```text
OPEN
ASSIGNED
DIAGNOSING
IN_REPAIR
RESOLVED
CLOSED
```

Status transitions must be validated.

---

# 12. Repair Notes

Recommended fields:

```text
id
repair_ticket_id
author_id
content
created_at
```

Repair notes must preserve author and timestamp information.

Editing/deleting completed historical notes should be restricted.

---

# 13. Repair History

Historical records should preserve:

- Ticket
- Asset
- Issue
- Diagnosis
- Resolution
- Technician
- Priority
- Status
- Timeline
- Created/resolved dates

Completed repair records should normally be immutable or tightly restricted.

Historical data is used for:

- Technician diagnosis
- Repeated-failure detection
- Manager analysis
- Admin reporting
- WebMCP information retrieval

---

# 14. Notifications

Recommended fields:

```text
id
organization_id
recipient_user_id
type
title
message
related_ticket_id
related_asset_id
is_read
created_at
```

Notification visibility must be enforced by recipient and authorization rules.

Notification types include:

```text
REPAIR_UPDATE
REPAIR_ASSIGNMENT
CRITICAL_REPAIR
ASSET_UPDATE
WARRANTY_WARNING
DEADLINE_REMINDER
REPAIR_RESOLVED
SYSTEM_NOTICE
```

---

# 15. Audit Log

Important operations should be recorded.

Recommended fields:

```text
id
organization_id
actor_user_id
action
entity_type
entity_id
metadata
created_at
```

Examples:

```text
ASSET_CREATED
ASSET_UPDATED
ASSET_RETIRED
REPAIR_CREATED
REPAIR_ASSIGNED
REPAIR_STATUS_CHANGED
REPAIR_RESOLVED
USER_ROLE_CHANGED
WEBMCP_TOOL_EXECUTED
```

Audit logging is especially important for AI-agent operations.

---

# 16. Row Level Security

Supabase RLS must protect every organization-owned table.

Basic rule:

```text
User can only access data
that their organization and role permit.
```

Examples:

### Employee

```text
assets:
assigned_user_id = current_user

repair_tickets:
reported_by = current_user

notifications:
recipient_user_id = current_user
```

### Technician

```text
repair_tickets:
assigned_technician_id = current_user
```

plus explicitly permitted operational records.

### Admin / Manager

Organization-wide access according to role permissions.

RLS policies must not rely solely on frontend route guards.

---

# 17. Repair Workflow

The primary repair workflow is:

```text
Employee reports issue
        ↓
Repair ticket created
        ↓
Manager/Admin reviews
        ↓
Technician assigned
        ↓
Technician diagnoses
        ↓
Repair begins
        ↓
Repair resolved
        ↓
Ticket closed
        ↓
History preserved
        ↓
Relevant notifications generated
```

The exact transition rules should be implemented centrally so invalid transitions cannot be created from the client.

---

# 18. Asset Workflow

```text
Create Asset
      ↓
Assign Asset
      ↓
Active
      ↓
Repair Required
      ↓
In Repair
      ↓
Resolved
      ↓
Active
```

If an asset repeatedly fails, the system should surface the repeated-failure condition.

---

# 19. Employee Issue Workflow

```text
Employee
   ↓
Select assigned asset
   ↓
Describe issue
   ↓
Submit
   ↓
Repair Ticket
   ↓
Technician Assignment
   ↓
Repair
   ↓
Notification Updates
   ↓
Resolution
```

Employees must not select technicians themselves.

---

# 20. Technician Workflow

```text
Assigned Repair
      ↓
Open Asset
      ↓
Review History
      ↓
Check Warranty
      ↓
Diagnose
      ↓
Add Notes
      ↓
Move to In Repair
      ↓
Resolve
```

---

# 21. WebMCP Architecture

WebMCP is an interaction layer over supported RepairDesk operations.

Conceptually:

```text
AI Agent
   ↓
WebMCP
   ↓
RepairDesk Tool
   ↓
Authentication
   ↓
Authorization
   ↓
Application Service
   ↓
Supabase
   ↓
PostgreSQL
```

WebMCP must NOT directly bypass application authorization.

Every tool execution must verify:

```text
Who is making the request?
What organization do they belong to?
What role do they have?
Is this action allowed?
Is the requested resource accessible?
```

---

# 22. WebMCP Tool Categories

Potential tools:

## Asset

```text
search_assets
get_asset
get_asset_status
check_warranty
get_asset_repair_history
```

## Repair

```text
search_repairs
get_repair
create_repair_ticket
update_repair_status
add_repair_note
get_repair_history
```

## Technician / Operations

```text
find_available_technicians
get_technician_workload
get_operational_alerts
```

Tool exposure must remain permission-aware.

A tool available to Admin does not automatically become available to Employee.

---

# 23. WebMCP Authorization

Example:

```text
Employee
  ↓
create_repair_ticket
  ↓
Allowed only for employee's accessible asset
```

Example:

```text
Employee
  ↓
assign_technician
  ↓
DENIED
```

Example:

```text
Technician
  ↓
update_repair_status
  ↓
Allowed only for permitted assigned repair
```

Example:

```text
Manager
  ↓
assign_technician
  ↓
Allowed
```

The same business rules must apply whether an operation originates from:

- UI
- WebMCP
- API
- server-side service

---

# 24. WebMCP Auditability

Every important WebMCP operation should be logged.

Example:

```text
Actor:
AI Agent / authenticated user

Tool:
get_asset_repair_history

Resource:
PROJ-023

Result:
SUCCESS

Timestamp:
2026-09-07T...

Authorization:
ALLOWED
```

For denied operations:

```text
Tool:
assign_technician

Result:
DENIED

Reason:
Insufficient permissions
```

Do not store sensitive secrets or raw authentication credentials in audit logs.

---

# 25. AI / Human Approval

Human approval should be retained for operations considered sensitive, destructive, or organizationally significant.

Examples that may require approval:

- High-impact administrative changes
- Destructive operations
- Permission/role changes
- Critical system configuration
- Actions outside the normal agent scope

The exact approval matrix can be finalized during implementation.

---

# 26. API / Service Layer

Application operations should be centralized in service functions rather than scattered across components.

Example:

```text
assetService
repairService
notificationService
userService
webmcpService
```

Example:

```ts
repairService.createRepairTicket();
repairService.assignTechnician();
repairService.updateRepairStatus();
repairService.getRepairHistory();
```

These services should perform validation before database mutation.

---

# 27. Validation

All input must be validated before persistence.

Validate:

- Required fields
- String length
- Ticket identifiers
- Asset identifiers
- Dates
- Status transitions
- Priority values
- Role values
- Relationships
- Authorization

Prefer strongly typed schemas for complex forms and service inputs.

---

# 28. Error Handling

Application errors should return predictable structures.

Example:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

Common error categories:

```text
UNAUTHENTICATED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
CONFLICT
DATABASE_ERROR
INTERNAL_ERROR
```

Do not expose raw database errors to end users.

---

# 29. Conflict Prevention

RepairDesk must prevent conflicting operations.

Examples:

- Two users attempting incompatible ticket updates
- Technician assigned outside permitted scope
- Invalid asset ownership changes
- Invalid repair status transitions
- Duplicate ticket creation caused by repeated requests

Critical mutations should use transactional database operations where necessary.

---

# 30. Notifications Architecture

Notifications should be generated from significant domain events.

Examples:

```text
repair_created
        ↓
notification

technician_assigned
        ↓
notification

repair_status_changed
        ↓
notification

repair_resolved
        ↓
notification

warranty_threshold_reached
        ↓
notification
```

Notifications should not be hardcoded into individual UI components.

---

# 31. Search and Filtering

Search must support the appropriate role-visible data.

Examples:

Assets:

```text
asset ID
asset name
serial number
category
location
```

Repairs:

```text
ticket
asset
issue
technician
status
priority
```

History:

```text
ticket
asset
issue
resolution
technician
date
```

Search queries must still respect RLS.

---

# 32. File Attachments

If implemented, attachments may be stored using Supabase Storage.

Potential attachment use:

- Employee issue screenshots/photos
- Technician repair documentation
- Repair evidence

Storage access must follow the same organization and role authorization model.

---

# 33. Realtime Requirements

Realtime updates may be used for:

- Repair status changes
- New notifications
- Technician assignment
- Important operational activity

Realtime subscriptions must be filtered so users do not receive unauthorized records.

---

# 34. Frontend Route Structure

Recommended routes:

```text
/
 /login
 /signup

 /dashboard

 /assets
 /assets/:id

 /repairs
 /repairs/:id

 /repair-history

 /notifications

 /settings
```

Role-specific route visibility should be controlled through authorization.

Examples:

```text
Employee:
/dashboard
/my-issues
/my-assets
/notifications
/settings

Technician:
/dashboard
/my-repairs
/assets
/repair-history
/notifications
/settings

Admin / Manager:
/dashboard
/assets
/repair-history
/notifications
/settings
```

---

# 35. Frontend State Management

Use local component state for isolated UI state.

Use shared application state for:

- Authentication session
- Current user
- Current role
- Global notification count
- Important shared UI state

Avoid creating a large global state store unless implementation complexity requires it.

Server data should remain server/database-driven rather than duplicated unnecessarily in global state.

---

# 36. UI Implementation Requirements

The approved Stitch designs are the visual source of truth.

The implementation must preserve:

- Sidebar structure
- Role-specific navigation
- Cream background
- Dotted background
- Industrial Neo-Brutalist visual language
- Space Grotesk headings
- Inter body/interface text
- Strong black borders
- Orange primary accent
- Electric-yellow secondary accent
- Hard-offset shadows
- Responsive grid layouts

The landing page uses an interactive dotted/WebGL background and WebMCP-focused product visualization, while authenticated pages use role-specific operational dashboards.

The Admin/Manager application shell uses a fixed 256px sidebar and a shared navigation structure.

---

# 37. Responsive Requirements

### Desktop

- Fixed sidebar
- Multi-column layouts
- Full operational tables
- Large dashboard panels

### Tablet

- Collapsible sidebar where necessary
- Responsive grid
- Filters wrap

### Mobile

- Compact/collapsible navigation
- Single-column cards
- Tables converted to cards where necessary
- No page-level horizontal overflow
- Primary actions remain accessible

---

# 38. Security Requirements

Mandatory:

- Supabase Auth
- Supabase RLS
- Server-side permission checks
- Secure environment variables
- Input validation
- Authorization on every mutation
- WebMCP authorization
- Audit logging for sensitive actions
- No secrets in frontend source
- No sensitive credentials in logs

Never trust:

```text
client-provided role
client-provided organization ID
client-provided ownership
client-provided permission
```

These values must be verified server-side.

---

# 39. Environment Variables

Frontend environment variables may include:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Backend/server-side secrets must use secure Supabase/Vercel environment configuration.

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

to the browser.

---

# 40. Vercel Deployment

Production deployment:

```text
Git Repository
      ↓
Vercel
      ↓
Build React + Vite Application
      ↓
Deploy
```

Vercel should provide:

- Production deployment
- Preview deployments
- Environment variables
- HTTPS
- Build automation

Supabase remains responsible for backend infrastructure.

---

# 41. Git Workflow

Recommended:

```text
main
 ├── development
 ├── feature/auth
 ├── feature/assets
 ├── feature/repairs
 ├── feature/webmcp
 └── feature/notifications
```

Do not commit:

```text
.env
service-role keys
private API keys
credentials
```

---

# 42. Performance Requirements

The application should:

- Paginate large tables
- Avoid unnecessary database queries
- Avoid fetching unauthorized data
- Lazy-load heavy UI where appropriate
- Keep dashboard queries focused
- Debounce search inputs
- Avoid unnecessary realtime subscriptions

Large datasets should never require loading the entire table into the browser.

---

# 43. Observability

Monitor:

- Authentication failures
- Database failures
- Edge Function failures
- WebMCP tool failures
- Unauthorized actions
- Important application errors
- Vercel deployment/build failures

WebMCP execution logs should allow debugging of:

```text
tool
actor
resource
authorization result
execution result
timestamp
error
```

---

# 44. Technical Constraints

The implementation must not:

- Replace Supabase with another backend
- Replace Vercel as the deployment platform without architectural approval
- Bypass Supabase RLS
- Implement authorization only in React
- Allow WebMCP to bypass existing permissions
- Duplicate business logic separately for UI and WebMCP
- Store secrets in client-side code
- Introduce unnecessary infrastructure for MVP requirements

---

# 45. MVP Technical Scope

## Required

- React + TypeScript + Vite application
- Supabase Auth
- PostgreSQL
- RLS
- Four-role RBAC
- Assets
- Repair tickets
- Repair lifecycle
- Repair history
- Notifications
- Role-specific settings
- WebMCP tools
- WebMCP authorization
- Audit logging
- Vercel deployment
- Responsive UI

## Optional / Later

- Advanced predictive analytics
- External messaging integrations
- Advanced AI diagnosis
- Advanced reporting
- Advanced maintenance forecasting
- Complex inventory management

---

# 46. Definition of Done

A feature is considered technically complete only when:

```text
UI implemented
+
Frontend validation
+
Backend/service logic
+
Supabase RLS
+
Role authorization
+
Error handling
+
Responsive behavior
+
Relevant tests
+
WebMCP integration where applicable
+
Audit logging for sensitive actions
```

A feature must not be considered secure simply because restricted UI controls are hidden.

---

# 47. Final Technical Architecture

```text
                         REPAIRDESK
                             │
             ┌───────────────┴────────────────┐
             │                                │
       Human Users                         AI Agents
             │                                │
             ▼                                ▼
      React + Vite                       WebMCP
             │                                │
             └───────────────┬────────────────┘
                             ▼
                  Authorization Layer
                             │
                   ┌─────────┴─────────┐
                   │                   │
             Supabase Auth        Business Services
                                       │
                                       ▼
                                PostgreSQL / RLS
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                  Assets             Repairs        Notifications
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                                  Audit Logs
```

---

# 48. Technical Principle

RepairDesk must be built as a **single permission-aware repair operations system**.

The UI, backend services, database authorization, and WebMCP layer must all enforce the same business rules.

The central rule is:

```text
One Operation
      ↓
One Business Rule
      ↓
Human UI + WebMCP + API
      ↓
Same Authorization
```

No integration, AI agent, frontend action, or API endpoint should be capable of bypassing RepairDesk's authorization model.

```

```
