# DESIGN.md

# RepairDesk — Design System & UI Implementation Guide

## 1. Purpose

This document defines the visual language, interaction principles, reusable UI patterns, and implementation rules for RepairDesk.

**Important:** This file is a design guide, not the primary source for recreating individual screens.

The **Stitch-generated HTML files are the primary visual source of truth for each page**.

AI coding agents must use the relevant Stitch HTML file(s) as the actual implementation reference and use this document to understand how to analyze, preserve, and integrate those designs into the real React application.

---

## 2. Design Source of Truth

### Priority

When implementing or modifying a UI page, follow this order:

1. Relevant Stitch-generated HTML file
2. Existing working implementation of that page
3. This `DESIGN.md`
4. General UI/UX conventions

Do not recreate a screen from the description in this document when a Stitch HTML file exists.

### Mandatory Stitch Workflow

Before implementing a page:

1. Identify the corresponding Stitch HTML file.
2. Read/analyze the complete HTML and CSS.
3. Inspect:
   - Layout structure
   - Grid/container dimensions
   - Typography
   - Colors
   - Borders
   - Shadows
   - Spacing
   - Icons
   - Navigation
   - Component states
   - Responsive behavior
4. Reproduce the approved structure in React.
5. Connect the design to real application data and functionality.
6. Preserve the original visual hierarchy.
7. Do not redesign the page during functional implementation.

### Core Rule

**Stitch files define what the page should look like.  
`DESIGN.md` defines how the agent should understand and preserve that design.**

---

# 3. Overall Visual Direction

RepairDesk follows an:

**Industrial Neo-Brutalist / Industrial Editorial**

visual language.

The interface should feel:

- Technical
- Operational
- Bold
- Structured
- High-contrast
- Mechanical
- Professional
- Precise

The design should communicate that RepairDesk is an operational system rather than a generic consumer SaaS dashboard.

---

# 4. Core Design Characteristics

Use the following characteristics consistently:

- Strong black borders
- Hard offset shadows
- Warm cream surfaces
- High-contrast typography
- Orange operational accents
- Electric yellow highlights
- Compact technical labels
- Uppercase structural headings
- Grid-based layouts
- Dotted/grid background textures
- Sharp or minimally rounded components
- Clear visual hierarchy
- Dense but organized information presentation

Avoid soft visual styling that weakens the industrial identity.

Do not introduce:

- Glassmorphism
- Excessive blur
- Soft floating-card aesthetics
- Large gradients
- Excessively rounded cards
- Generic corporate SaaS styling
- Excessive decorative elements

---

# 5. Color System

The Stitch files establish the primary visual palette.

Core colors include:

```text
Warm Cream:
#F5F0E6

Primary Surface:
#FEF9EF

Near Black:
#1A1A1A

Black:
#000000

Signal Orange:
#FF4500

Secondary Orange:
#FE5E1E

Electric Yellow:
#D3F000
```

Additional semantic colors may appear in the Stitch implementations for:

- Error states
- Success states
- Warnings
- Secondary surfaces
- Muted text
- Surface variations

When implementing an existing page, prefer the exact color values already used by its Stitch HTML rather than approximating them.

---

# 6. Typography

The approved typography system uses:

### Space Grotesk

Use primarily for:

- Main headings
- Page titles
- Navigation labels
- Structural labels
- Buttons
- Strong UI hierarchy

### Inter

Use primarily for:

- Body text
- Descriptions
- Supporting information
- Standard interface content

### JetBrains Mono / Monospace

Use where the design calls for:

- Technical identifiers
- Serial numbers
- IDs
- System information
- Terminal/log-style content
- Technical labels

Typography must remain visually consistent with the Stitch source.

Do not substitute random fonts during implementation.

---

# 7. Typography Characteristics

Typical Stitch patterns include:

### Large headings

- Bold/heavy
- Uppercase where specified
- Tight tracking
- Strong hierarchy

