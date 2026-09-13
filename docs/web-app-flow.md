# web-app-flow.md

# RepairDesk — Web Application Flow

## 1. Purpose

This document defines how users move through the RepairDesk web application.

It describes:

- Public navigation
- Authentication flow
- Role-based entry points
- Screen-to-screen navigation
- Main operational workflows
- Repair lifecycle flow
- Asset-related flows
- Notification flow
- Settings flow
- WebMCP interaction flow
- Permission boundaries
- Success, error, and unauthorized states

This document describes **application flow**, not visual design or database structure.

---

# 2. Core Application Flow

The high-level application flow is:

```text
Landing Page
     ↓
Login / Signup
     ↓
Authentication
     ↓
Role Resolution
     ↓
Role-Specific Application
     ↓
Authorized Operations
```

After authentication, the user enters the same RepairDesk application architecture but receives role-appropriate navigation, content, and actions.

---

# 3. Public Flow

## 3.1 Landing Page

The landing page is the public entry point.

Main navigation includes concepts such as:

```text
Platform
Features
WebMCP
Workflow
Login
Get Started
```

The Stitch landing-page implementation also presents RepairDesk's agent-ready/WebMCP concept and a visual human → agent → RepairDesk workflow.

### Primary actions

```text
Get Started
    ↓
Authentication

Login
    ↓
Authentication

WebMCP / Workflow links
    ↓
Relevant landing-page sections
```

The exact navigation, labels, CTA behavior, and section structure must follow the approved Stitch landing-page HTML.

---

# 4. Authentication Flow

```text
User
  ↓
Landing Page
  ↓
Login / Signup
  ↓
Supabase Authentication
  ↓
Authenticated Session
  ↓
Role Resolution
  ↓
Application
```

## 4.1 Login

```text
Login Page
   ↓
Enter credentials
   ↓
Submit
   ↓
Supabase Auth
   ↓
Success
   ↓
Load authenticated user
   ↓
Resolve role
   ↓
Open authorized application
```

### Failure

```text
Invalid / failed authentication
        ↓
Remain on authentication screen
        ↓
Display user-safe error
        ↓
Allow retry
```

Do not bypass authentication because a user cannot log in.

---

# 5. Role Resolution

After successful authentication:

```text
Authenticated User
        ↓
Determine Application Role
        ↓
┌──────────┬──────────┬─────────────┬───────────┐
│  ADMIN   │ MANAGER  │ TECHNICIAN  │ EMPLOYEE  │
└──────────┴──────────┴─────────────┴───────────┘
        ↓
Role-appropriate application state
```

The application has exactly four roles:

```text
ADMIN
MANAGER
TECHNICIAN
EMPLOYEE
```

Do not create a separate `SYSTEM_ADMIN` application role.

---

# 6. Shared Application Shell

After authentication, users enter the shared RepairDesk application shell.

General structure:

```text
Sidebar
   +
Main Content
   +
User Profile / Logout
```

The sidebar changes according to the user's role.

The overall application architecture remains shared.

---

# 7. Admin / Manager Flow

Admin and Manager use the same core interface.

Navigation:

```text
Dashboard
Assets
Repair History
Notifications
Settings
```

The difference is permission level, not a separate application.

---

# 8. Admin / Manager Dashboard Flow

```text
Login
  ↓
Dashboard
  ↓
Operations Overview
  ↓
View operational metrics
  ↓
Choose required operational area
```

Typical paths:

```text
Dashboard
   ├── Assets
   ├── Repair History
   ├── Notifications
   └── Settings
```

Dashboard actions must be restricted according to Admin/Manager permissions.

---

# 9. Admin / Manager Asset Flow

```text
Dashboard
   ↓
Assets
   ↓
Search / Filter Assets
   ↓
Select Asset
   ↓
View Asset Context
   ├── Status
   ├── Ownership
   ├── Warranty
   └── Repair Context
```

Administrative operations may additionally include:

```text
Assets
   ↓
Add Asset
   ↓
Enter Asset Information
   ↓
Validate
   ↓
Save
   ↓
Asset Appears in Asset Directory
```

Only users with the appropriate permission may create or modify assets.

---

# 10. Admin / Manager Repair Operations Flow

