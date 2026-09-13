# implementation_plan.md

# RepairDesk — Implementation Plan

## 1. Purpose

This document defines the recommended implementation order for building RepairDesk from the approved product requirements, architecture, backend schema, application flows, and Stitch-generated UI designs.

The implementation must be incremental.

The AI coding agent must complete and stabilize each phase before moving to the next phase.

---

# 2. Implementation Principles

The implementation must follow these rules:

1. **Do not redesign the approved Stitch UI.**
2. **Use the relevant Stitch HTML file as the visual source of truth for each page.**
3. **Use `PRD.md` for product requirements.**
4. **Use `TRD.md` for technical implementation details.**
5. **Use `Architect.md` for system architecture and boundaries.**
6. **Use `backend-scheema.md` for the backend data model.**
7. **Use `web-app-flow.md` for user/application flows.**
8. **Use `rules.md` for AI-agent development rules.**
9. Build the backend and security foundation before connecting complex UI functionality.
10. Never bypass authentication, RBAC, RLS, or WebMCP authorization.
11. Avoid unnecessary dependencies and large refactors.
12. Keep each implementation phase focused and testable.

---

# 3. Overall Implementation Sequence

```text
Phase 1
Project Foundation
        ↓
Phase 2
Supabase + Database Foundation
        ↓
Phase 3
Authentication + RBAC
        ↓
Phase 4
Shared Application Shell
        ↓
Phase 5
Admin / Manager Modules
        ↓
Phase 6
Technician Modules
        ↓
Phase 7
Employee Modules
        ↓
Phase 8
Cross-Module Workflows
        ↓
Phase 9
WebMCP Integration
        ↓
Phase 10
Notifications + Realtime/Supporting Features
        ↓
Phase 11
Responsive + UX Refinement
        ↓
Phase 12
Production Integration + Deployment
        ↓
Phase 13
TestSprite Validation
````

---

# 4. Phase 1 — Project Foundation

## Objective

Prepare the application structure and development environment.

## Tasks

* Initialize/verify React + TypeScript + Vite project.
* Verify Tailwind CSS configuration.
* Verify shadcn/ui setup where required.
* Establish project folder structure.
* Configure environment variable handling.
* Establish reusable UI/component structure.
* Establish service/data-access structure.
* Establish routing structure.
* Review existing dependencies before installing anything new.

## Important

Do not begin by rewriting all Stitch HTML files into large monolithic React components.

First identify reusable structures such as:

```text
AppShell
Sidebar
PageHeader
Button
Badge
Table
Card
NotificationItem
LoadingState
EmptyState
ErrorState
```

Only create abstractions when they are actually reused.

---

# 5. Phase 2 — Supabase + Database Foundation

## Objective

Create the backend foundation before implementing complex business UI.

## Tasks

Implement the core database structure:

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

Implement:

* Primary keys
* Foreign keys
* Required constraints
* Valid role values
* Valid asset statuses
* Valid repair statuses
* Valid priorities
* Relevant indexes
* Timestamps
* Organization relationships

## Core roles

```text
ADMIN
MANAGER
TECHNICIAN
EMPLOYEE
```

Do not create:

```text
SYSTEM_ADMIN
```

as a separate application role.

---

# 6. Phase 3 — RLS + Backend Security Foundation

## Objective

Establish the actual security boundary before exposing application data.

## Tasks

Implement Supabase RLS for:

* Organizations
* Users
* Assets
* Repairs
* Repair Notes
* Repair History
* Notifications
* Audit Logs

Define access according to:

```text
Authenticated User
      ↓
Role
      ↓
Organization
      ↓
Resource Access / Ownership
      ↓
Allowed Operation
```

Verify that frontend visibility is not being treated as security.

The database/backend must independently reject unauthorized access.

---

# 7. Phase 4 — Authentication + Role Resolution

## Objective

Build reliable authentication and application-role resolution.

## Tasks

Implement:

* Login
* Signup
* Logout
* Session persistence
* Authenticated route protection
* User profile loading
* Role resolution
* Unauthorized handling
* Session cleanup

Flow:

```text
Login / Signup
      ↓
Supabase Auth
      ↓
Authenticated Session
      ↓
Application User
      ↓