### Structural labels

- Small
- Bold
- Uppercase
- Tracking-heavy
- Often monospace or display-font based

### Body text

- Highly readable
- Medium/regular weight
- Strong contrast against background

Exact font size and line-height should come from the relevant Stitch file.

---

# 8. Borders

Borders are a major part of the visual identity.

Typical patterns:

```text
2px solid black
3px solid black
```

Use stronger borders for:

- Major containers
- Navigation boundaries
- Cards
- Primary controls
- Product panels
- Hero sections

Avoid subtle 1px grey borders unless explicitly present in the Stitch design.

---

# 9. Hard Shadows

RepairDesk uses hard, non-blurred shadows.

Common pattern:

```text
box-shadow: 4px 4px 0px #1A1A1A;
```

or:

```text
box-shadow: 4px 4px 0px #000000;
```

Some screens use smaller shadow offsets for smaller controls.

### Interaction Pattern

Buttons and interactive elements may use the Neo-Brutalist press behavior:

```text
Normal:
Hard shadow

Hover:
Visual emphasis / color change

Active:
Shadow removed
Element translated approximately 4px, 4px
```

Preserve the exact behavior used by the Stitch source for that component.

---

# 10. Background Treatment

Many authenticated application pages use a dotted/grid texture.

Common pattern:

```css
background-image: radial-gradient(#1a1a1a 1px, transparent 0);
background-size: 24px 24px;
```

Some screens use:

```css
background-size: 16px 16px;
```

Other Stitch pages use approximately:

```css
background-size: 20px 20px;
```

Therefore:

**Do not globally force one dot-grid size.**

Use the value from the relevant Stitch design.

---

# 11. Layout System

The product generally follows a structured editorial layout.

Desktop layouts commonly use:

```text
12-column grid
24px approximate gutters
48px approximate desktop margins
```

Mobile layouts commonly reduce outer margins to approximately:

```text
16px
```

Authenticated pages generally use:

```text
Fixed sidebar
+
Responsive main content
```

The exact dimensions must come from the Stitch source.

---

# 12. Sidebar Navigation

Authenticated screens use a strong fixed sidebar pattern.

Typical characteristics:

```text
Width: approximately 256px
Fixed to left
Full viewport height
Strong right border
Cream surface
```

The sidebar includes:

- RepairDesk brand
- Role-specific navigation
- Active navigation item
- User profile area
- Logout control

The active navigation item typically uses:

- Strong contrasting background
- Black border
- Hard shadow or strong selected treatment
- Bold typography

Inactive navigation items use:

- Transparent/light background
- Hover background
- Border transition
- Consistent icon spacing

Do not create different sidebar visual systems for each role.

The navigation items may differ by role, but the design language should remain consistent.

---

# 13. Role-Specific Navigation

### Admin / Manager

Core navigation:

```text
Dashboard
Assets
Repair History
Notifications
Settings
```

### Technician

Core navigation:

```text
Dashboard
My Repairs
Assets
Repair History
Notifications
Settings
```

### Employee

Core navigation:

```text
Dashboard
My Issues
My Assets
Notifications
Settings
```

Role restrictions are controlled by application permissions, not by creating unrelated visual systems.

---

# 14. Main Content Area

Authenticated pages generally use:

- Responsive main content
- Clear page title
- Supporting description
- Action area where required
- Structured content sections
- Strong visual grouping

Typical hierarchy:

```text
Page Title
Supporting Description
Primary Actions / Filters
Primary Content
Secondary Content
```

Do not overcrowd the page with unnecessary decorative UI.

---

# 15. Dashboard Design

Dashboards should prioritize operational visibility.

Typical design patterns include:

- KPI/stat cards
- Operational metrics
- Repair queues
- Status indicators
- Recent activity
- Alerts
- Workload information
- Structured tables or lists

The Stitch dashboard layout is authoritative.

