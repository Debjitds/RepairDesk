# backend-scheema.md

# RepairDesk — Backend Schema & Data Model

## 1. Purpose

This document defines the backend data model for RepairDesk.

It describes:

- Core database entities
- Table responsibilities
- Relationships
- Important fields
- Status values
- Ownership rules
- Role-based data access
- Repair lifecycle data
- Notifications
- Auditability
- WebMCP-related backend requirements
- Data integrity rules

The backend uses:

```text
Supabase
    ↓
PostgreSQL
    ↓
Row Level Security (RLS)
```

This document defines the **data model and backend relationships**.

Detailed implementation, Supabase configuration, Edge Functions, deployment, and other technical decisions remain covered by `TRD.md`.

---

# 2. Backend Architecture

The backend follows:

```text
React / WebMCP
      ↓
Application Service / Backend Operation
      ↓
Validation + Authorization
      ↓
Supabase
      ↓
PostgreSQL + RLS
```

The frontend must never be treated as a trusted security boundary.

---

# 3. Core Entities

The RepairDesk backend is centered around these entities:

```text
organizations
users
assets
repairs
repair_notes
repair_history
notifications
audit_logs
```

Warranty information is associated with assets unless the final implementation requires a separate warranty entity.

---

# 4. Entity Relationship Overview

Conceptually:

```text
Organization
     │
     ├──────────── Users
     │               │
     │               ├── Reported Repairs
     │               ├── Assigned Repairs
     │               ├── Assigned Assets
     │               └── Notifications
     │
     └──────────── Assets
                     │
                     ├── Repairs
                     │     │
                     │     ├── Repair Notes
                     │     └── Repair History
                     │
                     └── Warranty Context
```

Audit logs record important system operations across the application.

---

# 5. organizations

## Purpose

Represents the organization/company using RepairDesk.

This provides the tenant boundary for organization-owned data.

## Important fields

```text
id
name
created_at
updated_at
```

## Rules

- Every organization-owned record should be associated with an organization.
- Users should only access data belonging to their authorized organization.
- Organization boundaries must be enforced by backend authorization and RLS.

---

# 6. users

## Purpose

Stores RepairDesk application-level user information associated with the authenticated Supabase user.

Supabase Auth remains responsible for authentication credentials.

## Important fields

```text
id
auth_user_id
organization_id
name
email
role
avatar_url
created_at
updated_at
```

## Role values

```text
ADMIN
MANAGER
TECHNICIAN
EMPLOYEE
```

There is no separate application role named:

```text
SYSTEM_ADMIN
```

## Rules

- `auth_user_id` maps the application user to Supabase Auth.
- `role` determines application permissions.
- Every user belongs to an organization.
- Role checks must not rely only on frontend state.

---

# 7. Role Data Access Model

## ADMIN

Can access authorized organization data and perform system/operational administration.

## MANAGER

Can access operational organization data but cannot perform Admin-only system operations.

## TECHNICIAN

Primarily accesses:

```text
Assigned Repairs
Relevant Assets
Relevant Repair History
Own Notifications
```

## EMPLOYEE

Primarily accesses:

```text
Own Assets
Own Repairs
Own Notifications
```

Data access must always be enforced through backend authorization and RLS.

---

# 8. assets

## Purpose

Represents physical equipment managed by the organization.

Examples:

```text
Laptop
Projector
Monitor
Printer
Network Device
```

## Important fields

```text
id
organization_id
asset_tag
name
category
serial_number
description
assigned_to
status
warranty_start_date
warranty_end_date
created_at
updated_at
```

The exact fields may be adjusted according to the final implementation.

## Asset status

```text
ACTIVE
IN_REPAIR
RETIRED
```

## Ownership / assignment

`assigned_to` references the appropriate user.

The relationship allows RepairDesk to determine which employee currently uses an asset.

---

# 9. Warranty Model

Warranty information is associated with the asset.

Conceptual states:

```text
ACTIVE
EXPIRING_SOON
EXPIRED
```

The state may be derived from the warranty end date rather than permanently stored.

### Example