Role Resolution
      ↓
Role-Aware Application
```

Do not disable authentication to simplify development.

---

# 8. Phase 5 — Shared Application Shell

## Objective

Create the common authenticated application structure.

## Tasks

Implement:

* Sidebar
* RepairDesk branding
* Role-aware navigation
* User profile area
* Logout
* Main content layout
* Responsive shell
* Active navigation state

Navigation:

### Admin / Manager

```text
Dashboard
Assets
Repair History
Notifications
Settings
```

### Technician

```text
Dashboard
My Repairs
Assets
Repair History
Notifications
Settings
```

### Employee

```text
Dashboard
My Issues
My Assets
Notifications
Settings
```

The shell must be shared rather than duplicated for each role.

---

# 9. Phase 6 — Stitch UI Integration Strategy

Before implementing each individual page:

```text
Identify Stitch File
      ↓
Read/Analyze Complete HTML
      ↓
Identify Layout
      ↓
Identify Components
      ↓
Identify Responsive Rules
      ↓
Convert to React
      ↓
Connect Real Data
      ↓
Preserve Visual Design
```

For each page, inspect:

* HTML structure
* CSS
* Tailwind classes
* typography
* colors
* spacing
* borders
* shadows
* icons
* responsive behavior
* hover/active states
* mock data

Do not recreate the design from `DESIGN.md` alone.

The relevant Stitch HTML remains the primary UI reference.

---

# 10. Phase 7 — Admin / Manager Modules

## 10.1 Dashboard

Implement:

* Operations overview
* Operational metrics
* Repair-related information
* Asset-related information
* Relevant alerts
* Approved Stitch dashboard structure

Use:

```text
admin_manager_dashboard.html
```

as the primary visual implementation reference where present.

---

## 10.2 Assets

Implement:

* Asset listing
* Search
* Filtering
* Asset details
* Add Asset
* Update Asset
* Asset status
* Assignment
* Warranty information
* Repair context

Use the approved Admin/Manager Asset Stitch file as the visual source.

---

## 10.3 Repair History

Implement:

* Search
* Filters
* Repair history listing
* Repair detail context
* Asset relationship
* Technician information where permitted
* Resolution information

Preserve the approved Stitch layout.

---

## 10.4 Notifications

Implement:

* Notification listing
* Read/unread state
* Related resource navigation
* Relevant operational notifications

Only show notifications applicable to the authenticated user.

---

## 10.5 Settings

Implement:

* Settings layout
* Operational settings allowed to Manager
* System-level settings allowed to Admin
* Personal settings

Manager must not receive Admin-only controls.

---

# 11. Phase 8 — Technician Modules

## 11.1 Technician Dashboard

Implement:

* Assigned repair count
* Critical repair count
* In-repair count
* Completed work
* Assigned repair list

Use the approved Technician Stitch dashboard.

---

## 11.2 My Repairs

Implement:

* Assigned repair list
* Search/filter where present
* Repair details
* Priority
* Status
* Due information
* Permitted actions

Use:

```text
technician_my_repair.html
```

as the primary reference where applicable.

---

## 11.3 Technician Repair Execution

Implement:

```text
Assigned
   ↓
Diagnosing
   ↓
In Repair
   ↓
Resolved
```

Support:

* Viewing asset
* Checking warranty
* Viewing history
* Adding repair notes
* Updating status
* Resolution information

Do not allow technicians to update unrelated repairs.

---

## 11.4 Technician Assets

Implement:

* Asset search
* Asset details
* Status
* Warranty
* Repair context
* Relevant history

Use the approved Technician Asset Stitch file.

---

## 11.5 Technician Repair History

Implement the approved history experience with appropriate permission restrictions.

---

## 11.6 Technician Notifications

Implement technician-specific notifications using the approved Stitch design.

---

## 11.7 Technician Settings

Implement personal settings only.

---

# 12. Phase 9 — Employee Modules

## 12.1 Employee Dashboard

Implement the employee-focused dashboard using the approved Stitch design.

The dashboard should emphasize personal:

* Assets
* Issues
* Repair progress
* Notifications

---

## 12.2 My Assets

Implement:

* Assigned assets
* Search/filter where present
* Asset details
* Current status
* Warranty information
* Relevant repair context

Use:

```text
employee_my_assets.html
```

as the primary UI reference.

---

## 12.3 My Issues

Implement:

* User's submitted repairs
* Search
* Status filters
* Ticket details
* Asset
* Issue
* Priority
* Technician
* Date
* Status

Use:

```text
employee_my_issue.html
```

as the primary reference.

---

## 12.4 Report Issue

Implement:

```text
Report Issue
      ↓
