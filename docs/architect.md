# Architect.md

# RepairDesk — System Architecture

## 1. Purpose

This document defines the high-level system architecture of RepairDesk.

It explains:

- Major system components
- Responsibilities and boundaries
- Data flow
- Authentication and authorization
- Role-based access
- WebMCP integration
- Backend architecture
- Frontend architecture
- Security boundaries
- Deployment structure
- Architectural principles

This document describes **how the system is organized**.

Detailed product requirements belong in `PRD.md`, technical implementation details belong in `TRD.md`, AI-agent rules belong in `rules.md`, and visual implementation guidance belongs in `DESIGN.md`.

---

# 2. System Overview

RepairDesk is a web-based repair operations platform designed for organizations that manage company equipment, employees, technicians, repairs, warranties, and repair history.

The system supports two interaction channels:

```text
Human Users
    ↓
RepairDesk Web UI
    ↓
Application Services
    ↓
Supabase Backend
```

and:

```text
Compatible AI Agents
    ↓
WebMCP Tools
    ↓
RepairDesk Application Services
    ↓
Supabase Backend
```

Both channels must ultimately follow the same authentication, authorization, validation, and business rules.

---

# 3. High-Level Architecture

```text
                    ┌──────────────────────┐
                    │      HUMAN USERS     │
                    │ Admin / Manager      │
                    │ Technician / Employee│
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    React Frontend    │
                    │   Vite + TypeScript  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Application Services │
                    │ Auth / RBAC / Logic  │
                    └──────────┬───────────┘
                               │
                               │
          ┌────────────────────┴────────────────────┐
          │                                         │
          ▼                                         ▼
┌──────────────────────┐                 ┌──────────────────────┐
│   WebMCP Interface   │                 │   Supabase Backend   │
│ AI-agent operations  │                 │ Auth / DB / RLS /    │
│                     │                 │ Edge Functions etc.  │
└──────────┬───────────┘                 └──────────┬───────────┘
           │                                        │
           └────────────────┬───────────────────────┘
                            ▼
                   ┌───────────────────┐
                   │ PostgreSQL / Data │
                   └───────────────────┘
```

WebMCP is an interaction layer and must not become an alternative security boundary.

---

# 4. Architectural Principles

The system must follow these principles:

### 4.1 Security First

Authentication, authorization, RLS, and server-side validation must protect every sensitive operation.

### 4.2 Single Business Logic

The same business rules should apply whether an action originates from:

- Web UI
- WebMCP
- Backend service
- Edge Function

### 4.3 Least Privilege

Users and AI agents receive only the permissions required for their role and operation.

### 4.4 Separation of Concerns

Keep these responsibilities separated:

```text
Presentation
    ↓
Application / Business Logic
    ↓
Data Access
    ↓
Database
```

### 4.5 Shared Application

Different roles use the same underlying application architecture.

Role differences are primarily handled through authorization and role-specific content rather than separate applications.

### 4.6 Preserve Approved UI

The existing Stitch-generated screens define the approved visual implementation.

Architecture decisions must not unnecessarily force a redesign.

---

# 5. Frontend Architecture

The frontend is built using:

```text
React
TypeScript
Vite
Tailwind CSS
shadcn/ui where appropriate
```

The frontend is responsible for:

- Rendering the interface
- Handling user interactions
- Managing client-side state
- Displaying backend data
- Providing navigation
- Displaying role-aware actions
- Calling application services
- Presenting loading/error/empty states

The frontend must not be treated as a trusted security boundary.

---

# 6. Application Shell

Authenticated users operate inside a shared application shell containing:

- Sidebar/navigation
- Main content area
- User profile area
- Logout control
- Role-aware navigation

The same structural architecture is reused across roles.

Role-specific differences should be implemented through permissions and page content.

---

# 7. Role Architecture

RepairDesk has exactly four roles:

```text
ADMIN
MANAGER
TECHNICIAN
EMPLOYEE
```

There is no separate `SYSTEM_ADMIN` application role.

### Permission Model

```text
ADMIN
  ↓
Full system + operational control

MANAGER
  ↓
Operational management
(no critical system authority)

TECHNICIAN
  ↓
Assigned repair operations

EMPLOYEE
  ↓
Own assets + own issues + own notifications
```

Authorization must be enforced at the backend/data layer, not only through frontend navigation.

