# RULES.md

## RepairDesk — AI Agent Development Instructions

This file defines the rules and boundaries that AI coding agents must follow while working on the RepairDesk codebase.

The goal is to ensure that AI agents implement features correctly without breaking the approved product requirements, technical architecture, UI design, RBAC, Supabase structure, or WebMCP functionality.

---

## 1. Project Context

RepairDesk is an AI-agent-ready repair operations SaaS for organizations that manage:

- Company equipment/assets
- Employees
- Technicians
- Repair tickets
- Repair status and progress
- Repair history
- Warranty information
- Notifications
- Operational management

The application supports both human users through the web interface and compatible AI agents through WebMCP.

WebMCP is an interaction layer for the application. It must not bypass authentication, authorization, validation, or business rules.

---

## 2. Source of Truth

When making implementation decisions, use the project documentation and existing approved UI code as the primary source of truth.

Priority order:

1. Existing approved application/design implementation
2. `PRD.md`
3. `TRD.md`
4. `app-webflow.md`
5. `designprinciple.md`
6. Other project-specific documentation
7. General engineering assumptions

Do not replace an established project decision with a personal preference or a generic implementation pattern without a clear reason.

When requirements are unclear, inspect the existing code and documentation before introducing new behavior.

Do not invent product features that are not required.

---

## 3. Core Engineering Principles

AI agents must:

- Make the smallest safe change required.
- Preserve existing functionality.
- Reuse existing components, utilities, services, hooks, and patterns whenever possible.
- Avoid unnecessary refactoring.
- Avoid introducing new libraries unless required.
- Keep business logic separate from UI logic.
- Keep security-sensitive logic on trusted server-side infrastructure.
- Validate all user-controlled input.
- Handle loading, error, empty, and success states.
- Maintain responsive behavior.
- Maintain accessibility where practical.
- Keep code readable and maintainable.
- Follow the existing project naming and folder conventions.

Never rewrite working parts of the application simply to make the implementation look different.

---

## 4. Technology Stack

The project is built around:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui where appropriate
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security (RLS)
- Supabase Edge Functions where required
- Supabase Storage/Realtime where required
- WebMCP
- Vercel

Do not replace the core stack without explicit approval.

---

## 5. Authentication

Authentication is handled through Supabase Auth.

Agents must:

- Preserve the existing authentication flow.
- Never remove authentication to simplify development.
- Never expose service-role credentials in frontend code.
- Use the authenticated Supabase session/user when determining access.
- Handle unauthenticated states correctly.
- Preserve existing login/signup behavior.

Authentication and authorization are different concerns.

A logged-in user must still be restricted according to their role and permitted resources.

---

## 6. Roles and RBAC

RepairDesk has exactly four application roles:

```text
ADMIN
MANAGER
TECHNICIAN
EMPLOYEE
```

Do not introduce a fifth application role such as `SYSTEM_ADMIN`.

### ADMIN

Full operational and system-level access.

Can manage:

- Users
- Roles
- Technicians
- Employees
- Assets
- Repairs
- Repair history
- Notifications
- Operational settings
- Organization/system settings
- Security-sensitive system configuration

### MANAGER

Uses the same application/pages as Admin but has restricted authority.

Can manage operational areas such as:

- Employees
- Technicians
- Assets
- Repairs
- Operational settings

Must not perform Admin-only system operations such as:

- Changing system-level authority
- Managing organization ownership
- Changing critical system security controls
- Granting Admin-level authority

### TECHNICIAN

Can:

- View assigned repairs
- Update assigned repair status
- Add repair notes
- Resolve assigned repairs
- View relevant assets
- View warranty information
- View relevant repair history
- View personal notifications
- Manage personal settings

Cannot:

- Manage users
- Manage roles
- Manage system settings
- Manage unrelated repairs
- Perform Admin/Manager operations

### EMPLOYEE

Can:

- View their own assets
- Report asset issues
- View their own repair tickets
- Track repair status
- View the technician assigned to their repair
- View their own notifications
- Manage personal settings

Cannot:

- Manage assets
- Assign technicians
- View other employees' repairs
- Manage users or roles
- Access administrative functionality

---

## 7. RBAC Security Rule

RBAC must never rely only on frontend visibility.

Hiding a button or page is not authorization.

Every sensitive operation must enforce permissions through trusted backend logic and/or Supabase RLS.

The same authorization rules must apply to:

- UI actions
- Supabase queries
- Edge Functions
- WebMCP tools
- Any server-side operation

A user must never gain additional permissions simply by calling an endpoint or WebMCP tool directly.