Select Own Asset
      ↓
Enter Issue
      ↓
Validate
      ↓
Create Repair
      ↓
OPEN
      ↓
Notify Relevant Users
```

An employee must not be able to create a repair for an unauthorized asset.

---

## 12.5 Employee Notifications

Implement user-specific notifications and related navigation.

---

## 12.6 Employee Settings

Implement personal settings only.

---

# 13. Phase 10 — Core Repair Workflow Integration

Once the role-specific pages exist, connect the complete operational workflow.

## Complete Flow

```text
Employee
   ↓
Reports Issue
   ↓
Repair Created
   ↓
OPEN
   ↓
Admin / Manager
   ↓
Assign Technician
   ↓
ASSIGNED
   ↓
Technician
   ↓
DIAGNOSING
   ↓
IN REPAIR
   ↓
RESOLVED
   ↓
CLOSED
   ↓
Employee Receives Update
```

Every state-changing operation must:

```text
Validate Permission
      ↓
Validate Input
      ↓
Validate Transition
      ↓
Update Data
      ↓
Create History
      ↓
Trigger Required Notification
```

---

# 14. Phase 11 — Asset and Repair Consistency

Connect asset state with repair operations.

Example:

```text
Repair Active
      ↓
Asset = IN_REPAIR
```

After repair completion:

```text
Repair Resolved / Closed
      ↓
Asset returns to appropriate state
```

The exact final transition must follow the approved business rules.

Prevent contradictory states.

---

# 15. Phase 12 — Notifications

Implement event-driven notification behavior for relevant actions.

Examples:

```text
Repair Created
Technician Assigned
Repair Status Updated
Repair Resolved
Operational Alert
```

General flow:

```text
System Event
    ↓
Determine Affected Users
    ↓
Check Relevance + Permission
    ↓
Create Notification
    ↓
Display Notification
    ↓
Navigate to Related Resource
```

Do not broadcast private operational information.

---

# 16. Phase 13 — WebMCP Foundation

Implement WebMCP only after the core RepairDesk workflow is functional through the normal UI.

Reason:

The WebMCP layer must expose real, working application operations rather than separate logic.

Core flow:

```text
AI Agent
    ↓
WebMCP Tool
    ↓
Authenticated User Context
    ↓
Authorization
    ↓
Validation
    ↓
Existing Application Operation
    ↓
Supabase
    ↓
Result
```

---

# 17. Phase 14 — WebMCP Tools

Implement only the tools required for the MVP.

## Asset Tools

```text
search_assets
get_asset
get_asset_status
check_warranty
get_asset_repair_history
```

## Repair Tools

```text
search_repairs
get_repair
create_repair_ticket
update_repair_status
add_repair_note
get_repair_history
```

## Operations Tools

```text
find_available_technicians
get_technician_workload
get_operational_alerts
```

Do not implement tools that expose unnecessary privileged functionality.

---

# 18. Phase 15 — WebMCP Authorization

Every WebMCP operation must enforce:

```text
Authentication
    ↓
User Identity
    ↓
Organization
    ↓
Role
    ↓
Resource Access
    ↓
Operation Permission
    ↓
Input Validation
```

Examples:

```text
Employee
→ own repair
→ allowed

Employee
→ another employee's repair
→ denied

Technician
→ assigned repair
→ allowed

Technician
→ user management
→ denied

Manager
→ operational management
→ allowed

Manager
→ Admin-only system action
→ denied
```

---

# 19. Phase 16 — WebMCP Mutation Safety

For mutation tools such as:

```text
create_repair_ticket
update_repair_status
add_repair_note
```

the operation must use the same business logic as the UI.

High-impact actions should respect required confirmation/approval behavior.

Never implement:

```text
AI Agent
    ↓