---

# 8. Authentication Architecture

Supabase Auth provides authentication.

General flow:

```text
User
  ↓
Login / Signup
  ↓
Supabase Auth
  ↓
Authenticated Session
  ↓
Application
  ↓
Role Resolution
  ↓
Authorized UI + Data Access
```

The authenticated session establishes user identity.

The user's role determines what the user is allowed to do.

Authentication alone does not grant operational access.

---

# 9. Authorization Architecture

Authorization operates at multiple levels.

```text
User Identity
      ↓
Role
      ↓
Organization / Context
      ↓
Resource Ownership / Access
      ↓
Operation Permission
```

Example:

```text
Employee
  ↓
Own Asset
  ↓
Own Repair
  ↓
Allowed

Employee
  ↓
Another Employee's Repair
  ↓
Denied
```

Backend authorization and Supabase RLS are mandatory protections.

Frontend checks are only a UX layer.

---

# 10. Backend Architecture

Supabase provides the primary backend platform.

Core services include:

```text
Supabase Auth
Supabase PostgreSQL
Supabase Row Level Security
Supabase Edge Functions
Supabase Storage where required
Supabase Realtime where required
```

The backend is responsible for:

- Persistent data
- Authentication
- Authorization enforcement
- Business operations
- Data validation
- Sensitive server-side logic
- Event/notification processing where required
- WebMCP-backed operations

---

# 11. Database Architecture

PostgreSQL is the system's primary persistent data store.

Core conceptual entities include:

```text
User
Role
Asset
Repair
Repair Note
Repair History
Notification
Warranty Information
Audit Log
```

Relationships must preserve the operational model:

```text
User
 ├── owns/uses assets
 ├── reports repairs
 ├── receives notifications
 └── performs permitted operations

Asset
 ├── belongs to/assigned to user
 ├── has warranty context
 └── has repair history

Repair
 ├── belongs to asset
 ├── reported by user
 ├── assigned to technician
 ├── has status/priority
 └── produces repair history
```

The exact schema is defined in `TRD.md`.

---

# 12. Data Access Architecture

Frontend components should not contain scattered business logic or uncontrolled database operations.

Recommended flow:

```text
React Component
      ↓
Hook / Service
      ↓
Application Operation
      ↓
Supabase
      ↓
PostgreSQL + RLS
```

Use reusable service/data-access patterns for common operations.

---

# 13. Repair Domain Architecture

The Repair domain is one of the core business domains.

A repair follows:

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

Priority:

```text
Critical
High
Medium
Low
```

The architecture must preserve state consistency.

For example:

```text
Repair Status Change
        ↓
Validate Permission
        ↓
Validate Transition
        ↓
Persist Change
        ↓
Create History/Event
        ↓
Trigger Relevant Notification
```

---

# 14. Asset Domain Architecture

Asset management provides operational context for repairs.

Asset states:

```text
Active
In Repair
Retired
```

Warranty states:

```text
Active
Expiring Soon
Expired
```

An asset may have multiple historical repairs.

Repair operations should be able to retrieve relevant asset context and history.

---

# 15. Notification Architecture

Notifications are generated from meaningful system events.

Example:

```text
Repair Created
      ↓
Relevant Notification
```

or:

```text
Technician Assigned
      ↓
Technician Notification
      +
Employee Notification where applicable
```

Notifications must remain role- and resource-aware.

Users must not receive unrelated private operational information.

---

# 16. WebMCP Architecture

WebMCP provides structured tools through which compatible AI agents can interact with RepairDesk.

Conceptually:

```text
AI Agent
   ↓
WebMCP Tool
   ↓
Authentication Context
   ↓
Authorization Check
   ↓
Business Validation
   ↓
Application Operation
   ↓
Supabase
```

The AI agent does not directly receive unrestricted database access.

---

# 17. WebMCP Tool Categories

Potential tools include:

### Asset

```text
search_assets
get_asset
get_asset_status
check_warranty
get_asset_repair_history
```

### Repair

```text
search_repairs
get_repair
create_repair_ticket
update_repair_status
add_repair_note
get_repair_history
```

### Operations

```text
find_available_technicians
get_technician_workload
get_operational_alerts
```

Only required tools should be implemented.

---

# 18. WebMCP Security Boundary

WebMCP must never bypass:

