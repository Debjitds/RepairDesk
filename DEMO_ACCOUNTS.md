# RepairDesk Demo Accounts

All accounts share the password: `RepairDesk2026!`

| Role | Email | Name | Department |
|------|-------|------|------------|
| ADMIN | admin@repairdesk.io | Alex Rivera | IT Operations |
| MANAGER | tanya.miller@repairdesk.io | Tanya Miller | Operations |
| TECHNICIAN | sam.chen@repairdesk.io | Sam Chen | Bench Operations |
| TECHNICIAN | priya.sharma@repairdesk.io | Priya Sharma | Bench Operations |
| EMPLOYEE | jordan.davis@repairdesk.io | Jordan Davis | Engineering |
| EMPLOYEE | casey.wong@repairdesk.io | Casey Wong | Design |

Organization: **RepairDesk HQ**

## Demo data

- Assets: PROJ-023 (In Repair, repeat failures), LAP-018 (Jordan), MON-044 (Casey, warranty expiring soon), PRN-011, NET-005, MOB-011 (Jordan), LAP-022 (Retired)
- Repairs:
  - RD-1001 — CLOSED (High) — laptop overheating, full lifecycle completed
  - RD-1002 — OPEN (Medium) — monitor flicker, awaiting assignment
  - RD-1003 — IN_REPAIR (Critical) — projector overheating, assigned to Priya

## WebMCP endpoint

Open `/mcp.html` — MCP bridge mounted as `window.repairdeskMcp.request(message)`
(JSON-RPC 2.0, MCP protocol 2025-06-18). Tools list, discovery and calls all require
an authenticated session and run through the same RLS + business functions as the app.

## Local development

```
npm install
npm run dev
```

Supabase project: RepairDesk (puaobtjdcnlxixplpqjx)
