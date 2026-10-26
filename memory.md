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
---

## Entry 5 — 2026-09-21: WebMCP role discovery, activity visibility, search usability, and scrollbar styling

### Problem identified and root cause
Native registration exposed all tools to every authenticated role, dashboard log queries omitted actor filtering for employee/technician views, `search_assets` did not clearly document empty-query behavior, and log containers used the browser default scrollbar.

### Changes made
- `src/mcp/registerTools.ts` now filters existing `TOOLS` by the authenticated `AppRole`; handlers still delegate to `executeTool()` for independent authentication, RBAC, business rules, and RLS enforcement.
- `src/App.tsx` re-evaluates registration when the authenticated user or role changes and resets state after sign-out.
- Employee and technician dashboard/activity queries filter `webmcp_tool_executions` by `actor_id`; admin/manager dashboards retain organization activity behavior.
- `src/mcp/tools.ts` now explicitly documents query-present search by asset tag/name/serial, empty/omitted query returning all visible assets, and status filtering.
- WebMCP log containers use a scoped dark-log scrollbar matching the existing yellow/orange neo-brutalist visual language.

### Files modified
`src/mcp/registerTools.ts`, `src/App.tsx`, `src/mcp/tools.ts`, `src/pages/employee/Dashboard.tsx`, `src/pages/technician/Dashboard.tsx`, `src/pages/technician/MyRepairs.tsx`, `src/pages/admin/Dashboard.tsx`, `src/components/ui/primitives.tsx`, `src/index.css`, `dist/*`, and `memory.md`.

### Validation/testing
- `npm run typecheck` passed.
- `npm run build` passed and regenerated `dist/*`.
- Code paths were reviewed for registration, role filtering, execution delegation, activity queries, search metadata, and scoped scrollbar CSS.
- Manual four-account Chrome WebMCP Tool Inspector validation was not performed in this continuation; live role-by-role discovery, activity assertions, and visual inspection remain to be verified.

### Final status
Implementation complete and build-verified. All four requested code changes are present. Remaining limitation is interactive browser validation across EMPLOYEE, TECHNICIAN, MANAGER, and ADMIN accounts.

---

## Entry 6 — 2026-09-22: Fix WebMCP activity-log visibility at RLS layer

### Problem investigated
Employee and technician dashboard components already queried `webmcp_tool_executions` with `.eq('actor_id', user?.id ?? '')`; the activity log was still empty for those roles. The previous frontend-only assumption was incorrect.

### End-to-end findings
- `src/mcp/tools.ts` `executeTool()` calls `logExecution()` exactly once per outcome path: unknown tool, role denial, success, or caught failure. `logExecution()` resolves the application profile through `users.auth_user_id = auth.uid()` and inserts `actor_id: user.id`, so `actor_id` is the application `public.users.id`, not the Supabase Auth UID.
- Live schema verified `webmcp_tool_executions.actor_id` has a foreign key to `public.users(id)`.
- Live `app.current_org()` resolves organization from `public.users.auth_user_id = auth.uid()`.
- Before the fix, `webmcp_exec_select` allowed only `(organization_id = app.current_org()) AND app.is_manager_or_admin()`. Employee/technician actor filters could therefore never return rows. The old insert policy checked organization only.
- Registration, tool definitions, dashboard rendering, and scoped activity filters were not changed.

### Database fix applied
Applied Supabase migration `fix_webmcp_activity_log_visibility` to project `puaobtjdcnlxixplpqjx`:
- Replaced `webmcp_exec_select` with organization scope plus either manager/admin role or `actor_id = (select id from public.users where auth_user_id = auth.uid())`.
- Replaced `webmcp_exec_insert` with organization scope plus the same authenticated app-user actor check. This prevents one authenticated user from attributing a log to another app user.
- No table structure, tool registration, logging call count, UI, design, or unrelated policy was changed.