---

## 8. UI Structure

The application uses a shared application shell wherever appropriate.

Admin and Manager use the same UI structure with role-based restrictions.

Technician and Employee use the same overall application system with role-specific content and permitted actions.

Do not create separate duplicate applications for each role unless explicitly required.

Employee and Technician do not require independent dashboard architectures merely because their available functionality differs.

---

## 9. Approved Pages

### Public

- Landing Page
- Authentication

### Admin / Manager

- Dashboard
- Assets
- Repair History
- Notifications
- Settings

### Technician

- Dashboard
- My Repairs
- Assets
- Repair History
- Notifications
- Settings

### Employee

- Dashboard
- My Issues
- My Assets
- Notifications
- Settings

Use RBAC to control access and available actions within the shared application.

Do not invent additional navigation sections without a requirement.

---

## 10. Repair Lifecycle

The approved repair lifecycle is:

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

Agents must preserve this lifecycle unless the product requirements are explicitly changed.

Repair priorities:

```text
Critical
High
Medium
Low
```

Do not silently introduce additional statuses or change status meanings.

---

## 11. Asset Management

Approved asset statuses:

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

Asset records should support the operational requirements defined in the project documentation, including ownership/assignment, repair relationships, and relevant warranty information.

---

## 12. Repair and History Rules

Repair tickets must retain meaningful operational information such as:

- Reported issue
- Asset
- Reporter
- Assigned technician
- Priority
- Status
- Repair notes
- Resolution information
- Relevant timestamps

Repair history must allow authorized users to understand previous issues and repairs associated with an asset.

Do not expose another employee's private repair information to unauthorized users.

---

## 13. Notifications

Notifications should respect user roles and ownership.

Users should only receive notifications relevant to their permitted activities.

Examples include:

- New repair ticket
- Technician assignment
- Repair status update
- Repair resolution
- Relevant operational alerts

Do not broadcast private or unrelated operational information.

---

## 14. WebMCP

WebMCP is a core differentiating feature of RepairDesk.

It allows compatible AI agents to interact with RepairDesk through structured application tools.

WebMCP must be treated as an interaction layer, not as a replacement for the application backend.

Potential tool capabilities include:

### Asset tools

```text
search_assets
get_asset
get_asset_status
check_warranty
get_asset_repair_history
```

### Repair tools

```text
search_repairs
get_repair
create_repair_ticket
update_repair_status
add_repair_note
get_repair_history
```

### Operations tools

```text
find_available_technicians
get_technician_workload
get_operational_alerts
```

Only implement tools that are actually required by the current product scope.

---

## 15. WebMCP Authorization

Every WebMCP tool must enforce:

1. Authentication
2. User identity
3. Organization/context
4. User role
5. Resource ownership/access
6. Operation-specific permissions
7. Input validation

WebMCP must never provide a privilege escalation path.

For example:

- An Employee cannot use an AI agent to access another employee's repair.
- A Technician cannot use WebMCP to manage users.
- A Manager cannot use WebMCP to perform Admin-only system actions.

The AI agent gets the same effective permissions as the authenticated user.

---

## 16. Sensitive WebMCP Actions

Actions that create, modify, assign, close, or otherwise cause meaningful operational changes must be handled carefully.

Do not bypass required human approval where the product workflow requires it.

Examples include:

- Creating repair tickets where approval is required
- Assigning technicians
- Changing sensitive statuses
- Closing repairs
- Administrative configuration changes

Destructive or high-impact operations should have confirmation/approval mechanisms where required by the product flow.

---

## 17. WebMCP Auditability

WebMCP actions should be auditable where the technical implementation supports it.

Important information may include:

- Authenticated user
- Tool invoked
- Action performed
- Target resource
- Timestamp
- Result/failure

Never use WebMCP as a hidden route around normal application auditing.

---

## 18. Supabase Rules

Supabase is the backend platform.

Agents must:

- Use PostgreSQL as the primary relational database.
- Use Supabase Auth for authentication.
- Use RLS for data access protection.
- Keep sensitive server-side operations away from the browser.
- Use Edge Functions for logic that should not execute directly in the client.
- Avoid exposing the Supabase service role key to the frontend.
- Keep database relationships consistent with the defined data model.

Before changing database structure, inspect the existing schema and documentation.

Do not randomly rename tables, columns, enums, or relationships.

---

## 19. Database Changes

When changing the database:

- Prefer additive and backward-compatible changes.
- Check existing queries and dependencies.
- Update related types/services when required.
- Update RLS policies when data access changes.
- Consider existing records.
- Avoid destructive migrations unless explicitly required.

