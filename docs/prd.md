# PRD.md — RepairDesk

## 1. Product Overview

**Product Name:** RepairDesk  
**Product Type:** AI-agent-ready repair operations platform  
**Primary Differentiator:** Native WebMCP support for AI-agent interaction with repair workflows.

RepairDesk is a centralized repair-operations platform for organizations that manage company equipment, repair tickets, technicians, and repair history.

The platform allows organizations to manage the complete repair lifecycle while exposing selected operations through WebMCP so compatible AI agents can interact with the system using structured tools.

The product is designed around three principles:

- Humans manage and supervise operations.
- Technicians execute repair work.
- AI agents can perform supported operational tasks through WebMCP while respecting application permissions.

---

## 2. Problem Statement

Traditional equipment-repair operations are often handled through manual navigation:

1. An employee discovers an equipment problem.
2. The employee reports the issue.
3. A manager or repair team reviews the request.
4. A technician is assigned.
5. The technician investigates the asset and its previous repair history.
6. The repair is completed and the ticket is updated.
7. Relevant users receive notifications.

This workflow creates unnecessary manual effort, especially when users need to search assets, verify warranty information, inspect repair history, create tickets, or retrieve operational information.

RepairDesk centralizes these workflows and makes important operations accessible to both humans and AI agents.

---

## 3. Product Vision

Build a professional repair-operations system where:

- Every asset has a traceable operational history.
- Every repair is represented by a structured ticket.
- Employees can report and track problems easily.
- Technicians have the information required to diagnose and resolve repairs.
- Admins and Managers can control the complete operation.
- AI agents can interact with supported RepairDesk functionality through WebMCP.

---

## 4. Target Users

### 4.1 Admin

Organization-level operational and system administrator.

Primary responsibilities:

- Manage assets
- Manage users
- Manage technicians
- Manage employees
- Manage repair operations
- Manage organization/system settings
- Monitor operational activity
- Review repair history and asset information
- Control permissions and roles

### 4.2 Manager

Operational manager responsible for repair operations.

Primary responsibilities:

- Manage assets
- Manage repair tickets
- Manage technicians
- Manage employees
- Review repair history
- Monitor operational activity
- Manage operational settings

Managers do not receive unrestricted system-level controls reserved for Admin.

### 4.3 Technician

Repair execution role.

Primary responsibilities:

- Work on assigned repairs
- View relevant assets
- Inspect repair history
- Update assigned repair progress
- Add repair notes
- Resolve assigned repairs
- Review warranty and failure history

Technicians do not manage users, roles, organization settings, or asset administration.

### 4.4 Employee

End user of company equipment.

Primary responsibilities:

- View assigned assets
- Report equipment problems
- Track submitted repair requests
- See repair status
- See the technician assigned to their own repair
- Receive notifications

Employees cannot manage assets, users, technicians, roles, or organization settings.

---

## 5. Roles and Permission Model

RepairDesk uses role-based access control.

| Capability               | Admin                 | Manager               | Technician            | Employee                     |
| ------------------------ | --------------------- | --------------------- | --------------------- | ---------------------------- |
| View dashboard           | Yes                   | Yes                   | Yes                   | Yes                          |
| View assets              | All                   | All                   | Operational/relevant  | Own assigned assets          |
| Add assets               | Yes                   | Yes                   | No                    | No                           |
| Edit assets              | Yes                   | Yes                   | No                    | No                           |
| Delete/retire assets     | Yes                   | Yes                   | No                    | No                           |
| View repair tickets      | All                   | All                   | Assigned/relevant     | Own tickets                  |
| Create repair ticket     | Yes                   | Yes                   | Yes                   | Yes                          |
| Assign technicians       | Yes                   | Yes                   | No                    | No                           |
| Reassign technicians     | Yes                   | Yes                   | No                    | No                           |
| Update assigned repair   | Yes                   | Yes                   | Yes                   | No                           |
| View repair history      | All                   | All                   | Yes                   | Related/own relevant history |
| View technician workload | Yes                   | Yes                   | No                    | No                           |
| Manage technicians       | Yes                   | Yes                   | No                    | No                           |
| Manage users             | Yes                   | Operational scope     | No                    | No                           |
| Manage roles             | Yes                   | Restricted            | No                    | No                           |
| Organization settings    | Yes                   | Restricted            | No                    | No                           |
| Personal settings        | Yes                   | Yes                   | Yes                   | Yes                          |
| WebMCP actions           | Permission-controlled | Permission-controlled | Permission-controlled | Permission-controlled        |