### Validation
- Live policies after migration show the exact organization + own-actor condition for inserts and organization + manager/admin-or-own-actor condition for selects.
- Authenticated role checks using the documented demo accounts (passwords not recorded here): EMPLOYEE saw 2 assets and 16 visible logs, all 16 own; TECHNICIAN saw 7 assets and 18 visible logs, all 18 own; MANAGER saw 45 organization logs; ADMIN saw 45 organization logs.
- Cross-actor EMPLOYEE insert was rejected: `new row violates row-level security policy for table "webmcp_tool_executions"`.
- Live execution records contain app-user IDs matching `users.id`; no auth UID was used as `actor_id`.
- `npm run typecheck` passed.
- `npm run build` passed and regenerated `dist/*`.
- No temporary audit row was created by the final insert test. The attempted own-insert probe was not completed because the corrected employee policy intentionally hides other actors, so no claim is made for a separately-created own insert. Existing production logs and the unchanged single `logExecution()` path verify normal execution logging remains intact.

### Files and database objects changed
- Database only: Supabase migration/policies on `public.webmcp_tool_executions`.
- `dist/*` was regenerated by the existing production build command.
- `memory.md` appended with this entry.
- No source TypeScript/TSX files changed for this fix.

### Current status
FIXED and VERIFIED for the requested RLS visibility boundaries and build. Browser visual inspection and a separately-created authenticated own-actor insert were not performed; both are non-blocking for the policy diagnosis because the existing logging path already writes valid app-user actor IDs and the cross-actor write denial is live-verified.

---

## Entry 7 — 2026-09-26: Role-aware native WebMCP tool registration (exact 10/11/13/13 matrix)

### Problem
Chrome's WebMCP Tool Inspector showed tools that the signed-in role must not see: EMPLOYEE received `update_repair_status` (11 tools instead of 10), and after logout/in-page role switch the previous role's tools stayed discoverable (stale registrations).

### Root cause
1. `src/mcp/registerTools.ts` `getToolsForRole()` treated `roles: undefined` as "available to every role" (deny-by-omission). Nine tools, including `update_repair_status`, declared no `roles`, so they were registered for ALL roles — including EMPLOYEE. `nativeWebmcpManifest()` had the same "roles omitted = all roles" fallback.
2. Registration called `document.modelContext.registerTool(descriptor)` without the second `{ signal }` option, and `resetRegistration()` only cleared module state. Chrome 146+/153 has no `unregisterTool`, so previously registered tools were never removed on sign-out or role change — only a full page reload produced a clean list.

### Role matrix implemented (explicit allow-lists in `src/mcp/tools.ts`; registration is DENY-by-default)
- Shared core (9, all roles): `search_assets`, `get_asset`, `get_asset_status`, `check_warranty`, `get_asset_repair_history`, `search_repairs`, `get_repair`, `add_repair_note`, `get_repair_history`.
- `create_repair_ticket`: EMPLOYEE only.
- `update_repair_status`: ADMIN, MANAGER, TECHNICIAN (EMPLOYEE excluded — NEW explicit roles entry).
- `get_operational_alerts`: ADMIN, MANAGER, TECHNICIAN.
- `find_available_technicians`, `get_technician_workload`: ADMIN, MANAGER.
Totals: EMPLOYEE 10, TECHNICIAN 11, MANAGER 13, ADMIN 13. No duplicates (name-dedupe in `toolsForRole`). No technician-assignment tool added; four roles unchanged; ADMIN/MANAGER identical lists.

### Files changed
1. `src/mcp/tools.ts` — `McpTool.roles` is now a REQUIRED explicit `AppRole[]` ("undefined = all roles" comment removed); every tool declares its roles explicitly (`ALL_ROLES` constant for the shared core); `update_repair_status` gained `roles: ['ADMIN','MANAGER','TECHNICIAN']`; `executeTool()` role gate hardened to deny when `roles` missing/empty; `toolManifest()` no longer fabricates an all-roles default. Tool implementations/business logic unchanged.
2. `src/mcp/registerTools.ts` — `toolsForRole(role)` single-source resolver: explicit non-empty `roles` required (deny-by-default) + per-role name dedupe. Each registration batch now creates an `AbortController` passed as `registerTool(descriptor, { signal })`; `registerNativeWebmcpTools(newRole)` aborts the previous batch (unregisters stale tools) before registering; `resetRegistration()` (sign-out) aborts too, so `getTools()` is empty while logged out. Handlers still delegate to `executeTool()` — execute-time auth/RBAC/RLS/audit untouched. `nativeWebmcpManifest(role)` now derives from `toolsForRole` (no separate matrix, role required).
3. `src/App.tsx` — NOT changed (existing effect on `user?.id`/`user?.role` + `resetRegistration()` on no-user already drives the refresh lifecycle; the fixes are inside the registration layer).
4. `dist/*` — rebuilt (`npm run build`).

