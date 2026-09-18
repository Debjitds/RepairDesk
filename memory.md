# memory.md

Permanent change history for future AI agents. Do not delete previous entries; append new entries below.

---

## Entry 1 — 2026-09-13: Fix wrong browser tab favicon (Problem 1)

### Problem reported
Browser tab/title screen showed the wrong RepairDesk icon — a generic wrench emoji (🔧) instead of the official RepairDesk logo.

### Root cause found
`index.html` line 5 contained a hardcoded inline SVG data-URI favicon rendering a wrench emoji:
`<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg ... %F0%9F%94%A7%3C/text%3E%3C/svg%3E" />`
This data-URI icon was also baked into the previously built `dist/index.html`. No `public/` directory, favicon.ico, or web manifest existed — the emoji SVG was the only icon reference in the project.

### Exact file/path used (source of truth for the logo)
- `docs/stitch_repairdesk_industrial_ai_operations_platform/repairdesk_logo/logo.png`
  (PNG, 503,430 bytes; note the folder name is "...ai_operations_platform" — lives under `docs/`)
- Working copy for the web app: `public/logo.png` (byte-identical copy; SHA-256 verified against the source)

### Files changed
1. `index.html` — replaced the inline wrench-emoji SVG favicon link with `<link rel="icon" type="image/png" href="/logo.png" />`.
2. `public/logo.png` — NEW; exact byte-for-byte copy of the official `logo.png` from `docs/stitch_repairdesk_industrial_ai_operations_platform/repairdesk_logo/logo.png`. No new logo created, no SVG/Material Icon/generated substitute used.
3. `dist/*` — regenerated via `npx vite build` (stale build contained the old emoji favicon).
4. `memory.md` — created; this entry.

Not changed (per task constraints): app UI/sidebar logo, hover states, WebMCP cards, dashboard, backend, database, all unrelated code. `mcp.html` already had no icon reference and was left as-is.

### Fix applied
Vite serves the `public/` directory at the site root in both dev and production build (contents are copied verbatim into `dist/`). Placing the exact `logo.png` at `public/logo.png` and pointing `<link rel="icon" type="image/png" href="/logo.png">` in `index.html` makes the browser tab use the official logo in both `npm run dev` and `npm run build` output. Production build re-run and verified: `dist/index.html` contains the new icon link and `dist/logo.png` is hash-identical to the source file. No conflicting favicon, favicon.ico, or manifest icon references remained after the replacement.