```text
Dashboard
   ↓
Operational Repair Context
   ↓
View Repair
   ↓
Review Asset
   ↓
Review Issue
   ↓
Review Technician Assignment
   ↓
Perform Permitted Management Action
```

Typical management actions may include:

```text
Assign Technician
Update Repair Status
Review Repair History
Review Operational Information
```

Every action must pass authorization checks.

---

# 11. Admin / Manager Repair History Flow

```text
Navigation
   ↓
Repair History
   ↓
Search / Filter
   ↓
Select Repair / Asset
   ↓
Review Historical Information
```

The user should be able to understand:

- What asset was involved
- What issue occurred
- Who handled the repair
- Repair status/history
- Resolution information

Access must remain permission-aware.

---

# 12. Admin / Manager Notification Flow

```text
Navigation
   ↓
Notifications
   ↓
Review Operational Notifications
   ↓
Open Relevant Context
   ↓
Navigate to Related Resource
```

Examples:

```text
New Repair
    ↓
Open notification
    ↓
Open repair

Technician Assignment
    ↓
Open notification
    ↓
Open relevant repair

Important Operational Alert
    ↓
Open notification
    ↓
Review affected resource
```

---

# 13. Admin / Manager Settings Flow

```text
Navigation
   ↓
Settings
   ↓
View available settings
   ↓
Select allowed setting
   ↓
Modify
   ↓
Save
```

Manager settings must be restricted to operational permissions.

Admin may access additional system-level configuration.

Manager must not gain Admin-only authority through the UI or backend.

---

# 14. Technician Flow

Technician navigation:

```text
Dashboard
My Repairs
Assets
Repair History
Notifications
Settings
```

The technician workflow is centered around assigned repair work.

---

# 15. Technician Dashboard Flow

```text
Login
  ↓
Technician Dashboard
  ↓
View repair workload
  ↓
Review:
  - Assigned repairs
  - Critical repairs
  - Repairs in progress
  - Completed work
  ↓
Choose repair
```

The dashboard provides operational context rather than administrative management.

---

# 16. Technician My Repairs Flow

```text
My Repairs
    ↓
View assigned repairs
    ↓
Search / filter if required
    ↓
Select repair
    ↓
Repair details
```

The Stitch design specifically presents an assigned-repair table with information such as:

```text
ID
Asset
Issue
Priority
Status
Due
Action
```

The implementation must preserve that approved structure.

---

# 17. Technician Repair Execution Flow

Core workflow:

```text
Assigned Repair
      ↓
Review Repair
      ↓
Review Asset
      ↓
Review Warranty
      ↓
Review Repair History
      ↓
Diagnose
      ↓
Add Repair Notes
      ↓
Update Status
      ↓
Perform Repair
      ↓
Resolve
```

Repair status lifecycle:

```text
Open
  ↓
Assigned
  ↓
Diagnosing
  ↓
In Repair
  ↓
Resolved
  ↓
Closed
```

The technician may only perform status changes allowed by the role and workflow.

---

# 18. Technician Asset Investigation Flow

```text
My Repairs
    ↓
Open Repair
    ↓
Open Related Asset
    ↓
Review:
  - Asset identity
  - Current status
  - Warranty
  - Previous repairs
    ↓
Return to Repair
```

The Assets page is intended to help technicians inspect equipment and repair context.

---

# 19. Technician Repair History Flow

```text
Repair History
    ↓
Search / Filter
    ↓
Select relevant history
    ↓
Review previous repair information
    ↓
Return to current repair / asset context
```

Technicians should only see information permitted for their role.

---

# 20. Technician Notification Flow

```text
Notification
    ↓
Technician receives relevant update
    ↓
Open notification
    ↓
Review related repair / asset
    ↓
Take permitted action
```

Relevant notifications may include:

```text
New repair assignment
Repair updates
Important repair alerts
Asset-related updates
```

The Stitch notification design presents notifications around repairs, assigned assets, and work.

---

# 21. Technician Settings Flow

```text
Settings
    ↓
Personal settings
    ↓
Modify allowed preferences
    ↓
Save
```

Technicians must not access administrative system configuration.

---

# 22. Employee Flow

Employee navigation:

```text
Dashboard
My Issues
My Assets
Notifications
Settings
```

The Employee experience is focused on the employee's own equipment and submitted repair issues.

---

# 23. Employee Dashboard Flow