Never change database structure only to make frontend code easier.

---

## 20. Frontend Rules

Use TypeScript throughout the application.

Prefer:

- Reusable React components
- Typed props
- Shared UI primitives
- Reusable hooks
- Service/API abstractions
- Centralized constants where appropriate

Avoid:

- Large monolithic components
- Duplicated business logic
- Hardcoded user-specific permissions
- Hardcoded backend credentials
- Unnecessary global state
- Uncontrolled direct database access scattered throughout components

---

## 21. Design System

The approved visual direction is:

**Industrial Neo-Brutalist / Industrial Editorial**

Core visual characteristics:

- Warm cream background
- Near-black typography/borders
- Signal orange accents
- Electric yellow accents
- Strong black borders
- Hard offset shadows
- Sharp or minimally rounded corners
- Strong typographic hierarchy
- Structured editorial/grid layout
- Dotted background treatment where specified

Primary colors include:

```text
#F5F0E6
#FEF9EF
#1A1A1A
#000000
#FF4500
#FE5E1E
#D3F000
```

Typography:

- Space Grotesk for headings/structural labels
- Inter for body/interface text
- JetBrains Mono where technical/monospace presentation is required

Typical design characteristics:

```text
2px–3px black borders
4px 4px 0 black-style hard shadows
12-column desktop grid
24px grid gutters
48px desktop outer margins
16px mobile margins
```

Exact values in the approved existing UI/HTML take precedence over generic values listed here.

---

## 22. UI Preservation Rule

The existing Stitch-generated HTML/design implementations are the visual reference.

When implementing functionality into an approved page:

- Preserve layout.
- Preserve typography.
- Preserve spacing.
- Preserve colors.
- Preserve borders.
- Preserve shadows.
- Preserve interaction appearance.
- Preserve responsive behavior.
- Preserve the overall visual hierarchy.

Do not redesign an approved page while implementing backend functionality.

Do not replace the Industrial Neo-Brutalist style with a generic SaaS dashboard.

Avoid:

- Glassmorphism
- Soft floating-card aesthetics
- Excessive gradients
- Soft blurred shadows
- Generic modern SaaS styling

Functional changes must not become visual redesigns unless explicitly requested.

---

## 23. Existing Design Code Is Authoritative

When an approved HTML/design implementation exists for a page, inspect it before modifying that page.

Do not recreate the design from memory.

Match the existing implementation as closely as practical, including:

- Dimensions
- Grid structure
- Component hierarchy
- Typography
- Colors
- Shadow offsets
- Borders
- Icons
- Responsive behavior
- Interaction states

The implementation should connect the existing design to real application data rather than generate a different design.

---

## 24. Responsive Design

The application must work across:

- Desktop
- Tablet
- Mobile

Do not solve mobile issues by breaking desktop layouts.

Preserve the approved design system while adapting:

- Navigation
- Grid columns
- Tables
- Cards
- Forms
- Spacing
- Buttons
- Dialogs
- Overflow behavior

Avoid horizontal scrolling where it is not intentionally required.

---

## 25. Error and Loading States

Every asynchronous feature should account for:

- Loading
- Success
- Empty state
- Error state

Errors should be understandable to the user.

Do not expose internal stack traces, secrets, database credentials, or sensitive implementation details in the UI.

---

## 26. Validation

Validate data at the appropriate boundaries.

Important validation areas include:

- Authentication inputs
- Repair creation
- Repair updates
- Asset information
- Role-sensitive actions
- WebMCP parameters
- Database operations

Never trust user-provided input merely because it originated from the frontend.

---

## 27. Security

Security has higher priority than convenience.

Never:

- Commit secrets
- Expose service-role keys
- Hardcode credentials
- Bypass RLS
- Trust frontend role checks alone
- Allow unauthorized resource access
- Disable authentication to make development easier
- Create hidden privilege escalation paths

Use environment variables for sensitive configuration.

---

## 28. Environment Variables

Sensitive configuration belongs in environment variables.

Do not commit `.env` files containing secrets.

Frontend-exposed variables must only contain values that are intentionally safe for client-side use.

Server-only credentials must remain server-side.

---

## 29. Code Change Strategy

Before changing code:

1. Inspect the relevant files.
2. Understand existing patterns.
3. Identify dependencies.
4. Make the smallest required change.
5. Verify related functionality.
6. Avoid unrelated cleanup.

Do not modify unrelated files merely because they could be improved.

---

## 30. Refactoring