```text
Current Date < Warranty End Date
        ↓
ACTIVE

Warranty End Date approaching
        ↓
EXPIRING_SOON

Current Date > Warranty End Date
        ↓
EXPIRED
```

The exact threshold for `EXPIRING_SOON` should be implemented according to the final business rule.

---

# 10. repairs

## Purpose

Represents an issue/ticket created for an asset.

A repair is the central operational entity connecting employees, technicians, assets, status, and repair history.

## Important fields

```text
id
organization_id
asset_id
reported_by
assigned_technician_id
title
description
priority
status
resolution
reported_at
assigned_at
resolved_at
closed_at
created_at
updated_at
```

The final implementation may add other operational fields where required.

---

# 11. Repair Priority

Allowed values:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Priority should be treated as controlled data rather than arbitrary text.

---

# 12. Repair Status

Allowed lifecycle:

```text
OPEN
ASSIGNED
DIAGNOSING
IN_REPAIR
RESOLVED
CLOSED
```

## Lifecycle

```text
OPEN
  ↓
ASSIGNED
  ↓
DIAGNOSING
  ↓
IN_REPAIR
  ↓
RESOLVED
  ↓
CLOSED
```

Invalid state transitions must be rejected by backend business logic.

---

# 13. Repair Ownership

A repair maintains several important user relationships:

```text
reported_by
    ↓
User who reported the issue

assigned_technician_id
    ↓
Technician responsible for repair
```

These relationships must not be interchangeable.

An employee may report a repair without being the assigned technician.

---

# 14. Repair Creation

Typical creation flow:

```text
User / Authorized Agent
      ↓
Select Asset
      ↓
Provide Issue
      ↓
Determine Priority
      ↓
Validate Access
      ↓
Create Repair
      ↓
Status = OPEN
```

The backend should automatically populate:

- Organization
- Reporting user
- Creation timestamp
- Initial status

Do not trust these values if they are supplied directly by the client.

---

# 15. repair_notes

## Purpose

Stores notes added during repair work.

## Important fields

```text
id
repair_id
author_id
note
created_at
updated_at
```

## Rules

- Every note belongs to one repair.
- Every note belongs to an author.
- Access must follow the repair's authorization rules.
- Notes should remain part of the repair's operational history.

---

# 16. repair_history

## Purpose

Stores important historical changes related to repairs.

Examples:

```text
Repair Created
Technician Assigned
Status Changed
Repair Note Added
Repair Resolved
Repair Closed
```

## Important fields

```text
id
repair_id
actor_id
event_type
previous_status
new_status
description
created_at
```

The exact history event structure may evolve based on implementation requirements.

---

# 17. Repair History Principle

Repair history is an operational record.

It should allow authorized users to understand:

```text
What happened?
Who performed the action?
When did it happen?
What changed?
```

History should not be silently overwritten when the current repair state changes.

---

# 18. notifications

## Purpose

Stores user-facing system notifications.

## Important fields

```text
id
user_id
organization_id
type
title
message
related_repair_id
related_asset_id
is_read
created_at
```

## Rules

Notifications should be targeted to relevant users.

Examples:

```text
New Repair
Technician Assigned
Repair Status Updated
Repair Resolved
Operational Alert
```

A notification should not expose information that the recipient is not authorized to access.

---

# 19. audit_logs

## Purpose

Provides traceability for important system operations.

Especially useful for:

```text
Administrative actions
Role changes
Asset changes
Technician assignments
Important repair changes
WebMCP actions
```

## Important fields

```text
id
organization_id
actor_id
action
entity_type
entity_id
metadata
created_at
```

`metadata` may contain structured information about the operation where appropriate.

Do not store secrets or unnecessary sensitive information in audit metadata.

---

# 20. Relationships

## Organization → Users

```text
organizations.id
        ↓
users.organization_id
```

One organization can have many users.

---

## Organization → Assets

```text
organizations.id
        ↓
assets.organization_id
```

One organization can have many assets.

---

## User → Assets

```text
users.id
        ↓
assets.assigned_to
```

An employee may have one or more assigned assets.

---

## Asset → Repairs