```text
Login
  ↓
Employee Dashboard
  ↓
View personal repair/asset context
  ↓
Choose:
  - My Issues
  - My Assets
  - Notifications
```

The employee dashboard should remain simple and personal rather than operationally administrative.

---

# 24. Employee My Assets Flow

```text
My Assets
    ↓
View assigned assets
    ↓
Search / Filter
    ↓
Select asset
    ↓
Review:
  - Asset information
  - Current status
  - Warranty
  - Repair context
```

The Stitch implementation explicitly positions this page around equipment currently assigned to the employee and live status/warranty overview.

---

# 25. Employee Report Issue Flow

This is one of the primary employee workflows.

```text
My Assets / My Issues
        ↓
REPORT AN ISSUE
        ↓
Select relevant asset
        ↓
Describe issue
        ↓
Provide required information
        ↓
Submit
        ↓
Validation
        ↓
Create Repair Ticket
        ↓
Issue appears in My Issues
```

The report action is exposed prominently on the Employee pages.

---

# 26. Employee My Issues Flow

```text
My Issues
    ↓
View submitted repair requests
    ↓
Search / Filter
    ↓
Select issue
    ↓
Review:
  - Ticket ID
  - Asset
  - Issue
  - Priority
  - Status
  - Technician
  - Date
```

The Stitch design specifically presents the user's repair issues with status filtering and technician information.

---

# 27. Employee Repair Tracking Flow

```text
Submitted Issue
      ↓
Open
      ↓
Assigned
      ↓
Diagnosing
      ↓
In Repair
      ↓
Resolved
      ↓
Closed
```

The employee can track progress but cannot perform technician or administrative actions.

The employee may see the technician assigned to their own repair where permitted.

---

# 28. Employee Notification Flow

```text
Repair / Asset Event
       ↓
Relevant Notification
       ↓
Employee Notifications
       ↓
Open Notification
       ↓
Review Related Issue / Asset
```

Examples:

```text
Repair submitted
Technician assigned
Status updated
Repair resolved
```

Employees must not receive unrelated organization-wide operational information.

---

# 29. Employee Settings Flow

```text
Settings
    ↓
Personal settings
    ↓
Modify permitted preferences
    ↓
Save
```

No administrative controls are exposed.

---

# 30. Core Repair Workflow

The complete operational repair flow is:

```text
EMPLOYEE
   │
   │ Reports issue
   ▼
Repair Ticket Created
   │
   ▼
OPEN
   │
   ▼
ADMIN / MANAGER
Assigns Technician
   │
   ▼
ASSIGNED
   │
   ▼
TECHNICIAN
Reviews Asset / Warranty / History
   │
   ▼
DIAGNOSING
   │
   ▼
IN REPAIR
   │
   ▼
Technician Adds Resolution
   │
   ▼
RESOLVED
   │
   ▼
CLOSED
   │
   ▼
EMPLOYEE
Receives Final Update
```

---

# 31. Repair Creation Flow

A repair may originate from an employee workflow or another permitted operational workflow.

General sequence:

```text
Report Issue
    ↓
Select Asset
    ↓
Enter Issue
    ↓
Set/Determine Priority
    ↓
Validate
    ↓
Create Repair
    ↓
Open
    ↓
Notify Relevant Users
```

AI/WebMCP-generated repairs must follow the same rules.

---

# 32. Technician Assignment Flow

```text
Repair
   ↓
Assign Technician
   ↓
Check permission
   ↓
Validate technician availability / eligibility
   ↓
Assign
   ↓
Repair becomes ASSIGNED
   ↓
Notify technician
   ↓
Notify employee where applicable
```

Only authorized users or approved workflows may assign technicians.

---

# 33. Repair Status Update Flow

```text
Open Repair
    ↓
Request Status Change
    ↓
Authorization Check
    ↓
Transition Validation
    ↓
Persist New Status
    ↓
Create History
    ↓
Generate Relevant Notification
```

Invalid transitions must be rejected.

---

# 34. Repair Resolution Flow

```text
Technician
   ↓
Repair in progress
   ↓
Add notes / resolution information
   ↓
Mark Resolved
   ↓
Notify relevant user
   ↓
Repair may progress to Closed
```

The exact transition rules must follow the backend business rules defined in `TRD.md`.

---

# 35. Asset-to-Repair Flow