Permission enforcement must exist at the application/backend level. Hiding UI controls alone is not sufficient.

---

## 6. Core Product Modules

### 6.1 Dashboard

Provides role-specific operational overview.

#### Admin/Manager Dashboard

Shows:

- Total assets
- Open repairs
- Critical repairs
- In-repair count
- Resolved repairs
- Urgent repairs
- Repeated failure warnings
- Warranty warnings
- Technician workload
- WebMCP activity

#### Technician Dashboard

Shows:

- Assigned repairs
- Critical repairs
- Repairs currently in progress
- Due-today repairs
- Today's work
- Urgent repairs
- Assets needing attention
- Upcoming deadlines
- Recent activity
- WebMCP activity

#### Employee Dashboard

Shows:

- My assets
- Open issues
- Assets currently in repair
- Resolved issues
- My assets
- My repair requests
- Assigned technician
- Recent updates
- Report Issue action

Dashboards must use the same application shell while adapting content according to role.

---

## 7. Asset Management

Assets represent physical equipment used by the organization.

Example asset types:

- Laptop
- Monitor
- Projector
- Printer
- Phone
- Network equipment
- Other company equipment

Each asset should support information such as:

- Asset ID
- Asset name
- Category
- Serial number
- Status
- Assigned user
- Location
- Purchase date
- Warranty information
- Last repair
- Repair count
- Current repair ticket
- Repair history

### Asset statuses

- Active
- In Repair
- Retired

### Warranty statuses

- Active
- Expiring Soon
- Expired

### Asset capabilities

Admin/Manager:

- Create asset
- Edit asset
- Assign/reassign asset
- Update operational information
- Retire asset
- Review repair history

Technician:

- View operational asset information
- View repair context
- View warranty
- View repair history
- Open related repair

Employee:

- View assigned assets
- View basic information
- View warranty information
- View relevant repair history
- Report an issue

---

## 8. Repair Ticket Management

Repair tickets represent individual equipment problems or repair workflows.

A repair ticket should contain:

- Ticket ID
- Asset
- Issue title
- Description
- Priority
- Status
- Reporter
- Assigned technician
- Created timestamp
- Updated timestamp
- Due date
- Diagnosis
- Repair notes
- Resolution
- Repair timeline
- Related asset history

### Repair priorities

- Critical
- High
- Medium
- Low

### Repair statuses

Recommended lifecycle:

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

The exact transitions must be permission-controlled.

---

## 9. Employee Issue Reporting

Employees can report problems against assets assigned to them.

Example:

> "My laptop is overheating."

The system creates a structured repair ticket.

Employee workflow:

```text
Select Asset
      ↓
Describe Problem
      ↓
Submit Issue
      ↓
Repair Ticket Created
      ↓
Technician Assignment
      ↓
Repair Progress
      ↓
Resolution
```

Employees cannot manually select or assign technicians.

---

## 10. Technician Workflow

Technicians use RepairDesk to execute repair operations.

Typical flow:

```text
Assigned Repair
      ↓
Review Asset
      ↓
Inspect Repair History
      ↓
Check Warranty
      ↓
Diagnose
      ↓
Add Repair Notes
      ↓
Update Repair Status
      ↓
Resolve
```

Technicians should have quick access to:

- Assigned ticket
- Asset details
- Previous failures
- Warranty state
- Existing repair history
- Current status
- Repair notes

---

## 11. Repair History

Repair history provides historical records of previous repairs.

Historical records should contain:

- Ticket
- Asset
- Issue
- Diagnosis
- Resolution
- Technician
- Priority
- Status
- Dates
- Repair timeline
- Related asset

Completed historical records are primarily read-only.

The system should make repeated failures visible.

Example:

```text
PROJ-023
4 repairs in the last 6 months
REPEATED FAILURE
```

This information is useful for technicians, managers, and admins.

---

## 12. Notifications

Notifications are role-specific.

### Employee notifications

Examples:

- Repair submitted
- Technician assigned
- Repair status changed
- Repair resolved
- Warranty warning
- Asset update

### Technician notifications

Examples:

- New repair assignment
- Critical repair alert
- Repair status update
- Asset warning
- Warranty warning
- Deadline reminder
- Repair resolved
- System notice

### Admin/Manager notifications

Examples:

- Critical repair
- New repair request
- Technician workload alert
- Warranty warning
- Repeated failure
- Repair resolved
- System notice

Users only see notifications they are authorized to access.

---

## 13. Settings

### Employee Settings

Employees can manage:

- Own name/profile information
- Password
- Personal notification preferences
- Personal UI/work preferences
- Sessions

They cannot manage:

- Role
- Employee ID
- Department
- Organization settings
- Other users
- Technicians
- Assets

### Technician Settings

Technicians can manage:

- Own profile
- Password
- Notification preferences
- Personal work/UI preferences
- Sessions

They cannot manage:

- Role
- Technician ID
- Department
- Users
- Technicians
- Assets
- Organization settings
- System-level security

### Admin/Manager Settings

Admin/Manager share the same Settings interface but permissions determine which sections/actions are available.

Admin can manage:

- Profile
- Users
- Roles
- Technicians
- Organization settings
- System settings
- Notification policies
- Security settings

Manager can manage:

- Profile
- Operational users
- Technicians
- Employees
- Operational settings
- Operational notifications
- Personal security

Manager cannot perform restricted system-level administration reserved for Admin.

---

## 14. WebMCP

WebMCP is a core product capability of RepairDesk.

RepairDesk should expose selected application capabilities as structured tools that AI agents can discover and use.

Potential tool categories include:

### Asset tools

- Search assets
- Get asset details
- Get asset status
- Check warranty
- Get asset repair history

### Repair tools

- Search repairs
- Get repair details
- Create repair ticket
- Update repair status
- Add repair note
- Get current repair state

### Operational tools

- Find available technicians
- Retrieve workload information where permitted
- Retrieve operational alerts
- Retrieve relevant repair records

### Permission model

WebMCP actions must obey the same authorization model as normal application actions.

Example:

```text
AI Agent
   ↓
WebMCP Tool
   ↓
Authentication / Authorization
   ↓
RepairDesk Operation
   ↓
Database
```

An AI agent must not bypass application permissions through WebMCP.

Sensitive or destructive actions should require appropriate human authorization where applicable.

---

## 15. AI Agent Interaction Examples

### Example 1 — Asset investigation

User asks an AI agent:

> "Check the projector and tell me whether it is under warranty."

Agent uses RepairDesk WebMCP tools:

```text
get_asset_status()
        ↓
check_warranty()
        ↓
return result
```

### Example 2 — Create a repair

User asks:

> "My laptop is overheating. Create a repair request for LAP-018."

Agent:

```text
get_asset_status(LAP-018)
        ↓
verify permission
        ↓
create_repair_ticket(...)
        ↓
return ticket ID
```

### Example 3 — Repair history

User asks:

> "Show me previous repairs for PROJ-023."

Agent:

```text
get_asset_history(PROJ-023)
        ↓
return previous repair records
```

### Example 4 — Operational investigation

Manager asks:

> "Find assets that have failed repeatedly."

Agent:

```text
search_assets()
        ↓
retrieve repair history
        ↓
identify repeated failures
        ↓
return results
```

The actual set of exposed WebMCP tools may be finalized during implementation.

---

## 16. Human and AI Responsibilities

### Humans

Humans remain responsible for:

- Business decisions
- Administrative permissions
- Sensitive changes
- Approval-required actions
- Organization-level controls

### AI Agents

AI agents may:

- Search information
- Retrieve operational context
- Create supported records
- Perform supported workflow actions
- Assist with diagnosis/context
- Reduce manual navigation

AI agents must not bypass authorization or perform actions outside their permitted tool scope.

---

## 17. Navigation Structure

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

All roles use the same core application shell.

Only navigation items and content change by role.

---

## 18. Design Requirements

The UI follows the existing Stitch designs and Design system.

### Visual style

Industrial Neo-Brutalist / Industrial Editorial.

### Main colors

```text
Warm Cream:       #F5F0E6
Surface:          #FEF9EF
Near Black:       #1A1A1A
Signal Orange:    #FF4500
Electric Yellow:  #D3F000
```

The uploaded landing page implementation also uses these brand colors and Space Grotesk/Inter/JetBrains Mono typography.

### Typography

- Space Grotesk — headlines and structural labels
- Inter — body/interface text
- JetBrains Mono — technical/agent/log information where appropriate

### Layout

- Rigid grid-based composition
- 24px desktop gutters
- 16px mobile margins
- 8px spacing rhythm
- Maximum content width around 1280px

### Borders