Agents must reproduce the actual dashboard composition from:

```text
admin_manager_dashboard.html
technician_dashboard.html
employee_dashboard.html
```

Do not replace approved dashboard compositions with generic dashboard templates.

---

# 16. Asset Interfaces

Asset-related screens should visually communicate:

- Equipment identity
- Ownership
- Status
- Warranty
- Repair context
- Search/filter capability

Typical visual patterns in the Stitch implementations include:

- Strong table/card boundaries
- Technical identifiers
- Search inputs
- Status labels
- Operational metadata
- Action controls

Use the corresponding Stitch page for exact placement and structure.

---

# 17. Repair Interfaces

Repair-related UI should make operational state immediately understandable.

Use the approved status vocabulary:

```text
Open
Assigned
Diagnosing
In Repair
Resolved
Closed
```

Priority vocabulary:

```text
Critical
High
Medium
Low
```

Status and priority treatments should be visually distinct but remain consistent with the surrounding Neo-Brutalist system.

---

# 18. Repair History

Repair History should prioritize:

- Asset context
- Repair context
- Technician information where permitted
- Status
- Priority
- Resolution information
- Timeline/history information

The Stitch design should be preserved rather than converted into a generic activity feed.

---

# 19. Notifications

Notifications should feel operational rather than social.

Visual hierarchy should clearly separate:

- Notification type
- Main message
- Related context
- Time
- Read/unread state

Unread indicators may use stronger accent treatments.

The existing Stitch notification files must determine exact layout and treatment.

---

# 20. Settings

Settings pages should use the same industrial visual language.

Typical structure:

```text
Page heading
+
Settings sections
+
Controls / forms
+
Save or action controls
```

Do not transform settings into a different visual style.

Personal settings remain available according to role permissions.

---

# 21. Employee Screens

Employee interfaces intentionally expose less operational complexity than Admin/Manager screens.

The visual system remains consistent.

Employee-specific pages include:

```text
Dashboard
My Issues
My Assets
Notifications
Settings
```

Do not visually imply that employees have administrative authority.

---

# 22. Technician Screens

Technician interfaces prioritize:

- Assigned repairs
- Repair status
- Asset context
- Warranty
- Repair history
- Notes
- Operational alerts

Core screens include:

```text
Dashboard
My Repairs
Assets
Repair History
Notifications
Settings
```

Use the corresponding Stitch files as the source for exact layout and component placement.

---

# 23. Landing Page

The landing page has a stronger editorial/marketing treatment than the authenticated application.

Important characteristics from the Stitch designs include:

- Sticky top navigation
- Large hero typography
- Warm cream background
- Signal orange CTA
- Electric yellow highlight treatment
- Strong black borders
- Hard shadows
- Product/telemetry preview panels
- WebMCP-focused messaging
- Industrial technical visual language

The hero messaging and composition should be taken from the approved landing-page Stitch HTML rather than reconstructed from this document.

The landing page also includes a more technical product visualization/telemetry treatment to communicate the relationship between:

```text
Human Request
↓
AI Agent / WebMCP
↓
RepairDesk Operations
```

Preserve this concept when implementing the provided landing page.

---

# 24. WebMCP Visual Language

WebMCP is one of RepairDesk's primary product differentiators.

Where the Stitch landing page uses WebMCP-related UI, the visual language should communicate:

- Agent readiness
- Tool execution
- Permission enforcement
- Operational control
- Human oversight

The Stitch design contains technical UI patterns such as:

```text
WEBMCP ACTIVE
PERMISSION GATE
ROLE-ENFORCED
AGENT TOOLSET
```

These are visual/product presentation elements.

Do not invent unrelated futuristic AI visuals that make the product resemble an AI chatbot.

---

# 25. Product Tone

The interface tone should be:

```text
Technical
Operational
Confident
Precise
Direct
Industrial
```

Avoid:

```text
Playful
Childish
Overly decorative
Luxury
Soft wellness SaaS
Generic AI assistant
```

Copy should be short, functional, and action-oriented.

---

# 26. Icons

The Stitch files primarily use:

**Material Symbols Outlined**

Icons should:

- Match the intended meaning
- Maintain consistent sizing
- Use the same visual weight as the source
- Maintain alignment with adjacent text

Do not randomly substitute icon libraries when an equivalent existing icon is already used.

---

# 27. Buttons

Primary buttons generally combine:

- Strong fill
- Strong border
- Hard shadow
- Bold uppercase label
- Compact spacing
- Clear interaction state

Examples may use:

```text
Signal Orange
Electric Yellow
Near Black
Cream
```

Secondary buttons may use cream/transparent treatments with strong borders.

Do not use soft rounded-pill buttons unless explicitly present in the Stitch source.

---

# 28. Form Controls

Inputs and selects should visually belong to the same industrial system.

Preferred characteristics include:

- Strong borders
- Cream/light surfaces
- Clear labels
- Technical typography where appropriate
- Visible focus state
- Adequate padding
- Strong contrast

Focus states must remain accessible.

---

# 29. Cards and Containers

Cards should not look like floating soft UI.

Preferred characteristics:

- Hard borders
- Hard shadows where specified
- Strong grouping
- Flat/solid backgrounds
- Clear internal spacing

Cards should communicate operational hierarchy, not decoration.

---

# 30. Tables and Dense Data

Tables should prioritize scanability.

Use:

- Strong headers
- Clear row boundaries
- Compact metadata
- Status indicators
- Consistent alignment
- Responsive overflow strategy

Do not sacrifice usability merely to preserve a desktop table on mobile.

The exact table treatment must follow the relevant Stitch source.

---

# 31. Responsive Behavior

Responsive behavior must be derived primarily from the Stitch files.

Common adaptation patterns include:

- Fixed sidebar becoming responsive/mobile navigation
- Multi-column layouts becoming stacked sections
- Horizontal action groups becoming wrapped layouts
- Desktop typography scaling down
- Tables becoming scrollable or structurally simplified where required
- Reduced page margins

Never blindly copy desktop dimensions into mobile.

---

# 32. Accessibility

The Neo-Brutalist style must not compromise accessibility.

Maintain:

- Readable text contrast
- Keyboard accessibility
- Visible focus states
- Semantic controls
- Descriptive labels
- Appropriate button/link semantics
- Accessible form labels

Do not remove accessibility behavior to reproduce a visual effect.

---

# 33. State Design

Important interactive states should be preserved:

```text
Default
Hover
Focus
Active/Pressed
Disabled
Loading
Success
Error
Empty
Selected
Unread
```

Use the visual patterns already demonstrated in the Stitch source.

---

# 34. Visual Consistency Rule

When implementing a new component:

1. Search the existing Stitch pages for a visually similar component.
2. Reuse that visual pattern.
3. Reuse existing React components where possible.
4. Do not create a visually unrelated component.

Consistency is more important than introducing a theoretically “better” UI pattern.

---

# 35. Design Modification Rule

Do not modify an approved design simply because:

- The agent prefers another layout.
- Another component library has a different style.
- A generic SaaS template looks cleaner.
- A different color palette seems more modern.
- A new component is easier to implement.

Design changes require an explicit product/design decision.

---

# 36. Stitch-to-React Conversion Rule

When converting Stitch HTML into React:

### Preserve

- Visual hierarchy
- Layout
- Spacing
- Typography
- Colors
- Borders
- Shadows
- Icons
- Responsive behavior
- Interaction states

### Replace

Static mock data with:

- Real Supabase data
- Authentication context
- Application state
- Real actions
- Role-aware content

The objective is:

**Functional React implementation of the approved Stitch design — not a redesign inspired by the Stitch design.**

---

# 37. Placeholder Data Rule

Stitch HTML often contains example values such as:

```text
Alex Rivera
System Admin
Technician
Example asset IDs
Example repair records
```

These are visual placeholders unless explicitly required by the product.

Agents must replace mock/example values with real application data during implementation.

Do not mistake placeholder names or labels for actual product roles.

For example:

`System Admin` in an HTML mockup does **not** create a fifth application role.

The application roles remain:

```text
ADMIN
MANAGER
TECHNICIAN
EMPLOYEE
```

---

# 38. Existing Page Files

The current Stitch-generated design set includes pages such as:

```text
landingpage.html

admin_manager_dashboard.html
admin_assets.html
admin/manager repair history
admin/manager notifications
admin/manager settings

technician_dashboard.html
technician_assets.html
technician notifications
technician settings

employee_dashboard.html
employee_my_issue.html
employee_my_assets.html
employee_notification.html
employee_settings.html

authentication page
```

The exact filenames present in the repository should be used during implementation.

Do not assume a page exists under a filename that is not actually present.

---

# 39. How Agents Must Analyze Stitch Files

For every requested UI page, inspect the Stitch file and identify:

```text
1. Global styles
2. Color tokens
3. Font definitions
4. Layout/container system
5. Navigation structure
6. Main content hierarchy
7. Reusable visual components
8. Buttons and controls
9. States
10. Responsive rules
11. Icons
12. Shadows and borders
13. Background treatment
14. Spacing
15. Data presentation patterns
```

Then map those visual structures to reusable React components.

Do not blindly copy the entire HTML as one React component.

---

# 40. Component Reuse

Where multiple Stitch pages share the same visual structure, create reusable components such as:

```text
AppShell
Sidebar
SidebarItem
UserProfileFooter
PageHeader
StatCard
StatusBadge
PriorityBadge
DataTable
SearchInput
PrimaryButton
SecondaryButton
NotificationItem
EmptyState
LoadingState
```

The exact component structure may differ according to the existing codebase.

Reuse should reduce duplication without changing the approved appearance.

---

# 41. Avoid Visual Drift

Visual drift occurs when functional implementation slowly changes the original Stitch design.

Agents must actively avoid:

- Different spacing
- Different font sizes
- Different border widths
- Different shadows
- Different colors
- Different icon sizes
- Different sidebar dimensions
- Different card layouts
- Different button styles

When a page is already approved, **visual fidelity is a requirement**.

---

# 42. Implementation Priority

When functionality and visual fidelity appear to conflict:

1. Preserve application correctness and security.
2. Preserve approved product behavior.
3. Preserve the Stitch visual system.
4. Adapt implementation details without unnecessarily changing the visual result.

Never weaken:

- Authentication
- RBAC
- RLS
- Data integrity
- WebMCP authorization

just to reproduce a visual effect.

---

# 43. Design Quality Checklist

Before considering a UI implementation complete, verify:

```text
[ ] Correct Stitch source was inspected.
[ ] Layout matches the Stitch source.
[ ] Typography matches.
[ ] Colors match.
[ ] Borders match.
[ ] Shadows match.
[ ] Icons match.
[ ] Navigation matches.
[ ] Responsive behavior is preserved.
[ ] Real application data replaces mock data.
[ ] Role-based content is enforced.
[ ] Loading/error/empty states are handled.
[ ] No unnecessary redesign was introduced.
[ ] No generic SaaS styling replaced the approved visual language.
```

---

# 44. Final Design Principle

RepairDesk should look like one coherent product across every role and screen.

The **Stitch HTML files are the visual blueprint**.

`DESIGN.md` exists to help AI agents correctly interpret and preserve that blueprint.

### Non-negotiable rule

**Do not design from `DESIGN.md` alone.
Always inspect and implement from the relevant Stitch file first.**

The agent's responsibility is to turn the approved Stitch design into a real, responsive, accessible, data-driven RepairDesk interface without introducing visual drift.

```

```