### Current status
FIXED and VERIFIED.
- Dev: `/logo.png` resolves from `public/` (e.g. http://localhost:5173/logo.png).
- Prod: `npx vite build` output confirmed — `dist/index.html` has `<link rel="icon" type="image/png" href="/logo.png" />`; `dist/logo.png` exists and matches the source hash.
- Note: browsers cache favicons aggressively; a hard refresh (Ctrl+F5) or new tab may be needed to see the new icon.

---

## Entry 2 — 2026-09-13: Fix sidebar active/selected state (Problem 2)

### Problem 2 description
When a sidebar item was active/selected (Dashboard, Assets, Repair History, Notifications, Settings, My Repairs, My Issues, My Assets), the text turned white WITHOUT the black background — active items were unreadable/invisible against the cream sidebar. Did not match the approved Stitch design.

### Stitch files inspected
All under `docs/stitch_repairdesk_industrial_ai_operations_platform/`:
- `repairdesk_admin_dashboard/admin_dashboard.html` (sidebar + tailwind.config block + `.industrial-shadow` CSS)
- `repairdesk_admin_assets/admin_assets.html`, `repairdesk_admin_notification/admin_notification.html`, `repairdesk_admin_repair_history/admin_repair_history.html`, `repairdesk_admin_settings/admin-settings.html`
- `repairdesk_technician_dashboard/technician_dashboard.html`, `repairdesk_technician_my_repairs/technician_my_repair.html`, `repairdesk_technician_assets/technician_assets.html`, `repairdesk_technician_repair_history/technician_repair_history.html`, `repairdesk_technician_notifications/technician_notification.html` (older raw-`bg-black` variant, visually identical treatment)
- `repairdesk_employee_dashboard/employee_dashboard.html`, `repairdesk_employee_my_issues/employee_my_issue.html`, `repairdesk_employee_my_assets/employee_my_assets.html`, `repairdesk_employee_notifications/employee_notification.html`, `repairdesk_employee_settings/employee_settings.html`

Stitch source of truth: active item = `flex items-center gap-3 px-4 py-3 bg-tertiary text-surface border-2 border-primary industrial-shadow font-bold transition-colors duration-200` with config tokens `tertiary: #000000`, `on-tertiary: #ffffff` and `.industrial-shadow { box-shadow: 4px 4px 0px #1A1A1A; }`. Inactive = `text-on-surface hover:bg-surface-container-highest border-2 border-transparent hover:border-primary transition-all duration-200`.

### Root cause
`src/components/layout/Sidebar.tsx` (lines 64-68) already used the exact Stitch classes via NavLink's `isActive` callback, and `.industrial-shadow` already existed in `src/index.css`. BUT the app's `tailwind.config.cjs` color tokens were missing `tertiary` and `on-tertiary` (present in every Stitch HTML's own Tailwind config). With no `tertiary` token defined, `bg-tertiary` generated NO CSS at all — so the active item had no black background — while `text-surface` (#fef9ef) rendered cream text on the cream sidebar (#fef9ef), making active items invisible. (Same missing token also silently broke `border-tertiary` on the aside and `hover:bg-tertiary` table-row hovers elsewhere.)

### Exact fix applied
Added the two missing Stitch color tokens to `tailwind.config.cjs` colors:
`tertiary: '#000000'` and `'on-tertiary': '#ffffff'` (values taken verbatim from the Stitch HTML tailwind config blocks).
This makes Tailwind generate `.bg-tertiary` (black), `.border-tertiary`, `.hover\:bg-tertiary` etc. No component/class changes were needed — the shared `Sidebar.tsx` already matched Stitch exactly, and since all four roles (Admin, Manager, Technician, Employee) render this single shared component through `AppShell`, the fix applies to every role's sidebar and every route automatically.

### Files modified
1. `tailwind.config.cjs` — added `tertiary: '#000000'`, `'on-tertiary': '#ffffff'` color tokens (one place, reusable)
2. `dist/*` — regenerated via `npx vite build` (old dist had no bg-tertiary CSS)
3. `memory.md` — this entry

Not modified (per task constraints): Sidebar.tsx (already matched Stitch), app UI elsewhere, favicon, WebMCP cards, admin/manager hover behavior outside sidebar, dashboard layout, backend/database, unrelated components. Note: `text-surface` (#fef9ef) was kept as-is because that is exactly what Stitch uses for the active item text on black (verified in admin_dashboard.html line 117, employee_dashboard.html, employee_my_issue.html, etc.) — it is the approved design, not a bug.

### Current status
FIXED and VERIFIED.
- Verified in generated `dist/assets/main-*.css`: `.bg-tertiary{background-color:rgb(0 0 0)}`, `.hover\:bg-tertiary:hover{...black}`, `.text-surface{color:rgb(254 249 239)}`, `.border-tertiary` present, `industrial-shadow` class present.
- Active item now renders: BLACK background + cream/white text+icons + 2px #1A1A1A border + 4px 4px #1A1A1A industrial shadow + bold — matching Stitch exactly.
- Inactive items keep original `text-on-surface` + `hover:bg-surface-container-highest` + `hover:border-primary` Stitch hover behavior (untouched).
- Active state is route-driven via NavLink `isActive`; `end` prop on `/dashboard` prevents false-active on nested routes; works for all four roles through the single shared Sidebar.
- `npm run typecheck` passes clean.

---

## Entry 3 — 2026-09-13: Fix "Invalid Date" in Last Repair (Asset Directory + Asset Details)

### Problem description
After repairing an asset, the Asset Directory "Last Repair" column (admin/technician Assets pages) and the Asset Details "LAST REPAIR" field (AssetDetail page and admin Assets detail modal) showed "Invalid Date" instead of the real last repair date. Assets with no repair history showed "—" correctly.

### Root cause
Data/logic-layer bug in `src/services/assetService.ts` `shapeAsset()`. The Supabase (PostgREST) embed `last_repair_at:repairs(resolved_at)` returns an **array of row objects** (e.g. `[{resolved_at: null}]` or `[{resolved_at: "...", ...}]`), not an array of raw date strings. The old code treated it as `Array<string|null>`: `.filter(Boolean)` kept truthy objects (even `{resolved_at: null}`), and `.sort().pop()` returned a whole **object** — not a date string. That object flowed into `formatDate()` → `new Date({...})` → NaN → "Invalid Date". Additionally, the embed didn't fetch `status`, so it couldn't distinguish completed/closed repairs (the source of "latest completed/closed repair") from open/in-progress ones.

DB verified live: `repairs.resolved_at` is timestamptz, set by `update_repair_status` RPC only on RESOLVED/CLOSED transitions; a reopened repair keeps its old `resolved_at` while status becomes IN_REPAIR — hence status filtering is required for correct "latest completed" selection.

### Data field/source responsible
`repairs.resolved_at` (timestamptz) + `repairs.status` via the `assets → repairs` PostgREST embed in `ASSET_SELECT` (`src/services/assetService.ts`); surfaced through `Asset.last_repair_at` (`src/types/index.ts`) and rendered by `formatDate` (`src/lib/format.ts`) in:
- `src/pages/admin/Assets.tsx:200` (directory "Last Repair" column), `:260` (detail modal)
- `src/pages/shared/AssetDetail.tsx:93` ("Last Repair" Meta)

### Fix applied
1. `src/services/assetService.ts` — `ASSET_SELECT` embed changed to `last_repair_at:repairs(resolved_at, status)`; `shapeAsset()` now correctly reads the object array: filters to repairs with a non-null `resolved_at` AND status RESOLVED/CLOSED, maps to the date strings, and takes the max (`.sort().pop()`) → true latest completed/closed repair date, or `null` when none.
2. `src/lib/format.ts` — `formatDate()` hardened: `isNaN(d.getTime()) ? '—' : ...` so a malformed value can never render "Invalid Date" anywhere (also protects `src/pages/admin/Dashboard.tsx:58` repeated-failure check). No hiding of valid data — root cause fixed in the data layer; this is only a guard.

### Files modified
1. `src/services/assetService.ts`
2. `src/lib/format.ts`
3. `dist/*` — rebuilt (`npx vite build`)
4. `memory.md` — this entry

Not modified: authentication, RBAC, sidebar, favicon, WebMCP (it calls the same fixed `fetchAssets`/`fetchAsset`, so MCP `last_repair_at` output is fixed too), dashboards, database schema/functions, unrelated UI. Repair history itself untouched — `fetchAssetRepairHistory` already ordered by `resolved_at desc` correctly.

### Verification performed
- Live PostgREST call confirmed old embed returns objects: `last_repair_at: [{"resolved_at": null}]` for PROJ-023/MON-044 (open repairs) and `[]` for assets with no repairs — matching the root cause exactly.
- Simulated the fixed shaping logic against all 7 live assets: LAP-018 → "Sep 12, 2026" (RD-1001 CLOSED), MOB-011 → "Sep 12, 2026" (RD-1004 CLOSED), LAP-022/NET-005/PRN-011 → "—" (no repairs), MON-044 (RD-1002 OPEN) → "—", PROJ-023 (RD-1003 IN_REPAIR) → "—". Both required cases verified: history → real date; no history/open-only → "—".
- Confirmed the corrected embed (`resolved_at, status`) returns clean ISO dates for CLOSED repairs (e.g. `2026-09-12T15:16:53.800438+00:00`).
- `npm run typecheck` passes; production build regenerated.

### Current status
FIXED and VERIFIED. Asset Directory "Last Repair" and Asset Details "LAST REPAIR" now show the real latest completed/closed repair date; assets without completed repairs show "—" (existing empty value). Formatting ("Sep 12, 2026") is unchanged `formatDate` output, consistent with the existing design.

---

## Entry 4 — 2026-09-17: Native WebMCP registration (Problem: Tool Inspector cannot discover tools) — IN PROGRESS

### Original WebMCP problem
RepairDesk's WebMCP implementation is a custom MCP/JSON-RPC bridge mounted as `window.repairdeskMcp` on the standalone `mcp.html` page (src/mcp/main.ts). That is NOT the browser's native WebMCP mechanism, so Chrome's WebMCP Tool Inspector cannot discover the tools on the actual application page.

### Root cause
No code ever called the native `document.modelContext.registerTool()` API. The browser-facing integration was postMessage/JSON-RPC only, and it lived on `mcp.html` instead of the authenticated React app, so agents using the native WebMCP surface found nothing.

### Environment facts verified BEFORE implementation
- Installed Chrome 153.0.8010.48 (also Edge 153 available).
- Probed headless Chrome: default = NO WebMCP. With `--enable-features=WebMCP`: `document.modelContext` is an EventTarget with exactly `registerTool`, `getTools`, `executeTool(tool, inputArgumentsJsonString)`, `ontoolchange`. No `unregisterTool`/`provideContext`. Re-registering the same name throws "Duplicate tool name". So: registration must be once-per-page and idempotent; role/auth enforcement must stay dynamic inside the handlers (executeTool), which the existing tool layer already does.

### Planned native WebMCP approach
- New `src/mcp/registerTools.ts`: ambient TS typings for the native API + feature-detect + idempotent registration of the EXISTING `TOOLS` from src/mcp/tools.ts. Handlers delegate to the existing `executeTool()` (auth + RBAC + RLS + audit unchanged). MCP-shaped result `{content:[{type:'text',text:JSON}}`; errors thrown as `[CODE]: message` per WebMCP error semantics.
- Wire into `src/App.tsx`: register once the authenticated `user` (profile) is available; no re-registration on role change (execute-time RBAC); no unregister exists — logged-out calls fail UNAUTHENTICATED via executeTool.
- `create_repair_ticket` aligned to the product rule: only EMPLOYEE may create/report repair tickets (add `roles: ['EMPLOYEE']` in tools.ts + description update). ADMIN/MANAGE manage/assign; TECHNICIAN works assigned repairs. Repair lifecycle unchanged.
- Add MCP `annotations` (readOnlyHint etc.) to tool definitions; merge in legacy mcp.html manifest.

### Status
COMPLETED and VERIFIED (2026-09-18).

### Files changed
1. `src/mcp/registerTools.ts` — NEW: native WebMCP registration layer. Ambient-feature-detects `document.modelContext`, idempotently registers all existing TOOLS (memoized promise — Chrome rejects duplicate names, React StrictMode-safe), maps names/descriptions/inputSchemas 1:1, adds MCP `annotations` (readOnlyHint/idempotentHint for read tools, destructiveHint false). Handlers delegate to the EXISTING `executeTool()` (src/mcp/tools.ts) — zero duplicated business logic.
2. `src/mcp/webmcp.d.ts` — NEW: ambient TS typings for the draft WebMCP API (registerTool/getTools/executeTool/ontoolchange + AbortSignal options).
3. `src/App.tsx` — registers native WebMCP tools via `useEffect` when the authenticated `user` profile is available (8 lines). Not on mcp.html; not on public pages.
4. `src/mcp/tools.ts` — `create_repair_ticket` aligned to the product rule: added `roles: ['EMPLOYEE']` + description rewritten (only EMPLOYEE may create/report tickets; ADMIN/MANAGER manage/assign; TECHNICIAN works assigned repairs). No other tools changed. Repair lifecycle and all other role restrictions untouched.
5. `DEMO_ACCOUNTS.md` — WebMCP section updated: native WebMCP is now primary; legacy JSON-RPC bridge marked debug/compatibility.
6. `memory.md` — this entry.

### Authentication / RBAC handling (unchanged model, verified)
- Registration happens only on the authenticated app (user profile present). Pre-auth `getTools()` = 0 tools.
- Handlers resolve the CURRENT Supabase session per execution inside `executeTool()` → login, logout, session refresh, and role changes are all enforced at execute time. Verified: post-signout call returned `ERROR [UNAUTHENTICATED]`.
- No anonymous/unauthenticated tool path exists; no second authorization system; Supabase RLS + business RPCs remain the enforcement layer.

### Native WebMCP approach implemented (exact semantics, probed on Chrome 153.0.8010.48 with `--enable-features=WebMCP` / `#enable-webmcp-testing`)
- `document.modelContext.registerTool({name, description, inputSchema, annotations, execute})` → Promise; duplicate name throws "Duplicate tool name"; `getTools()` returns discovery objects (`name, description, inputSchema, title, origin, window`); `mc.executeTool(toolFromGetTools, JSON.stringify(args))` executes and returns serialized MCP content; no unregisterTool/provideContext in shipping Chrome 153.
- Error shape: execute failures return MCP content `{content:[{type:'text',text:'ERROR [CODE]: message'}], isError:true}` (same convention as the legacy bridge) because Chrome collapses thrown JS errors into a generic message. Verified codes surfaced: FORBIDDEN / NOT_FOUND / UNAUTHENTICATED.

### create_repair_ticket permission alignment (verified live, all three roles)
- EMPLOYEE (jordan.davis): created RD-1005 for own asset LAP-018 → success (ticket then deleted to restore demo data).
- TECHNICIAN (sam.chen): FORBIDDEN — "Your role (TECHNICIAN) is not permitted to use create_repair_ticket."
- ADMIN (admin@repairdesk.io): FORBIDDEN — same for ADMIN.
- Backend RPC `create_repair_ticket` (SECURITY DEFINER) still additionally enforces: authenticated org user, same-org asset, EMPLOYEE-only-own-asset, retired-asset rejection, title/description length. Four roles preserved; no fifth role; no permission broadening.

### Verification performed (live, dev server + headless Chrome 153 with WebMCP enabled, CDP-driven real UI login)
- Native API available on authenticated page: YES (`typeof document.modelContext.registerTool === 'function'`).
- Tools registered: 14/14 (all TOOLS), discoverable via `getTools()` — the same registry Chrome's WebMCP Tool Inspector reads. Pre-auth: 0 tools.
- Read-only tools executed through the native API: `get_asset_status` (LAP-018, PROJ-023, MON-044), `search_assets` (EMPLOYEE saw only own 2 assets; TECHNICIAN/ADMIN saw 7), `check_warranty` (LAP-018 ACTIVE, PROJ-023 EXPIRED, MON-044 EXPIRING_SOON), `search_repairs` (EMPLOYEE→2 own, TECHNICIAN→2 assigned, ADMIN→5 org-wide), `get_repair` (RD-1002 full detail).
- Permission-sensitive rejections verified: `find_available_technicians`/`get_technician_workload` FORBIDDEN for EMPLOYEE and TECHNICIAN, OK for ADMIN; technician could not read RD-1003 (not assigned, NOT_FOUND) nor update RD-1002; employee cross-user `check_warranty` MON-044 rejected (NOT_FOUND).
- Logout lifecycle: sign-out via real UI → subsequent `get_asset_status` returned UNAUTHENTICATED.
- Audit trail: every native execution logged in `webmcp_tool_executions` with tool_name/success/error/duration (queried live).
- `npm run typecheck` and `npm run build` pass; dist rebuilt.
- Note: verification used `getTools()`/`executeTool()` (the exact registry + execution path the Tool Inspector uses) driven over CDP, since the Inspector panel itself is an interactive Chrome UI. Discovery, schema exposure, and execution on the authenticated page are confirmed end-to-end.

### Final status
COMPLETE. "The RepairDesk tools are registered through the browser's native WebMCP API on the authenticated application page, and Chrome's WebMCP Tool Inspector can discover them" — TRUE for WebMCP-enabled Chromium 146+ (requires `#enable-webmcp-testing` flag; on the installed Chrome 153 verified with `--enable-features=WebMCP`). The legacy `window.repairdeskMcp` / mcp.html bridge remains only as debug/compatibility, not the primary discovery mechanism. No separate backend MCP server; no UI/design changes; existing four roles, repair lifecycle, and all other tool permissions preserved.