```text
Asset
   ↓
Issue Reported
   ↓
Repair Created
   ↓
Asset becomes relevant to repair
   ↓
Repair work occurs
   ↓
Repair resolved
   ↓
Asset returns to appropriate operational state
```

Asset and repair state must remain consistent.

---

# 36. Warranty Flow

```text
Open Asset
   ↓
Check Warranty
   ↓
Warranty State
   ├── Active
   ├── Expiring Soon
   └── Expired
```

Warranty information should be visible in appropriate asset/repair contexts.

Warranty state may influence operational decisions, but the exact business rule must come from the approved product requirements.

---

# 37. Notification Event Flow

General system pattern:

```text
System Event
    ↓
Determine affected resource
    ↓
Determine affected users
    ↓
Check permissions / relevance
    ↓
Create Notification
    ↓
Deliver to relevant user
    ↓
User opens notification
    ↓
Navigate to related context
```

Do not broadcast every event to every user.

---

# 38. Unauthorized Access Flow

When a user attempts an unauthorized operation:

```text
User Action
    ↓
Authorization Check
    ↓
Denied
    ↓
No state change
    ↓
User-safe error / access message
```

Frontend hiding is not sufficient.

The backend/security layer must also reject unauthorized access.

---

# 39. Unauthenticated Access Flow

```text
Protected Route
    ↓
No valid session
    ↓
Redirect to Authentication
    ↓
Login
    ↓
Successful authentication
    ↓
Return to authorized application
```

Protected application data must never be exposed to unauthenticated users.

---

# 40. Loading State Flow

For asynchronous operations:

```text
User Action
    ↓
Loading State
    ↓
Request
    ↓
Success / Empty / Error
```

The interface should prevent confusing duplicate actions while an operation is processing.

---

# 41. Error Flow

```text
User Action
    ↓
Validation / Request
    ↓
Failure
    ↓
User-safe error message
    ↓
Keep application stable
    ↓
Allow retry where appropriate
```

Errors must not expose:

- Database internals
- Stack traces
- Secrets
- Private information

---

# 42. Empty State Flow

When a page contains no records:

```text
Page
  ↓
No matching data
  ↓
Clear empty state
  ↓
Relevant next action where applicable
```

Examples:

```text
No assigned repairs
No assets
No notifications
No repair history
No submitted issues
```

Do not present empty screens with no explanation.

---

# 43. Search / Filter Flow

Common page pattern:

```text
Open Module
   ↓
Search / Filter
   ↓
Update displayed records
   ↓
Select record
   ↓
Open relevant context
```

This pattern is used across areas such as:

```text
Assets
Repair History
My Issues
My Repairs
```

---

# 44. WebMCP Flow

WebMCP provides an additional way for compatible AI agents to interact with RepairDesk.

Core flow:

```text
User Intent
    ↓
AI Agent
    ↓
Discover / Select WebMCP Tool
    ↓
Invoke Tool
    ↓
Authentication Context
    ↓
Permission Check
    ↓
Input Validation
    ↓
Business Operation
    ↓
Database / Application State
    ↓
Result
    ↓
AI Agent
```

WebMCP must not bypass the normal application security model.

---

# 45. WebMCP Read Flow

Example:

```text
AI Agent
   ↓
search_assets
   ↓
Permission Check
   ↓
Search Authorized Assets
   ↓
Return Results
```

Another example:

```text
AI Agent
   ↓
get_asset_repair_history
   ↓
Verify Asset Access
   ↓
Retrieve Authorized History
   ↓
Return Result
```

---

# 46. WebMCP Repair Action Flow

Example:

```text
AI Agent
   ↓
create_repair_ticket
   ↓
Verify User Identity
   ↓
Verify Asset Access
   ↓
Validate Input
   ↓
Apply Business Rules
   ↓
Create Repair
   ↓
Generate History / Notifications
   ↓
Return Result
```

The AI agent must never receive unrestricted database access.

---

# 47. WebMCP Status Update Flow

```text
AI Agent
   ↓
update_repair_status
   ↓
Identify authenticated user
   ↓
Verify repair access
   ↓
Verify allowed role/action
   ↓
Validate status transition
   ↓
Update repair
   ↓
Create history
   ↓
Trigger relevant notifications
   ↓
Return result
```

The result must reflect the actual server-side operation.