- Authentication
- RBAC
- Supabase RLS
- Validation
- Business rules
- Ownership restrictions

The effective permission model is:

```text
Authenticated Human User
        +
Their Role
        +
Their Resource Access
        ↓
Allowed WebMCP Operations
```

The AI agent operates on behalf of the authenticated user; it does not become an administrator.

---

# 19. Sensitive Operations

High-impact actions should respect the application's approval/confirmation requirements.

Examples:

```text
Create Repair
Assign Technician
Update Important Status
Close Repair
Administrative Changes
```

Where human confirmation is required, WebMCP must not silently bypass it.

---

# 20. WebMCP Auditability

WebMCP executions should be auditable where applicable.

Useful audit information includes:

```text
User
Tool
Action
Resource
Timestamp
Result
Failure Reason
```

This provides operational traceability for AI-assisted actions.

---

# 21. AI-Agent Interaction Model

RepairDesk is not designed around a chatbot architecture.

The intended interaction model is:

```text
Natural User Intent
        ↓
AI Agent
        ↓
WebMCP Tool Discovery
        ↓
Structured Tool Call
        ↓
RepairDesk Authorization
        ↓
RepairDesk Operation
        ↓
Result
```

The AI agent should use tools to perform actual application operations rather than receiving privileged hidden access.

---

# 22. Human + Agent Responsibility

### Humans

Responsible for:

- Decisions
- Approval where required
- Reviewing important actions
- Operational ownership

### AI Agents

Responsible for:

- Finding information
- Executing permitted repetitive operations
- Updating permitted records
- Assisting operational workflows

The system must preserve human control over sensitive actions.

---

# 23. Security Architecture

Security protections exist at multiple layers:

```text
Frontend
  ↓
Authentication
  ↓
Application Authorization
  ↓
Supabase RLS
  ↓
Database
```

Sensitive server-side operations may additionally use:

```text
Edge Function
  ↓
Validated Operation
  ↓
Database
```

Never expose:

- Supabase service-role credentials
- Private API keys
- Server-side secrets
- Sensitive internal configuration

to the public frontend.

---

# 24. RLS Architecture

Supabase Row Level Security is a core database security boundary.

RLS should restrict records according to:

- User identity
- Role
- Ownership
- Organizational scope
- Permitted operation

Example concept:

```text
Employee
→ own assets
→ own repairs
→ own notifications

Technician
→ assigned repairs
→ relevant assets/history

Manager
→ operational organization data

Admin
→ authorized system/operational data
```

Exact policies belong in `TRD.md`.

---

# 25. Error Boundary Architecture

Errors should remain isolated between layers.

```text
Database / Service Error
        ↓
Application Error Handling
        ↓
User-safe Message
```

Do not expose internal implementation details to users.

Errors should not reveal:

- SQL details
- Internal stack traces
- Secrets
- Private data

---

# 26. State and Data Consistency

Operational data must remain consistent across:

- Asset state
- Repair state
- Technician assignment
- Repair history
- Notifications

An operation that changes important operational state should update all necessary dependent data through a controlled application operation.

Avoid performing partial state changes from unrelated UI components.

---

# 27. Deployment Architecture

Production deployment:

```text
                 Internet
                    │
                    ▼
             ┌─────────────┐
             │   Vercel    │
             │ React/Vite  │
             └──────┬──────┘
                    │
                    ▼
             ┌─────────────┐
             │  Supabase   │
             ├─────────────┤
             │ Auth        │
             │ PostgreSQL  │
             │ RLS         │
             │ Functions   │
             │ Storage     │
             │ Realtime    │
             └─────────────┘

             WebMCP
                │
                ▼
          RepairDesk App
```

---

# 28. Environment Architecture

Development and production environments must use environment-specific configuration.

Sensitive configuration must be stored through environment variables.

Do not commit secrets to Git.

Frontend variables must contain only intentionally public values.

Server-only credentials must remain server-side.

---

# 29. Architectural Boundaries

The following boundaries must remain clear:

```text
UI
  ≠
Business Logic

Business Logic
  ≠
Database

Frontend Authorization
  ≠
Security Enforcement

WebMCP
  ≠
Privileged Backend Access
```

Each layer has a specific responsibility.

---

# 30. Shared vs Role-Specific Architecture

RepairDesk should use shared infrastructure for all roles.