Direct Database Access
```

The AI agent must operate through controlled application operations.

---

# 20. Phase 17 — Auditability

Add auditing for important operations where required.

Priority actions:

```text
Role Changes
Asset Changes
Technician Assignments
Important Repair Changes
Administrative Actions
WebMCP Mutations
```

Conceptual flow:

```text
Operation
   ↓
State Change
   ↓
Audit Record
```

Audit records should identify the responsible user/action without exposing secrets.

---

# 21. Phase 18 — Reusable Component Refinement

After the primary pages work, consolidate genuinely repeated UI patterns.

Potential reusable components:

```text
AppShell
Sidebar
SidebarItem
PageHeader
StatCard
StatusBadge
PriorityBadge
DataTable
SearchInput
FilterBar
PrimaryButton
SecondaryButton
NotificationItem
EmptyState
LoadingState
ErrorState
```

Do not prematurely abstract every small element.

The goal is maintainability without visual drift.

---

# 22. Phase 19 — Responsive Implementation

Review every page on:

```text
Desktop
Tablet
Mobile
```

Check:

* Navigation
* Sidebar
* Headers
* Buttons
* Tables
* Cards
* Forms
* Filters
* Dialogs
* Spacing
* Overflow

The layout may adapt, but the visual language must remain consistent with the approved Stitch designs.

---

# 23. Phase 20 — UX State Completion

Every asynchronous feature must provide appropriate:

```text
Loading
Success
Error
Empty
Disabled
Selected
Unread
Active
```

Examples:

```text
No Assets
No Repairs
No Notifications
No History
No Search Results
```

Do not leave blank UI regions when there is no data.

---

# 24. Phase 21 — Security Review

Before production:

Verify:

```text
[ ] Authentication enforced
[ ] Protected routes enforced
[ ] RBAC enforced
[ ] RLS enabled
[ ] Cross-organization access blocked
[ ] Employee ownership restrictions work
[ ] Technician assignment restrictions work
[ ] Manager/Admin boundaries work
[ ] WebMCP permissions enforced
[ ] Sensitive operations protected
[ ] Service-role key never exposed
[ ] Secrets not committed
```

---

# 25. Phase 22 — Data Integrity Review

Verify:

```text
[ ] Valid repair statuses
[ ] Valid repair transitions
[ ] Valid priorities
[ ] Valid asset statuses
[ ] Valid user roles
[ ] Valid foreign keys
[ ] Repair history preserved
[ ] Notification references valid
[ ] Asset/repair state consistency
[ ] Duplicate/conflicting operations handled
```

---

# 26. Phase 23 — UI Fidelity Review

Compare each implemented page directly against its Stitch source.

Review:

```text
[ ] Layout
[ ] Typography
[ ] Colors
[ ] Spacing
[ ] Borders
[ ] Shadows
[ ] Icons
[ ] Navigation
[ ] Component placement
[ ] Responsive behavior
[ ] Hover state
[ ] Active state
```

Do not accept a page merely because it is “similar.”

The objective is a faithful functional implementation of the approved design.

---

# 27. Phase 24 — Integration Review

Verify that all major paths work across modules.

### Employee → Technician

```text
Report Issue
   ↓
Repair Created
   ↓
Technician Receives Assignment
```

### Technician → Employee

```text
Status Update
   ↓
History
   ↓
Employee Notification
```

### Manager → Technician

```text
Assign Repair
   ↓
Technician Notification
   ↓
Repair Appears in My Repairs
```

### Asset → Repair

```text
Asset
   ↓
Repair
   ↓
History
```

### WebMCP → RepairDesk

```text
AI Agent
   ↓
WebMCP
   ↓
Authorized Operation
   ↓
Real RepairDesk Data
```

---

# 28. Phase 25 — Production Configuration

Prepare:

```text
Supabase Production
        +
Vercel Production
        +
Environment Variables
        +
Authentication Redirects
        +
Edge Functions where required
        +
WebMCP Configuration
```

Verify production URLs and authentication configuration.

Never deploy development secrets.

---

# 29. Phase 26 — Deployment

Recommended deployment flow:

```text
Local Development
      ↓
Application Integration
      ↓
Production Environment Variables
      ↓