- 2px–3px solid black structural borders

### Shadows

Primary Neo-Brutalist elevation:

```css
box-shadow: 4px 4px 0 #1a1a1a;
```

### Shapes

- Mostly sharp corners
- Minimal rounding
- Approximately 4px rounding only where interaction affordance benefits

The current design system explicitly defines the rigid grid and hard-offset elevation model.

---

## 19. Responsive Requirements

### Desktop

- Fixed left sidebar
- Large operational content area
- Multi-column grid
- Tables where suitable

### Tablet

- Collapsible sidebar where necessary
- Responsive grids
- Filters wrap cleanly

### Mobile

- Compact/collapsible navigation
- Single-column layout
- Tables convert into cards where appropriate
- No page-level horizontal overflow
- Primary actions remain easily accessible

---

## 20. Non-Functional Requirements

### Security

- Enforce RBAC server-side
- Protect authenticated routes
- Validate all WebMCP actions against permissions
- Prevent unauthorized cross-user data access
- Never expose secrets in the frontend

### Performance

- Avoid unnecessary API requests
- Paginate large asset/repair datasets
- Lazy-load non-critical data
- Keep dashboard queries efficient
- Avoid excessive client-side processing

### Reliability

- Repair updates should be transactional
- Prevent invalid status transitions
- Prevent duplicate or conflicting operations
- Preserve repair history integrity

### Auditability

Important operational actions should be traceable, including:

- Asset changes
- Repair creation
- Repair assignment
- Status changes
- Important WebMCP actions
- Administrative changes

---

## 21. Data Entities

Core entities:

```text
User
Organization
Asset
AssetCategory
RepairTicket
RepairNote
RepairHistory
Technician
Notification
Warranty
WebMCPTool / ToolExecution
AuditLog
```

Relationships should ensure that assets, repairs, users, technicians, notifications, and history remain traceable.

---

## 22. MVP Scope

### Must Have

- Authentication
- Role-based access
- Admin/Manager Dashboard
- Technician Dashboard
- Employee Dashboard
- Asset management
- Repair ticket management
- Employee issue reporting
- Technician repair workflow
- Repair history
- Notifications
- Role-specific settings
- WebMCP integration
- Permission-aware WebMCP operations
- Responsive UI

### Should Have

- Search
- Filtering
- Warranty warnings
- Repeated-failure detection
- Technician workload visibility
- Audit logging
- WebMCP activity logs

### Can Have Later

- Advanced analytics
- External notification integrations
- Advanced AI diagnosis
- Automated maintenance recommendations
- Expanded reporting/export functionality

---

## 23. Out of Scope for MVP

The first implementation should avoid:

- Full ERP functionality
- Financial/accounting management
- Procurement management
- Complex inventory accounting
- Advanced predictive-maintenance ML
- Complex workforce scheduling
- Payroll
- Customer-facing external service portal

---

## 24. Key Success Criteria

RepairDesk MVP is successful when:

1. An employee can report an equipment issue quickly.
2. A technician can find and work on assigned repairs.
3. A technician can inspect the asset and historical repair context.
4. Admin/Manager can control assets and operational workflows.
5. Employees can track their own repairs and assigned technician.
6. Notifications correctly reflect role-specific events.
7. Role restrictions are enforced consistently.
8. AI agents can discover and perform permitted RepairDesk operations through WebMCP.
9. WebMCP actions respect the same authorization boundaries as normal application actions.
10. The final implementation follows the approved Stitch UI designs.

---

## 25. Product Structure

```text
RepairDesk
│
├── Public
│   ├── Landing Page
│   └── Authentication
│
└── Authenticated Application
    │
    ├── Admin / Manager
    │   ├── Dashboard
    │   ├── Assets
    │   ├── Repair History
    │   ├── Notifications
    │   └── Settings
    │
    ├── Technician
    │   ├── Dashboard
    │   ├── My Repairs
    │   ├── Assets
    │   ├── Repair History
    │   ├── Notifications
    │   └── Settings
    │
    └── Employee
        ├── Dashboard
        ├── My Issues
        ├── My Assets
        ├── Notifications
        └── Settings
```

---

## 26. Product Principle

RepairDesk should remain a **repair-operations platform first**.

AI and WebMCP are not separate products or decorative chatbot features.

They are an interaction layer that makes RepairDesk operations accessible to AI agents while preserving the underlying application's security, permissions, workflows, and human oversight.

```

```