### Validation performed (real Chromium CDP automation, not assumed)
Environment: `npm run preview` (dist build on :4173) + Chrome 154.0.8037.58 `--headless=new --enable-features=WebMCP` driven over CDP (`:9333`); login/sign-out through the real React UI (AuthPage form + Sidebar sign-out button); tool discovery read via `document.modelContext.getTools()` — the exact registry the WebMCP Tool Inspector displays (the Inspector panel itself is interactive-only Chrome UI and cannot be automated; same methodology as Entry 4).
- Native API present on authenticated app page; PRE-AUTH `getTools()` = 0 tools.
- Exact-set + exact-count verification per demo account, zero duplicates: EMPLOYEE (jordan.davis) = 10, TECHNICIAN (sam.chen) = 11, MANAGER (tanya.miller) = 13, ADMIN (admin@repairdesk.io) = 13. EMPLOYEE list contains `create_repair_ticket` and excludes `update_repair_status`/alerts/workload; TECHNICIAN contains `update_repair_status`+`get_operational_alerts` and excludes `create_repair_ticket`/workload tools; MANAGER=ADMIN 13 identical sets.
- Allowed tool executed per role through the native API: EMPLOYEE `get_asset_status`(LAP-018) ✓, TECHNICIAN `search_assets` ✓, MANAGER `find_available_technicians` ✓, ADMIN `get_technician_workload` ✓.
- Execution-time authorization still enforced: EMPLOYEE `check_warranty`/`create_repair_ticket` on another user's MON-044 → `NOT_FOUND`; TECHNICIAN `update_repair_status` on unassigned RD-1002 → `NOT_FOUND`; ADMIN forcing `create_repair_ticket` via the legacy bridge (`executeTool` path, tool NOT registered for ADMIN) → `FORBIDDEN: Your role (ADMIN) is not permitted...` — confirming registration filtering is not the only defense.
- Stale-tool lifecycle: after UI sign-out (no page reload) `getTools()` = 0 for all four roles — abort-signal unregistration confirmed working in Chrome 154. In-page switch EMPLOYEE→(sign out)→TECHNICIAN without reload: exactly 11 tools, `update_repair_status` present, `create_repair_ticket`/workload tools absent.
- `npm run typecheck` + `npm run build` pass. No probe mutation landed in demo data (all rejection paths).

### Final status
COMPLETE and VERIFIED for all four roles (10/11/13/13, no duplicates, no stale tools, execution RBAC + RLS intact).

### Remaining notes
- Registration filtering is a DISCOVERY control only; `executeTool()` + Supabase RLS remain the enforcement layer (defense in depth preserved).
- `mcp.html` legacy bridge `tools/list` derives from the now-explicit `toolManifest()`, so it matches the same matrix (13 for ADMIN verified live).
- Verification used `getTools()`/`executeTool()` over CDP because the Inspector panel can't be scripted; run the Inspector manually with `#enable-webmcp-testing` for the visual check.

---

## Entry 8 — 2026-10-01: Fix Vercel 404 on hard refresh of SPA routes (production deep-link routing)