Supabase Production
      ↓
Vercel Deployment
      ↓
Authentication Verification
      ↓
WebMCP Verification
```

After deployment, verify the major user journeys manually before final testing.

---

# 30. Phase 27 — TestSprite Validation

TestSprite is the intended primary testing tool for the completed application.

Testing should occur after the major implementation is complete.

Focus on:

```text
Authentication
RBAC
Asset Management
Repair Creation
Repair Assignment
Repair Status Lifecycle
Technician Workflow
Employee Workflow
Notifications
Authorization Boundaries
WebMCP Operations
Responsive Behavior
```

TestSprite testing is a validation step and does not replace the security architecture.

---

# 31. Recommended Implementation Order by Dependency

The following dependency order should be preserved:

```text
Project Setup
    ↓
Database
    ↓
RLS
    ↓
Authentication
    ↓
RBAC
    ↓
Shared Shell
    ↓
Admin / Manager
    ↓
Technician
    ↓
Employee
    ↓
Core Cross-Role Workflow
    ↓
Notifications
    ↓
WebMCP
    ↓
Responsive / UX Polish
    ↓
Deployment
    ↓
TestSprite
```

Do not implement WebMCP first.

The application must first have stable underlying operations that WebMCP can expose.

---

# 32. AI Agent Execution Rules

When an AI coding agent starts implementation:

### Step 1

Read:

```text
rules.md
PRD.md
TRD.md
Architect.md
DESIGN.md
web-app-flow.md
backend-scheema.md
implementation_plan.md
```

### Step 2

Identify the current phase.

### Step 3

Inspect the relevant existing code.

### Step 4

Inspect the relevant Stitch HTML file for the page being implemented.

### Step 5

Implement only the required scope.

### Step 6

Verify dependencies and permissions.

### Step 7

Fix errors before moving forward.

### Step 8

Do not jump ahead to later phases unless explicitly instructed.

---

# 33. What Agents Must Not Do

Agents must not:

```text
Redesign approved Stitch pages.

Replace Supabase with another backend.

Remove authentication.

Bypass RLS.

Rely only on frontend RBAC.

Create a fifth application role.

Give WebMCP privileged access.

Introduce unrelated features.

Perform large unnecessary refactors.

Install unnecessary dependencies.

Replace working components without reason.

Implement WebMCP against fake/mock business logic.

```

---

# 34. Completion Criteria

A phase is complete when:

```text
[ ] Required functionality is implemented.
[ ] Relevant backend operations work.
[ ] Permissions are enforced.
[ ] Existing functionality remains intact.
[ ] Relevant Stitch design is preserved.
[ ] Loading/error/empty states are handled.
[ ] Responsive behavior is acceptable.
[ ] No unrelated features were introduced.
```

Do not mark a phase complete merely because the UI renders.

---

# 35. Definition of Implementation Complete

RepairDesk is considered implementation-complete when:

```text
[ ] Authentication works
[ ] Four roles work correctly
[ ] RBAC works
[ ] RLS protects data
[ ] Assets work
[ ] Repairs work
[ ] Repair lifecycle works
[ ] Technician workflow works
[ ] Employee issue workflow works
[ ] Repair history works
[ ] Notifications work
[ ] Warranty information works
[ ] Admin/Manager operations work
[ ] WebMCP tools work
[ ] WebMCP permissions work
[ ] Sensitive operations are protected
[ ] Approved Stitch UI is implemented
[ ] Responsive layouts work
[ ] Production deployment works
[ ] TestSprite validation is completed
```

---

# 36. Final Implementation Principle

RepairDesk should be built from the foundation upward:

```text
SECURE FOUNDATION
       ↓
REAL DATA
       ↓
REAL BUSINESS OPERATIONS
       ↓
ROLE-SPECIFIC EXPERIENCE
       ↓
CROSS-ROLE WORKFLOW
       ↓
WEBMCP
       ↓
POLISH
       ↓
DEPLOYMENT
       ↓
TESTING
```

### Non-Negotiable Rule

**Do not build the project as a collection of disconnected screens. Build one secure RepairDesk system where every screen, workflow, backend operation, and WebMCP tool operates on the same data, permissions, business rules, and approved UI design.**

```
```