```text
assets.id
        ↓
repairs.asset_id
```

One asset can have multiple repair records over time.

---

## User → Repairs

```text
users.id
        ↓
repairs.reported_by
```

A user can report multiple repairs.

---

## Technician → Repairs

```text
users.id
        ↓
repairs.assigned_technician_id
```

A technician can be assigned multiple repairs.

---

## Repair → Notes

```text
repairs.id
        ↓
repair_notes.repair_id
```

A repair can contain multiple notes.

---

## Repair → History

```text
repairs.id
        ↓
repair_history.repair_id
```

A repair can have multiple history events.

---

## User → Notifications

```text
users.id
        ↓
notifications.user_id
```

A user can have many notifications.

---

# 21. Foreign Key Rules

Important relationships should use database foreign keys.

Conceptually:

```text
users.organization_id
    → organizations.id

assets.organization_id
    → organizations.id

assets.assigned_to
    → users.id

repairs.organization_id
    → organizations.id

repairs.asset_id
    → assets.id

repairs.reported_by
    → users.id

repairs.assigned_technician_id
    → users.id

repair_notes.repair_id
    → repairs.id

repair_notes.author_id
    → users.id

repair_history.repair_id
    → repairs.id

repair_history.actor_id
    → users.id

notifications.user_id
    → users.id

notifications.related_repair_id
    → repairs.id

notifications.related_asset_id
    → assets.id

audit_logs.actor_id
    → users.id
```

The final schema should define appropriate `ON DELETE` behavior rather than blindly cascading all relationships.

---

# 22. Data Ownership Rules

Ownership/access must follow these principles:

### Employee

```text
Own Assets
Own Repairs
Own Notifications
```

### Technician

```text
Assigned Repairs
Relevant Assets
Relevant Repair History
Own Notifications
```

### Manager

```text
Authorized Operational Organization Data
```

### Admin

```text
Authorized Organization + Administrative Data
```

Do not implement broad access merely because two records belong to the same organization.

Role and resource permissions still matter.

---

# 23. RLS Strategy

Supabase Row Level Security is a core security boundary.

RLS policies should consider:

```text
Authenticated User
        ↓
User Role
        ↓
Organization
        ↓
Resource Relationship
```

Examples:

```text
Employee
→ own asset records

Employee
→ own repair records

Technician
→ assigned repair records

Manager
→ authorized operational records

Admin
→ authorized administrative records
```

Exact SQL policies belong in the database migration/implementation layer.

---

# 24. Backend Authorization

RLS alone should not be used as an excuse to put all business rules in the database.

Sensitive operations should follow:

```text
Request
  ↓
Authentication
  ↓
Authorization
  ↓
Validation
  ↓
Business Rule
  ↓
Database Operation
```

This is especially important for:

- Status transitions
- Technician assignment
- Role changes
- Administrative actions
- WebMCP operations

---

# 25. Repair Status Integrity

Backend logic should prevent invalid transitions.

Example:

```text
OPEN → ASSIGNED
```

is valid.

But:

```text
OPEN → CLOSED
```

should not be allowed unless a specific approved workflow explicitly permits it.

The final transition rules must remain consistent across:

```text
Web UI
WebMCP
Backend Services
```

---

# 26. Asset / Repair Consistency

Asset and repair state should remain logically consistent.

Example:

```text
Repair Active
    ↓
Asset
    ↓
IN_REPAIR
```

When the repair is resolved/closed, the asset should return to the appropriate operational status according to the business rules.

Do not allow UI actions to leave related records in obviously contradictory states.

---

# 27. Technician Assignment Integrity

When assigning a technician:

```text
Repair
   ↓
Validate Technician
   ↓
Verify Technician Role
   ↓
Verify Organization
   ↓
Assign
   ↓
Create History Event
   ↓
Create Notification
```

A technician from another organization must never be assignable.

A non-technician user must not become a technician through an arbitrary client request.

---

# 28. Notification Integrity

Notifications may reference resources such as:

```text
related_repair_id
related_asset_id
```

Those references must not become a way to bypass authorization.

Example:

An Employee receiving a notification for a repair does not automatically gain access to other repairs simply because they know the repair ID.

The related resource must still pass authorization checks.

---

# 29. WebMCP Backend Integration

WebMCP operations should use the same backend data model.

Conceptually:

```text
AI Agent
    ↓
WebMCP Tool
    ↓
Authenticated User Context
    ↓
Authorization
    ↓
Business Operation
    ↓
Database
```

WebMCP should not introduce a separate database or duplicate repair/asset data model.

---

# 30. WebMCP Data Access

Read operations should respect the same access rules.

Examples:

```text
search_assets
get_asset
check_warranty
get_asset_repair_history

search_repairs
get_repair
get_repair_history
```

The returned records must be limited to resources the authenticated user is allowed to access.

---

# 31. WebMCP Mutation Operations

Mutation tools may include:

```text
create_repair_ticket
update_repair_status
add_repair_note
```

The backend must validate:

```text
User identity
Role
Organization
Target resource
Input
Allowed operation
Allowed state transition
```

before performing the mutation.

---

# 32. Audit WebMCP Actions

Important WebMCP mutations should be attributable to the authenticated execution context.

Conceptual flow:

```text
WebMCP Action
     ↓
Application Operation
     ↓
Database Change
     ↓
Audit Record
```

The audit record should identify the responsible user and operation where supported by the implementation.

---

# 33. Timestamps

Operational tables should use consistent timestamps.

Recommended baseline:

```text
created_at
updated_at
```

Where relevant:

```text
reported_at
assigned_at
resolved_at
closed_at
```

Timestamps should be generated server-side whenever practical.

---

# 34. IDs

Primary keys should use stable unique identifiers.

UUIDs are appropriate for Supabase/PostgreSQL-backed entities.

External-facing identifiers such as:

```text
RD-1042
ASSET-018
```

may be represented separately from internal primary keys when the product requires human-readable IDs.

Do not expose internal database structure unnecessarily through UI identifiers.

---

# 35. Soft Delete / Retention

Do not automatically hard-delete operational records that are needed for history or auditing.

For important records such as:

```text
Repairs
Repair History
Audit Logs
```

retention should preserve operational traceability.

If soft deletion is introduced, it should be explicitly defined and consistently enforced.

---

# 36. Data Validation

Important constraints should exist at the correct layer.

Examples:

```text
Required fields
Valid role values
Valid repair status
Valid priority
Valid asset status
Valid foreign-key relationships
Organization ownership
```

Database constraints should protect fundamental data integrity.

Application validation should provide user-friendly feedback.

---

# 37. Preventing Cross-Organization Access

Every organization-scoped query must remain organization-aware.

Conceptually:

```text
Authenticated User
      ↓
User Organization
      ↓
Requested Resource Organization
      ↓
Must Match
```

Cross-organization access must be denied.

This applies equally to:

```text
Frontend
Backend Services
Edge Functions
WebMCP
```

---

# 38. Recommended Indexing Areas

Indexes should be considered for frequently queried fields such as:

```text
users.organization_id
users.role

assets.organization_id
assets.assigned_to
assets.status
assets.asset_tag
assets.serial_number

repairs.organization_id
repairs.asset_id
repairs.reported_by
repairs.assigned_technician_id
repairs.status
repairs.priority

repair_notes.repair_id

repair_history.repair_id

notifications.user_id
notifications.is_read

audit_logs.organization_id
audit_logs.actor_id
```

Only create indexes that provide actual query value; avoid indexing every column by default.

---

# 39. Search Requirements

Common searchable data includes:

### Assets

```text
Asset Name
Asset Tag / ID
Serial Number
```

### Repairs

```text
Ticket ID
Asset
Issue
Status
Priority
Technician
```

### Repair History

```text
Asset
Repair
Technician
Status
Date
```

Search implementation may use PostgreSQL queries and appropriate indexes.

---

# 40. Transactional Operations

Operations affecting multiple related records should be treated as one logical backend operation.

Example:

```text
Assign Technician
      ↓
Update Repair
      ↓
Create History
      ↓
Create Notification
```

The system should avoid ending in a partially completed state.