### Problem
On the deployed app (https://repairdesks.vercel.app), refreshing the browser on any React Router path (`/dashboard`, `/notifications`, `/settings`, `/assets`, `/repair-history`, `/my-repairs`, `/my-assets`, `/my-issues`, `/repairs/:id`) returned the Vercel "404 NOT_FOUND" page instead of the app. Client-side navigation worked; only direct server GETs of route paths failed.

### Exact root cause (verified live, not assumed)
The repository had NO Vercel configuration at all — no `vercel.json`, no `public/_redirects`, no `.vercel` project settings. Vercel served the Vite `dist` output as a plain static file set, so only real paths existed server-side: pre-fix probe returned `/` → 200, `/mcp.html` → 200, `/logo.png` → 200, but `/dashboard`, `/notifications`, `/settings` → **404**. BrowserRouter deep links need a server-level fallback rewrite to `index.html`; without it every hard refresh issues a GET for a path that doesn't exist as a file. No routing/auth/build code was involved — purely a deployment-config gap.

### Exact files changed
1. `vercel.json` — NEW (only file changed; commit `5c3f586`, pushed to `origin/main`, auto-deployed via the GitHub Vercel integration for Debjitds/RepairDesk):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
No source, UI, routing, build, auth, WebMCP, or database code was modified.

### Why this doesn't hijack real resources
Vercel applies `rewrites` AFTER the filesystem check: existing files always win. `/assets/*` (JS/CSS), `/logo.png`, `/mcp.html`, and favicon paths are real files in `dist` and keep serving with their original content types — verified in production after deploy (see below). `index.html` fallback is the standard Vercel SPA pattern; no client-side redirect hacks were added.

### Local validation
`npm run build` clean; served via `npm run preview` (production build, :4173) and validated with CDP-driven Chrome (real UI login): direct GET of 9 route paths → 200 app shell; `/mcp.html`, `/logo.png`, hashed `/assets/*` intact with correct content types; client-side sidebar nav + hard reload on `/notifications`, `/settings`, `/assets`, `/repair-history` stayed on route, still authenticated, fully rendered; ADMIN→`/my-repairs` role guard still redirected to `/dashboard`; unauthenticated `/dashboard` still bounced to `/auth`. 25/25 checks passed.

### Production/Vercel validation (real deployed app)
After pushing `vercel.json`, `/dashboard` flipped 404→200 within ~16s (Git-integration auto-deploy). Full suite re-run against https://repairdesks.vercel.app: 27/27 checks passed — every route direct-GETs 200; assets/`mcp.html`/`logo.png` not hijacked; ADMIN (admin@repairdesk.io) and EMPLOYEE (jordan.davis) hard-refreshed protected routes while staying signed in with correct pages rendered. Extra role coverage: TECHNICIAN (sam.chen) hard reload `/my-repairs` ✓ and MANAGER (tanya.miller) hard reload `/assets` ✓.

### Authentication/role validation
Supabase session persists across hard refreshes (localStorage) on production for all tested accounts; `RequireAuth` role protection and the unauthenticated `/auth` bounce behave exactly as before — the rewrite only affects the HTTP entry, not app logic.

### WebMCP validation
After hard refresh on production: ADMIN → exactly 13 tools, EMPLOYEE → exactly 10 (incl. `create_repair_ticket`, excl. `update_repair_status`), TECHNICIAN → exactly 11 (incl. `update_repair_status`+`get_operational_alerts`, excl. `create_repair_ticket`/workload), MANAGER → exactly 13; post-sign-out 0 tools; `get_technician_workload` executed successfully through `document.modelContext.executeTool` on the deployed site. Role-aware registration, mcp.html legacy bridge, executeTool() authorization, and RLS all intact.

### Final status
FIXED and VERIFIED IN PRODUCTION. Hard refresh works on all valid routes for all four roles; no Vercel 404 remains.

### Remaining issue
None. Note for future work: if Edge Functions or additional API routes are ever added under paths that also exist as real files, re-check the filesystem-before-rewrite precedence (real files still win; only non-existent paths fall through to `index.html`).

---

## Entry 9 — 2026-10-23: Idempotent repair-ticket submission (E2E duplicate-submission + error-handling + employee-history findings)


### Problem (from automated E2E suite — 6 findings)
1. Four duplicate-submission scenarios all flagged the same symptom: submitting the same repair request twice created two open tickets (pre-existing duplicate pairs in demo data: RD-1006/RD-1016 "Laptop overheating during work", RD-1008/RD-1018, RD-1014/RD-1022, RD-1013/RD-1021 — all LAP-018).
2. One scenario claimed a failed submission lost the form and showed no error ("page returned to My Assets", "no submission error displayed").
3. One scenario could not find an employee "Repair History" page to search.

### Exact root cause
All four duplicate scenarios share ONE root cause: the create path was not idempotent.
1. `src/services/repairService.ts` `createRepairTicket()` called the `create_repair_ticket` RPC (SECURITY DEFINER) unconditionally — the RPC validates auth, org, asset ownership, retired status, and title/description lengths, but performs NO duplicate check, so every call inserts a new ticket.
2. `ReportIssueModal.submit()` in `src/pages/employee/Dashboard.tsx` disabled the button via `busy` state but never early-returned on `busy` inside the handler, so two rapid submit events (double Enter/click, automated retry) could both start before React re-rendered.
3. The WebMCP `create_repair_ticket` tool (`src/mcp/tools.ts`) calls the same service, so agent/e2e repeats hit the same non-idempotent path.
The "form lost / no error" finding did NOT reproduce in current `src` — the modal already keeps state and renders an inline `FormError` on failure; the behavior matches the older deployed bundle that predated the in-flight guards (stale-build artifact, not a separate code bug).
Business rule confirmed BEFORE enforcing (PRD "Reliability": *prevent duplicate or conflicting operations*; TRD: *"duplicate ticket creation caused by repeated requests"*; architect.md §35: *avoid duplicate repair creation*; no doc forbids reusing a title later): **same asset + same title is a duplicate only while a matching ticket is OPEN (status not in RESOLVED/CLOSED)**. Once the prior ticket is RESOLVED/CLOSED, the same title is a legitimate recurring-issue report and a new ticket IS created.

### Exact files changed
1. `src/services/repairService.ts` — `createRepairTicket()` made idempotent and its return changed from `Promise<Repair>` to `Promise<{ repair: Repair; created: boolean }>`:
   - `normalizeTicketTitle()` — trim, collapse whitespace, lowercase (duplicate-match key).
   - Module-level `createTicketInFlight` Map keyed `asset_id|normalized title` — concurrent identical calls share ONE in-flight promise (kills the double-submit race for both UI and tool callers); entry removed in `finally`.
   - Pre-check query BEFORE any write: `repairs` select filtered `.eq('asset_id')` + `.not('status','in','("RESOLVED","CLOSED")')` + limit 50; client-side normalized-title match returns the existing ticket with `created:false` (no INSERT issued at all). If the pre-check query itself fails, flow falls through to the RPC (which remains the final validator) — fail-open on read error only.
   - RPC call unchanged otherwise; auth/RBAC/RLS untouched.
2. `src/pages/employee/Dashboard.tsx` — `ReportIssueModal` (shared by employee Dashboard, My Issues, My Assets):
   - `submit()` early-returns when `busy` (in-flight guard independent of button disabled state).
   - On `created:false` (duplicate): modal STAYS OPEN, all entered values preserved, lime success banner "Already submitted — ticket #RD-xxxx is still open for this issue. No duplicate ticket was created.", submit button latches to disabled "Already Submitted" (re-enabled when asset/title is edited). On `created:true`: closes + refreshes as before. On error: stays on the form with inline `FormError` and preserved values (issue-5 requirement).
   - `FormSuccess` added to the primitives import.
3. `src/mcp/tools.ts` — `create_repair_ticket` tool updated to the new `{repair, created}` service shape; result now includes `duplicate: !created` and a "Duplicate prevented: …" message; tool description documents the idempotent behavior for agents. Roles matrix (`['EMPLOYEE']`) and every other tool unchanged.
4. `dist/*` — regenerated via `npm run build`.
5. `memory.md` — this appended entry (no previous entries modified or deleted).

### Exact Vercel/routing fix
NONE required or applied in this task. `vercel.json` SPA rewrite from Entry 8 is unchanged and still in place; no route paths changed; no new pages/nav added. (Reminder: the fix only reaches production after commit + push — Vercel auto-deploys from Git; nothing was committed during this task.)

### Employee Repair History finding (issue 6) — test assumption wrong, NO feature added
`docs/rules.md` §9 "Approved Pages" lists Employee pages as exactly: Dashboard, My Issues, My Assets, Notifications, Settings — with "Do not invent additional navigation sections without a requirement." The PRD permission matrix grants employees "Related/own relevant history", which is already delivered by (a) My Issues — searchable across ticket/asset/issue/technician with status filters including RESOLVED/CLOSED, and (b) the Asset Detail page "Repair History" panel. The Sidebar EMPLOYEE nav already matches the approved set. Correct action: point the `Search employee repair history records` scenario at `/my-issues` (or the Asset Detail history panel), not a nonexistent employee `/repair-history` route (that route is ADMIN/MANAGER/TECHNICIAN only by design).

### Local validation (live browser run, not assumed)
- `npm run typecheck` passed; `npm run build` passed (109 modules, clean).
- Dev server (`npm run dev`, :5173) + real browser, logged in through the UI as EMPLOYEE jordan.davis:
  - Baseline My Issues: 20 tickets (18 open, 2 resolved); open duplicates RD-1006/RD-1016 present for "Laptop overheating during work" (LAP-018).
  - Resubmitted the exact same asset+title via Report an Issue: modal stayed open, values preserved, banner showed "Already submitted — ticket #RD-1016 is still open for this issue. No duplicate ticket was created.", button disabled as "ALREADY SUBMITTED" with tooltip.
  - Network log confirmed the duplicate check is a read-only GET on `repairs` and NO POST/INSERT was issued.
  - After hard reload (fresh DB read): counts unchanged (20/18), highest ticket still RD-1022 (no RD-1023), still exactly 2 tickets with that title — no new duplicate.
  - In-flight "SUBMITTING…" disabled state observed on click (rapid double-click cannot fire a second request).
  - Screenshots: `01_myissues_before.png`, `02_duplicate_banner.png`, `03_myissues_after.png` (repo root). No console errors (only pre-existing React Router v7 future-flag warnings).

### Production/Vercel validation
NOT performed — changes are local only (`src` + rebuilt `dist`); they must be committed/pushed for Vercel auto-deploy, then the E2E scenarios re-run against https://repairdesks.vercel.app. No claim is made for the deployed site.

### Authentication/role validation
Unchanged and preserved: Supabase RLS untouched, `create_repair_ticket` RPC still the final validator (authenticated org user, same-org asset, EMPLOYEE own-asset only, retired rejection, length checks). The pre-check SELECT runs under the caller's own RLS policy (employee sees own/related repairs — verified live under the jordan.davis session). No new pages, no nav changes, no permission broadening; four roles intact.

### WebMCP validation
`create_repair_ticket` tool code updated (new service return shape, `duplicate` flag, idempotency description) and typecheck/build pass, but role-by-role tool discovery/execution was NOT re-run live in a WebMCP-enabled Chrome in this session. The 10/11/13/13 role matrix, registration lifecycle, and execute-time RBAC were not modified by this fix (only the tool's run() body/description and the shared service changed).

### Final status
FIXED and VERIFIED LOCALLY for the duplicate-submission flow (single shared fix; the other three duplicate scenarios exercise the identical code path but were not individually re-run). Issue 5 (error handling) hardened in code and consistent with current source; original report attributed it to a stale deployed bundle. Issue 6 resolved as "test assumption wrong" — no unnecessary feature added. NOT yet deployed or re-verified in production.

### Remaining issues
1. Pre-existing duplicate tickets created BEFORE the fix remain in the demo DB (RD-1006/1016, RD-1008/1018, RD-1013/1021, RD-1014/1022, RD-1011/1019); the guard prevents NEW duplicates only. Cleanup needs DB access.
2. No DB-level uniqueness enforcement was added: the Supabase MCP server returned "Unauthorized (no SUPABASE_ACCESS_TOKEN)", so the RPC definition could not be inspected or amended. Recommended follow-up once authorized: duplicate guard (or partial unique index on `(asset_id, lower(title)) WHERE status NOT IN ('RESOLVED','CLOSED')`) inside `create_repair_ticket`, so protection is not client-side-only.
3. Client-side guard covers same-browser/session races; two different clients submitting the identical new title within the same instant could still both pass the pre-check until the RPC-side constraint from item 2 exists.
4. The `created:true` (first-time creation) path was not exercised live (existing open duplicate intercepted the verification submit, which was intentional to avoid polluting demo data); covered by typecheck/build and unchanged RPC logic, but re-run the E2E suite after deploy to confirm end-to-end.
5. Changes are uncommitted; production verification of all six scenarios is pending deploy.

---

## Entry 10 — 2026-10-26: E2E follow-up — refine duplicate rule to title+description, no silent success, My Issues RESOLVED consistency, notification read-state, profile auto-onboarding

### Problem (second automated E2E run — 6 findings, builds on Entry 9)
1. `Create a repair ticket for an assigned asset`: submission blocked as a duplicate but the pointed-to ticket's description did not match what was typed.
2. `Employee creates a repair ticket for an assigned asset`: a genuinely new issue was NOT created as a distinct ticket — reused an existing open ticket (RD-1025).
3. `Handle repair submission errors gracefully`: a submission the test expected to fail surfaced no visible error and looked recorded as an open issue (silent success).
4. `Review repeated failure indicators`: Repair History showed LAP-018 repeatedly; RESOLVED summary read 2 while the filtered list read 0 requests / "No issues found".
5. `Open notifications and mark a message as read`: unread count dropped to 0 after "Mark All As Read" but the read message could not be confirmed in the read inbox (inbox appeared empty).
6. `Review relevant repair history for an assigned asset`: employee dashboard stuck on "No Application Profile" — authenticated but not onboarded to an org (flagged Environment).

### Exact root causes
1. **Duplicate rule too coarse (title-only).** Entry 9's `createRepairTicket()` matched open tickets on normalized TITLE alone, so a different problem that shared a short title (or a same-title report whose prior ticket differed) was swallowed and the *existing* ticket (different description) was returned — hence the description mismatch and the missing new ticket. Verified live in DB: Jordan's LAP-018/MOB-011 had ~20 accumulated OPEN tickets with near-identical titles from repeated runs (RD-1006…RD-1032).
2. **Duplicate shown as SUCCESS.** `ReportIssueModal` rendered the duplicate `notice` via the green `FormSuccess` banner, which reads as a successful create — the "silent success" the test flagged. Real RPC/validation errors were already surfaced via inline `FormError`.
3. **Summary vs list grouping mismatch (My Issues).** The RESOLVED KPI card counted `['RESOLVED','CLOSED']` (grouped = 2), but the status chips filtered on EXACT `r.status === filter`; clicking RESOLVED returned 0 because the two completed LAP-018 records (RD-1001, RD-1004) are CLOSED, not RESOLVED → summary 2 vs list 0.
4. **Read transition not observable + navigation side-effect.** The notification row `onClick` marked it read AND immediately `openRelated()` navigated away, so the tester never saw the item settle in the read inbox; there was no per-row mark-as-read control and no visible Read state.
5. **Profile gap for authenticated-but-unprovisioned accounts.** The signup DB trigger `handle_new_auth_user` provisions NEW auth users, but an account that exists without a `public.users` row (created outside the trigger, or a post-signup race) fell to the `RequireAuth` `!user` "No Application Profile" wall — no self-heal path.

### Business rule (updated)
A submission is a TRUE duplicate only when the same asset + normalized TITLE **and** normalized DESCRIPTION all match an OPEN ticket (status not RESOLVED/CLOSED). Same title with a different description = a distinct issue → new ticket. Recurring reports after RESOLVED/CLOSED still create new tickets. This supersedes Entry 9's "same asset + same title" duplicate key.

### Files changed
1. `src/services/repairService.ts` — `normalizeTicketTitle`→`normalizeTicketText`; in-flight key is now `asset_id|normTitle|normDescription`; open-ticket pre-check (limit raised 50→100) matches on title **AND** description before returning `{created:false}`. Return shape, RPC delegation, and fail-open-on-read-error unchanged.
2. `src/components/ui/primitives.tsx` — NEW `FormWarning` (amber `bg-signal-orange`) for prevented/blocked actions that are NOT a successful create.
3. `src/pages/employee/Dashboard.tsx` — `ReportIssueModal`: duplicate path now renders via `FormWarning` naming the exact matching ticket (`#RD-xxxx "title"` + "edit title or description to report a different problem"); removed the now-unused `FormSuccess` import. Real errors still inline `FormError`; success still closes modal.
4. `src/mcp/tools.ts` — `create_repair_ticket` description + duplicate message updated to the title+description rule; `requireUser()` now falls back to `ensure_current_profile` RPC instead of throwing on a missing profile (execute-time RBAC/RLS unchanged).
5. `src/pages/employee/MyIssues.tsx` — chips list `OPEN_STATUSES`→`STATUS_CHIPS` (dropped separate CLOSED chip); added `statusMatches(r, filter)` so the RESOLVED chip groups RESOLVED+CLOSED exactly like the KPI; each chip now shows a live count; filtered list uses `statusMatches`. Summary and list counts always agree.
6. `src/hooks/useAsyncData.ts` — added `setData(updater)` to the returned API for optimistic local updates without a full refetch.
7. `src/pages/shared/Notifications.tsx` — per-row **Mark as Read** button + visible **Read**/Unread badge; row body now only navigates on the linked-repair/asset strip (marking no longer navigates away); `markAllRead`/`markOneRead` optimistically flip local `is_read` (so the item stays visible in All/Read) and each handler has try/catch with an inline `ErrorState` (`actionError`) + retry; `clearRead` guarded too. Read notifications remain in the All/Read view.
8. Database (Supabase project `puaobtjdcnlxixplpqjx`, migration `add_ensure_current_profile_rpc`) — NEW `public.ensure_current_profile()` SECURITY DEFINER RPC (search_path public/auth): returns the caller's existing profile, else provisions them into the `RepairDesk HQ` org as EMPLOYEE (mirrors `handle_new_auth_user`), raising `NO_ORGANIZATION` if no default org; `REVOKE ... FROM PUBLIC` + `GRANT EXECUTE TO authenticated`. Consumed by `authService.loadCurrentUser` and WebMCP `requireUser`.
9. `dist/*` — rebuilt via `npm run build`.
10. `memory.md` — this appended entry (no prior entries modified/deleted).

### Long-standing instruction adopted
The user asked that `memory.md` be updated on EVERY change going forward. Treat this file as the permanent, append-only change log: after any code, config, or DB change, append a new dated Entry (problem, root cause, files changed, verification, status) before ending the task.

### Verification
- `npx tsc -p tsconfig.app.json --noEmit` clean.
- `npm run build` (`tsc -b && vite build`) passes — 109 modules transformed, EXITCODE=0, dist regenerated (mcp + main bundles built).
- DB read-only queries confirmed live state driving the diagnosis: only 2 completed repairs both CLOSED (RD-1001 LAP-018, RD-1004 MOB-011); Jordan has ~20 OPEN tickets with overlapping titles; all 6 demo users have org + auth.users rows; existing trigger/policies inspected before writing the new RPC.

### Not done / remaining
1. Pre-existing OPEN duplicate/near-duplicate tickets (RD-1006…RD-1032) remain in the DB; the refined guard prevents NEW same-title+description duplicates but does not clean history. A cleanup pass and/or partial unique index on `(asset_id, lower(title), lower(description)) WHERE status NOT IN ('RESOLVED','CLOSED')` is the recommended durable follow-up.
2. No live re-run of the 6 E2E scenarios in a WebMCP-enabled Chrome in this session (typecheck + production build only); re-run the suite after deploy to confirm each flow end-to-end.
3. Changes are uncommitted; Vercel auto-deploy from Git is pending commit/push.

### Final status
CODE + DB changes COMPLETE and BUILD-VERIFIED. Duplicate detection tightened to title+description (distinct issues now create distinct tickets; duplicates named explicitly and shown as a warning, not success); My Issues summary/list counts consistent; notification read-state observable and preserved; authenticated-but-unprovisioned accounts auto-onboarded via `ensure_current_profile`. Production E2E re-verification pending deploy.