---

# 48. WebMCP Permission Failure

```text
AI Agent
    ↓
Tool Invocation
    ↓
Authorization Check
    ↓
DENIED
    ↓
No database mutation
    ↓
Structured failure result
```

An AI agent must never gain permissions beyond those available to the authenticated user/context.

---

# 49. Human Approval Flow for Sensitive Actions

For actions requiring human confirmation:

```text
AI Agent
    ↓
Requests Sensitive Operation
    ↓
Permission Gate
    ↓
Human Confirmation / Approval
    ↓
Approved
    ↓
Execute Operation
```

Examples may include:

```text
Technician assignment
Important status changes
Closing repairs
Administrative configuration
Other high-impact operations
```

Where the product requires approval, WebMCP must respect that approval step.

---

# 50. Human + AI Operational Model

RepairDesk supports two interaction paths:

```text
                 ┌── Human User ──→ Web UI
Intent ──────────┤
                 └── AI Agent ────→ WebMCP

                              ↓
                     Same application rules
                              ↓
                    Same authorization model
                              ↓
                       Same core data
```

The AI agent is an additional interface to RepairDesk, not a privileged backend user.

---

# 51. Global Navigation Rules

Navigation must follow role permissions.

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

Users must not be able to reach restricted modules simply by manually entering a route.

---

# 52. Cross-Module Navigation

Important contextual links should preserve user workflow.

Examples:

```text
Asset
  ↓
Related Repairs
  ↓
Repair Details

Repair
  ↓
Related Asset
  ↓
Asset Details

Notification
  ↓
Related Repair / Asset
  ↓
Relevant Detail Page
```

The user should not need to restart a workflow merely to inspect related operational context.

---

# 53. Session / Logout Flow

```text
Authenticated User
     ↓
Logout
     ↓
Supabase Session Ended
     ↓
Protected state cleared
     ↓
Return to Authentication / Public Entry
```

After logout, previously protected application data must not remain accessible through the application without re-authentication.

---

# 54. Mobile Flow

The same business workflows must remain available on mobile.

The layout may change, but the core flow must not.

Example:

```text
Desktop Sidebar
      ↓
Mobile Navigation
      ↓
Same Authorized Module
      ↓
Same Workflow
```

Responsive behavior must follow the approved Stitch layouts.

---

# 55. Flow Integrity Rules

The following must always remain true:

```text
Authentication precedes protected operations.

Role resolution precedes role-sensitive operations.

Authorization precedes sensitive mutations.

Repair status changes follow the approved lifecycle.

Employee access is limited to their own operational context.

Technician access is centered on assigned work.

Manager access remains below Admin authority.

WebMCP follows the same authorization and business rules.

Notifications respect user relevance and permissions.

Logout invalidates the authenticated application context.
```

---

# 56. Implementation Guidance

When implementing a flow:

1. Identify the relevant page from the approved Stitch files.
2. Follow the existing page structure.
3. Connect the UI action to the appropriate application operation.
4. Validate the user's permissions.
5. Execute the backend/data operation.
6. Update the UI state.
7. Handle loading/error/empty/success states.
8. Trigger related navigation or notifications where required.

Do not redesign the page while implementing the flow.

---

# 57. Relationship With Other Documents

This document works alongside the other project documents:

```text
PRD.md
    → What the product must do

TRD.md
    → Technical implementation details

Architect.md
    → System architecture and boundaries

DESIGN.md
    → Design-system guidance

rules.md
    → AI coding-agent rules

web-app-flow.md
    → User and application navigation/workflows

backend-schema.md
    → Database/backend structure

implementation-plan.md
    → Development order and execution phases
```

---

# 58. Final Principle

RepairDesk should provide a clear operational flow:

```text
Employee reports
      ↓
Repair enters workflow
      ↓
Manager/Admin manages
      ↓
Technician executes
      ↓
System records history
      ↓
Relevant users receive updates
      ↓
Repair is resolved and closed
```

And through WebMCP:

```text
AI Agent
    ↓
Structured Tool
    ↓
Authenticated + Authorized RepairDesk Context
    ↓
Real Operation
    ↓
Real Result
```

### Non-Negotiable Rule

**Every user flow and every AI-agent flow must lead back to the same secure RepairDesk application rules, data, permissions, and operational lifecycle.**

```

```