Where the implementation requires atomicity, use an appropriate database transaction or server-side operation.

---

# 41. Example: Create Repair Transaction

Conceptual backend process:

```text
Validate User
     ↓
Validate Asset Access
     ↓
Validate Input
     ↓
Create Repair
     ↓
Create Initial History
     ↓
Create Required Notifications
     ↓
Return Repair
```

All dependent operations should remain consistent.

---

# 42. Example: Status Update Transaction

```text
Validate User
     ↓
Load Repair
     ↓
Validate Access
     ↓
Validate Transition
     ↓
Update Repair Status
     ↓
Create History
     ↓
Create Notification
     ↓
Return Updated Repair
```

---

# 43. Example: Technician Assignment Transaction

```text
Validate Manager/Admin Permission
        ↓
Validate Repair
        ↓
Validate Technician
        ↓
Validate Organization Match
        ↓
Assign Technician
        ↓
Set Repair Status = ASSIGNED
        ↓
Create History
        ↓
Create Notification
```

---

# 44. Database Constraints

The database should enforce fundamental rules wherever practical.

Examples:

```text
Role must be one of the approved roles.

Repair priority must be valid.

Repair status must be valid.

Asset status must be valid.

Required foreign keys must exist.

Organization relationships must remain valid.

Critical identifiers should remain unique where required.
```

Business workflows should not depend entirely on frontend validation.

---

# 45. Data Returned to Clients

Backend responses should return only data required by the caller.

Do not expose:

- Internal secrets
- Service credentials
- Unnecessary sensitive metadata
- Unauthorized records
- Internal audit information unless permitted

Data minimization is particularly important for WebMCP responses.

---

# 46. Schema Evolution

Database changes should be handled through controlled migrations.

When changing a table:

1. Identify dependent queries.
2. Identify RLS policies.
3. Identify frontend/service dependencies.
4. Update related types.
5. Apply migration.
6. Verify existing data compatibility.

Do not rename or remove production fields casually.

---

# 47. Backend Source of Truth

The backend schema must remain aligned with:

```text
PRD.md
TRD.md
Architect.md
web-app-flow.md
```

When actual Supabase implementation differs from this conceptual document, update the documentation or intentionally revise the schema.

Never maintain two conflicting versions of the data model without documenting the reason.

---

# 48. MVP Data Model

The minimum viable backend should support:

```text
Organizations
Users
Assets
Repairs
Repair Notes
Repair History
Notifications
Audit Logs
```

The schema should remain focused on RepairDesk's core repair-operations workflow.

Do not introduce unrelated enterprise domains.

---

# 49. What This Schema Does Not Define

This document does not fully define:

```text
Frontend component architecture
Visual design
Landing page structure
Detailed Supabase deployment
Vercel configuration
Exact WebMCP protocol implementation
Complete SQL migrations
TestSprite configuration
```

Those concerns belong to their respective project documents and implementation files.

---

# 50. Final Backend Model

The RepairDesk backend can be summarized as:

```text
                     ORGANIZATION
                          │
             ┌────────────┴────────────┐
             │                         │
           USERS                     ASSETS
             │                         │
       ┌─────┼─────┐                   │
       │     │     │                   │
     Role  Alerts  Repairs ◄───────────┘
                  │
          ┌───────┼────────┐
          │       │        │
        Notes   History  Notifications
                  │
                  │
             Audit Logs
```

The operational relationship is:

```text
Employee
   ↓
Reports Issue
   ↓
Repair
   ↓
Asset
   ↓
Technician
   ↓
Repair Work
   ↓
Repair History
   ↓
Resolution
   ↓
Notification
```

WebMCP provides an additional controlled interaction path into the same backend:

```text
AI Agent
   ↓
WebMCP
   ↓
Authenticated Context
   ↓
Authorization + Validation
   ↓
Same RepairDesk Operations
   ↓
Same PostgreSQL Data
```

## Core Rule

**There must be one authoritative RepairDesk data model. Human UI and AI-agent interactions must operate on the same secured backend, with the same organization boundaries, permissions, validation, and repair lifecycle.**

```

```
