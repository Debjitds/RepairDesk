# RepairDesk

Agent-ready repair operations platform. One coherent system:

```
Human User → React UI → Authenticated Application → RBAC + Validation → Supabase → PostgreSQL + RLS
AI Agent  → WebMCP   → Same Auth/Authorization Context → Same Business Logic → Same Supabase Backend
```

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (Stitch-approved industrial neo-brutalist design)
- **Backend**: Supabase (Auth, PostgreSQL, RLS, SECURITY DEFINER business functions)
- **Protocol**: WebMCP (Model Context Protocol, JSON-RPC 2.0 bridge) at `/mcp.html`

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build (tsc + vite)
```

Environment (`.env`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Demo accounts are listed in [DEMO_ACCOUNTS.md](./DEMO_ACCOUNTS.md) (password: `RepairDesk2026!`).

## Architecture

### Roles (RBAC)

| Role | Scope |
|------|-------|
| ADMIN | Organization-wide data + user/role management + audit logs |
| MANAGER | Organization-wide operational data (assets, repairs, assignment, closing) |
| TECHNICIAN | Assigned repairs + operational asset registry (read) |
| EMPLOYEE | Own assets, own repair tickets, own notifications |

There is no SYSTEM_ADMIN application role. Authorization is enforced in three layers:
1. Supabase RLS policies (row-level, org-scoped, role-aware)
2. SECURITY DEFINER service functions with explicit role/ownership checks
3. Frontend permission hints (UX only — never a security boundary)

### Repair lifecycle

`OPEN → ASSIGNED → DIAGNOSING → IN_REPAIR → RESOLVED → CLOSED`

Invalid transitions are rejected server-side. Technicians may only move their own
assigned repairs to DIAGNOSING / IN_REPAIR / RESOLVED; only managers/admins can
assign technicians and close resolved repairs. Asset status syncs automatically
(IN_REPAIR while fixing, ACTIVE on resolution/close).

### Data model

`organizations`, `users`, `assets`, `repairs`, `repair_notes`, `repair_history`,
`notifications`, `audit_logs`, `webmcp_tool_executions` — all org-scoped with
foreign-key integrity and check constraints.

### WebMCP

`/mcp.html` mounts an MCP server (JSON-RPC 2.0):

```js
window.repairdeskMcp.request({
  jsonrpc: '2.0', id: 1, method: 'tools/call',
  params: { name: 'search_assets', arguments: { query: 'laptop' } }
})
```

Tools: `search_assets`, `get_asset`, `get_asset_status`, `check_warranty`,
`get_asset_repair_history`, `search_repairs`, `get_repair`, `create_repair_ticket`,
`update_repair_status`, `add_repair_note`, `get_repair_history`,
`find_available_technicians`, `get_technician_workload`, `get_operational_alerts`.

Every tool call requires an authenticated session, executes through the same
application services (RLS + business functions), and is audit-logged to
`webmcp_tool_executions`. WebMCP has no direct database access and no elevated
credentials.

## Layout

```
src/
  components/    shared UI (Stitch design system primitives, sidebar)
  hooks/         auth context, async data
  lib/           supabase client, formatters, permission hints
  mcp/           WebMCP server + tool layer
  pages/
    public/      landing (Stitch landingpage.html)
    auth/        login/signup (Stitch authpage.html)
    admin/       dashboard, assets, repair history (manager/admin)
    technician/  dashboard, my repairs, assets, repair history
    employee/    dashboard, my issues, my assets
    shared/      notifications, settings, repair detail, asset detail
  services/      asset/repair/notification services (single source of truth for both UI and WebMCP)
  types/         database types
supabase/        applied migrations history (managed via Supabase dashboard)
```