```text
                  Shared Application
                         │
          ┌──────────────┼──────────────┐
          │              │              │
        Admin         Manager       Technician
                                       │
                                    Employee
```

The difference is primarily:

```text
Permissions
+
Visible Content
+
Allowed Operations
```

Do not build four independent application architectures.

---

# 31. Navigation Architecture

Role-aware navigation determines what is visible.

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

Navigation visibility does not replace backend authorization.

---

# 32. Architectural Handling of Stitch Designs

Stitch-generated HTML files are the visual source of truth for approved screens.

Architecture should support converting them into:

```text
Stitch HTML
      ↓
React Component Structure
      ↓
Reusable Components
      ↓
Real Application Data
      ↓
Supabase-backed UI
```

Do not create architecture that requires redesigning approved screens.

Detailed visual rules are maintained separately in `DESIGN.md`.

---

# 33. Observability and Auditing

Important operational actions should be traceable where appropriate.

Especially consider auditing:

- Administrative changes
- Repair status changes
- Technician assignments
- Important asset changes
- WebMCP actions

The architecture should make these operations attributable to a user or authenticated execution context.

---

# 34. Scalability Approach

RepairDesk should scale primarily by keeping responsibilities separated.

The initial architecture does not require microservices.

Preferred MVP architecture:

```text
React Application
        +
Supabase Backend
        +
WebMCP
```

Do not introduce distributed services, message brokers, Kubernetes, or microservice infrastructure unless the product actually requires them.

The architecture should remain simple enough for rapid development and reliable deployment.

---

# 35. Reliability Principles

Important operations should be designed to avoid:

- Duplicate repair creation
- Invalid repair transitions
- Unauthorized updates
- Partial writes
- Conflicting technician assignments
- Inconsistent asset/repair states

Where necessary, use appropriate backend validation and transactional database behavior.

---

# 36. Integration Principles

External integrations must be isolated behind clear boundaries.

For example:

```text
Frontend
   ↓
Application Service
   ↓
Integration
   ↓
External System
```

Do not tightly couple UI components directly to external services.

WebMCP should similarly remain an interaction interface rather than embedding business rules directly inside individual UI components.

---

# 37. Architectural Anti-Patterns

Do not introduce:

### Frontend-only authorization

```text
if (user.role === "ADMIN")
```

as the only security mechanism.

### Direct privileged database access

Frontend code must never use a service-role credential.

### Separate role-specific applications

Do not duplicate the whole application for each role.

### WebMCP privilege escalation

An AI agent must not receive more authority than the authenticated user.

### Business logic inside UI components

Critical rules should not be scattered across buttons and pages.

### Unnecessary microservices

Do not over-engineer the MVP.

### UI redesign during implementation

Do not change approved Stitch designs without an explicit design decision.

---

# 38. Architectural Decision Summary

The current architecture intentionally chooses:

```text
React + TypeScript
        ↓
Vite
        ↓
Supabase
        ↓
PostgreSQL + RLS
        ↓
Vercel
        +
WebMCP
```

with:

```text
Shared application
+
Role-based authorization
+
Server/data-layer security
+
Agent-accessible structured tools
```

This provides a focused architecture appropriate for the RepairDesk MVP.

---

# 39. Relationship Between Project Documentation

Each project document has a specific responsibility:

```text
PRD.md
"What are we building?"

TRD.md
"How will the technical implementation work?"

Architect.md
"How are the major system components and boundaries organized?"

DESIGN.md
"How should the approved UI/design be interpreted and preserved?"

rules.md
"What rules must AI coding agents follow?"

app-webflow.md
"How does the user/system flow through the application?"

implementation_plan.md
"In what order should the system be implemented?"
```

These documents should complement each other rather than duplicate each other.

---

# 40. Final Architecture Principle

RepairDesk should remain a **secure, role-aware, data-driven repair operations platform with WebMCP as an agent interaction layer**.

The core architecture is:

```text
Human / AI Agent
       ↓
Authenticated Context
       ↓
Role + Permission Check
       ↓
Application Operation
       ↓
Supabase / PostgreSQL
       ↓
Validated Result
       ↓
User / Agent
```

### Non-Negotiable Architectural Rule

**No interaction channel — human UI or AI agent — may bypass the same security, authorization, validation, and business rules that protect the core RepairDesk system.**

```

```