Refactor only when:

- Required for the feature
- Required for correctness
- Required for security
- Required for maintainability of the changed area

Avoid large refactors during feature implementation unless explicitly requested.

A working component should not be rewritten just because another implementation seems cleaner.

---

## 31. Dependency Policy

Do not install a new dependency unless:

- Existing project capabilities are insufficient, and
- The dependency provides a clear benefit, and
- It does not conflict with the approved architecture.

Prefer existing dependencies and native/browser capabilities when practical.

---

## 32. API and Service Layer

Business operations should use a consistent service/data-access approach.

Do not scatter database queries throughout unrelated UI components.

Keep:

- Database operations
- Business rules
- WebMCP operations
- UI presentation

appropriately separated.

---

## 33. Human and AI Interaction Model

RepairDesk serves two types of operators:

### Human users

Interact through the web UI.

### AI agents

Interact through approved WebMCP tools.

Both interaction paths must ultimately respect the same:

- Authentication
- Authorization
- Business rules
- Validation
- Data integrity
- Operational workflows

The AI layer is not a bypass around the application's security model.

---

## 34. Scope Discipline

The MVP focuses on:

- Authentication
- RBAC
- Assets
- Repair tickets
- Technician workflow
- Employee issue reporting
- Repair history
- Notifications
- Warranty visibility
- Core dashboards
- Settings
- WebMCP interaction

Do not add unrelated features unless explicitly requested.

Avoid turning RepairDesk into a generic ERP, helpdesk, or project-management platform.

---

## 35. Out-of-Scope Protection

Do not independently add large features such as:

- Unrequested billing systems
- Complex accounting
- Full procurement systems
- Full HR management
- Unrequested chat/social functionality
- Unrequested analytics platforms
- Arbitrary AI features that do not support RepairDesk operations

Keep the product focused.

---

## 36. Testing

Testing is handled separately from the core architecture.

The project is intended to be tested with **TestSprite** after implementation.

Agents should still write code that is:

- Deterministic where practical
- Validatable
- Error-aware
- Permission-aware
- Easy to test

Do not add a separate testing framework solely because it appears in a generic project template.

Do not remove or weaken functionality merely to make manual testing easier.

---

## 37. Deployment

The intended deployment architecture is:

```text
Frontend → Vercel
Backend/Auth/Database → Supabase
WebMCP → Integrated with the web application
```

Deployment configuration must remain compatible with the approved architecture.

Before deployment-related changes, verify:

- Environment variables
- Supabase configuration
- Authentication redirect configuration
- Edge Function configuration
- Production URLs
- WebMCP availability/configuration

---

## 38. Git Discipline

Keep commits/changes logically scoped.

Do not:

- Rewrite unrelated files
- Remove working functionality without reason
- Commit secrets
- Commit generated junk
- Introduce large unrelated formatting changes

Preserve a clean and understandable repository history.

---

## 39. Documentation Discipline

When implementation changes an established behavior, update the relevant documentation when necessary.

Documentation should remain consistent with the actual implementation.

Do not create duplicate or contradictory requirements.

---

## 40. Conflict Resolution

When requirements appear to conflict:

1. Check the existing approved implementation.
2. Check `PRD.md`.
3. Check `TRD.md`.
4. Check workflow/design documentation.
5. Check surrounding code behavior.
6. Make the least disruptive interpretation.

Do not silently choose a completely new architecture.

When a conflict materially affects security, data integrity, RBAC, or WebMCP behavior, stop and surface the conflict rather than guessing.

---

## 41. Never Break These Rules

The following are hard constraints:

```text
Do not bypass authentication.
Do not bypass RBAC.
Do not bypass Supabase RLS.
Do not expose secrets.
Do not create a fifth application role.
Do not weaken WebMCP authorization.
Do not redesign approved UI during implementation.
Do not replace the approved stack without approval.
Do not add unrelated features.
Do not make large unnecessary refactors.
Do not destroy existing working functionality.
```

---

## 42. Final Agent Behavior

Before considering a change complete, verify:

- The requested functionality works.
- Existing functionality remains intact.
- RBAC is preserved.
- Authentication is preserved.
- Supabase security is preserved.
- WebMCP permissions are preserved where applicable.
- The approved UI/design remains intact.
- Responsive behavior remains intact.
- Loading/error/empty states are handled.
- No secrets are exposed.
- No unnecessary dependencies or refactors were introduced.

### Core Principle

**Build what RepairDesk requires, preserve what already works, and never trade security, product rules, or approved design for implementation convenience.**

```

```
