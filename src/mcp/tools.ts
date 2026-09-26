import { supabase } from '@/lib/supabase'
import { fetchAssets, fetchAsset } from '@/services/assetService'
import {
  fetchRepairs,
  fetchRepair,
  fetchAssetRepairHistory,
  createRepairTicket,
  updateRepairStatus,
  addRepairNote,
  fetchTechnicianWorkload,
} from '@/services/repairService'
import { warrantyStatus, type AppRole, type Asset, type Repair, type User } from '@/types'
import { formatRelative } from '@/lib/format'

/**
 * WebMCP tool layer.
 *
 * Every tool executes against the SAME application services and the SAME
 * authenticated Supabase context as the normal web UI. There is no direct
 * database access, no privileged credentials, and no separate business logic:
 * authorization is enforced by Supabase RLS and the RPC business functions.
 */

export interface McpTool {
  name: string
  description: string
  inputSchema: object
  /**
   * Explicit allow-list of roles permitted to use this tool.
   * Native WebMCP registration is DENY-by-default: a tool without an
   * explicit non-empty `roles` list is exposed to NO role — "roles omitted"
   * never means "all roles".
   */
  roles: AppRole[]
  run: (input: any) => Promise<unknown>
}

/** Convenience for the core tools every role may discover (still an explicit list). */
const ALL_ROLES: AppRole[] = ['ADMIN', 'MANAGER', 'TECHNICIAN', 'EMPLOYEE']

async function requireUser(): Promise<User> {
  const { data, error } = await supabase.rpc('get_current_app_user' as never).then(
    () => ({ data: null, error: null }),
  )
  void data
  void error
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHENTICATED: WebMCP requires a signed-in RepairDesk session.')
  const { data: profile, error: perr } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (perr) throw perr
  if (!profile) throw new Error('UNAUTHENTICATED: No RepairDesk application profile for this session.')
  return profile as unknown as User
}

async function logExecution(tool: string, input: unknown, result: unknown, err: string | null, started: number) {
  try {
    const user = await requireUser().catch(() => null)
    const org = user?.organization_id
    if (!org) return
    const duration = Date.now() - started
    const payload = safeJson(input)
    const resultJson = safeJson(result)
    // Insert via RPC-less path: table is write-restricted, so go through an
    // RPC-equivalent that RLS permits — we use supabase functions only when
    // available; otherwise skip logging silently (read-only fallback).
    // For the MVP the executions table is written by this authenticated insert
    // only if a policy permits; otherwise it is a no-op.
    await supabase.from('webmcp_tool_executions').insert({
      organization_id: org,
      actor_id: user?.id ?? null,
      tool_name: tool,
      input: payload,
      result: resultJson,
      success: err === null,
      error_message: err,
      duration_ms: duration,
    })
  } catch {
    /* logging must never break tool execution */
  }
}

function safeJson(v: unknown): Record<string, unknown> | null {
  try {
    return JSON.parse(JSON.stringify(v ?? null)) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Minimal asset projection for tool responses (data minimization). */
function projectAsset(a: Asset) {
  return {
    id: a.id,
    asset_tag: a.asset_tag,
    name: a.name,
    category: a.category,
    serial_number: a.serial_number,
    status: a.status,
    assigned_to: a.assigned_user?.full_name ?? null,
    location: a.location,
    warranty_end: a.warranty_end,
    warranty_status: warrantyStatus(a),
    repair_count: a.repair_count ?? 0,
    last_repair_at: a.last_repair_at ?? null,
    current_repair_ticket: a.open_repair_ticket ?? null,
  }
}

function projectRepair(r: Repair) {
  return {
    id: r.id,
    ticket_number: r.ticket_number,
    asset: r.asset ? { asset_tag: r.asset.asset_tag, name: r.asset.name, status: r.asset.status } : null,
    title: r.title,
    description: r.description,
    priority: r.priority,
    status: r.status,
    reporter: r.reporter?.full_name ?? null,
    technician: r.technician?.full_name ?? null,
    due_date: r.due_date,
    diagnosis: r.diagnosis,
    resolution: r.resolution,
    reported_at: r.reported_at,
    resolved_at: r.resolved_at,
  }
}

// ============================================================
// Tool definitions — MVP set required by the product scope
// ============================================================

export const TOOLS: McpTool[] = [
  // ---------------- Asset tools ----------------
  {
    name: 'search_assets',
    description:
      'Search or list assets visible to the current user. When query is provided, filter by asset tag, name, or serial number. When query is empty or omitted, return all visible assets. Use status to filter those visible assets by status. Employees see only their assigned assets; technicians see relevant operational assets; managers/admins see the organization directory.',
    roles: ALL_ROLES,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Optional search text for asset tag, name, or serial number. Omit or leave empty to return all visible assets.' },
        status: { type: 'string', enum: ['ACTIVE', 'IN_REPAIR', 'RETIRED', 'ALL'] },
      },
    },
    async run(input) {
      const assets = await fetchAssets({
        search: input.query,
        status: input.status ?? 'ALL',
      })
      return { results: assets.map(projectAsset), count: assets.length }
    },
  },
  {
    name: 'get_asset',
    description: 'Get full details for a single asset by asset tag or internal id.',
    roles: ALL_ROLES,
    inputSchema: {
      type: 'object',
      properties: {
        asset: { type: 'string', description: 'Asset tag (e.g. LAP-018) or UUID' },
      },
      required: ['asset'],
    },
    async run(input) {
      const asset = await resolveAsset(input.asset)
      return projectAsset(asset)
    },
  },
  {
    name: 'get_asset_status',
    description: 'Get the current operational status of an asset (ACTIVE / IN_REPAIR / RETIRED) plus any open repair ticket.',
    roles: ALL_ROLES,
    inputSchema: {
      type: 'object',
      properties: { asset: { type: 'string' } },
      required: ['asset'],
    },
    async run(input) {
      const a = await resolveAsset(input.asset)
      return {
        asset_tag: a.asset_tag,
        name: a.name,
        status: a.status,
        open_repair_ticket: a.open_repair_ticket ?? null,
        repair_count: a.repair_count ?? 0,
      }
    },
  },
  {
    name: 'check_warranty',
    description: 'Check the warranty state of an asset (ACTIVE / EXPIRING_SOON / EXPIRED) with dates.',
    roles: ALL_ROLES,
    inputSchema: {
      type: 'object',
      properties: { asset: { type: 'string' } },
      required: ['asset'],
    },
    async run(input) {
      const a = await resolveAsset(input.asset)
      return {
        asset_tag: a.asset_tag,
        warranty_start: a.warranty_start,
        warranty_end: a.warranty_end,
        warranty_status: warrantyStatus(a),
      }
    },
  },
  {
    name: 'get_asset_repair_history',
    description: 'List completed (resolved/closed) repairs for an asset.',
    roles: ALL_ROLES,
    inputSchema: {
      type: 'object',
      properties: { asset: { type: 'string' } },
      required: ['asset'],
    },
    async run(input) {
      const a = await resolveAsset(input.asset)
      const repairs = await fetchAssetRepairHistory(a.id)
      return {
        asset_tag: a.asset_tag,
        total: repairs.length,
        repairs: repairs.map(projectRepair),
      }
    },
  },

  // ---------------- Repair tools ----------------
  {
    name: 'search_repairs',
    description:
      'Search repairs visible to the current user. Employees see their own tickets; technicians see assigned repairs; managers/admins see the organization queue.',
    roles: ALL_ROLES,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        status: { type: 'string', enum: ['OPEN', 'ASSIGNED', 'DIAGNOSING', 'IN_REPAIR', 'RESOLVED', 'CLOSED', 'ALL'] },
        priority: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'ALL'] },
      },
    },
    async run(input) {
      const repairs = await fetchRepairs({
        search: input.query,
        status: input.status ?? 'ALL',
        priority: input.priority ?? 'ALL',
      })
      return { results: repairs.map(projectRepair), count: repairs.length }
    },
  },
  {
    name: 'get_repair',
    description: 'Get full details for a repair ticket by ticket number or id.',
    roles: ALL_ROLES,
    inputSchema: {
      type: 'object',
      properties: { ticket: { type: 'string', description: 'Ticket number (e.g. RD-1042) or UUID' } },
      required: ['ticket'],
    },
    async run(input) {
      const r = await resolveRepair(input.ticket)
      return projectRepair(r)
    },
  },
  {
    name: 'create_repair_ticket',
    description:
      'Report a new repair ticket (status OPEN). Only EMPLOYEE users may create repair tickets, and only for assets assigned to them. ADMIN/MANAGER manage and assign repairs; TECHNICIANs work on assigned repairs.',
    roles: ['EMPLOYEE'],
    inputSchema: {
      type: 'object',
      properties: {
        asset: { type: 'string', description: 'Asset tag or UUID' },
        title: { type: 'string', minLength: 3, maxLength: 200 },
        description: { type: 'string', minLength: 3, maxLength: 4000 },
        priority: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
      },
      required: ['asset', 'title', 'description'],
    },
    async run(input) {
      const asset = await resolveAsset(input.asset)
      const repair = await createRepairTicket({
        asset_id: asset.id,
        title: String(input.title),
        description: String(input.description),
        priority: (input.priority ?? 'MEDIUM') as Repair['priority'],
      })
      return {
        success: true,
        ticket_number: repair.ticket_number,
        status: repair.status,
        message: `Ticket ${repair.ticket_number} created for ${asset.asset_tag} (OPEN).`,
      }
    },
  },
  {
    name: 'update_repair_status',
    description:
      'Advance a repair through the lifecycle (OPEN→ASSIGNED→DIAGNOSING→IN_REPAIR→RESOLVED→CLOSED). Technicians may only update repairs assigned to them, and only to DIAGNOSING/IN_REPAIR/RESOLVED. Managers/admins have org-wide control. Invalid transitions are rejected by the server.',
    roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'],
    inputSchema: {
      type: 'object',
      properties: {
        ticket: { type: 'string' },
        new_status: { type: 'string', enum: ['ASSIGNED', 'DIAGNOSING', 'IN_REPAIR', 'RESOLVED', 'CLOSED'] },
        note: { type: 'string', maxLength: 2000 },
        diagnosis: { type: 'string' },
        resolution: { type: 'string' },
      },
      required: ['ticket', 'new_status'],
    },
    async run(input) {
      const repair = await resolveRepair(input.ticket)
      const updated = await updateRepairStatus({
        repair_id: repair.id,
        new_status: input.new_status,
        note: input.note ?? null,
        diagnosis: input.diagnosis ?? null,
        resolution: input.resolution ?? null,
      })
      return { success: true, ticket_number: updated.ticket_number, status: updated.status }
    },
  },
  {
    name: 'add_repair_note',
    description: 'Add a note to a repair the current user participates in (reporter, assigned technician, or manager/admin).',
    roles: ALL_ROLES,
    inputSchema: {
      type: 'object',
      properties: {
        ticket: { type: 'string' },
        note: { type: 'string', minLength: 1, maxLength: 2000 },
      },
      required: ['ticket', 'note'],
    },
    async run(input) {
      const repair = await resolveRepair(input.ticket)
      await addRepairNote(repair.id, String(input.note))
      return { success: true, message: `Note added to ${repair.ticket_number}.` }
    },
  },
  {
    name: 'get_repair_history',
    description: 'Get the full event timeline of a repair ticket.',
    roles: ALL_ROLES,
    inputSchema: {
      type: 'object',
      properties: { ticket: { type: 'string' } },
      required: ['ticket'],
    },
    async run(input) {
      const repair = await resolveRepair(input.ticket)
      const { data, error } = await supabase
        .from('repair_history')
        .select('*')
        .eq('repair_id', repair.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return {
        ticket_number: repair.ticket_number,
        events: (data ?? []).map((h: any) => ({
          event_type: h.event_type,
          previous_status: h.previous_status,
          new_status: h.new_status,
          description: h.description,
          at: h.created_at,
        })),
      }
    },
  },

  // ---------------- Operations tools ----------------
  {
    name: 'find_available_technicians',
    description: 'List technicians in the organization with their current active workload.',
    roles: ['ADMIN', 'MANAGER'],
    inputSchema: { type: 'object', properties: {} },
    async run() {
      const workload = await fetchTechnicianWorkload()
      return {
        technicians: workload.map((w) => ({
          id: w.technician.id,
          name: w.technician.full_name,
          department: w.technician.department,
          active_repairs: w.activeCount,
          critical_repairs: w.criticalCount,
        })),
      }
    },
  },
  {
    name: 'get_technician_workload',
    description: 'Get workload statistics for all technicians (manager/admin only).',
    roles: ['ADMIN', 'MANAGER'],
    inputSchema: { type: 'object', properties: {} },
    async run() {
      const workload = await fetchTechnicianWorkload()
      const totalActive = workload.reduce((s, w) => s + w.activeCount, 0)
      return {
        total_technicians: workload.length,
        total_active_repairs: totalActive,
        per_technician: workload.map((w) => ({
          name: w.technician.full_name,
          active: w.activeCount,
          critical: w.criticalCount,
        })),
      }
    },
  },
  {
    name: 'get_operational_alerts',
    description:
      'Get operational alerts: critical repairs, repeated-failure assets, and warranty warnings visible to the current user.',
    roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'],
    inputSchema: { type: 'object', properties: {} },
    async run() {
      const [repairs, assets] = await Promise.all([
        fetchRepairs({ scope: 'open' }),
        fetchAssets({}),
      ])
      const critical = repairs.filter((r) => r.priority === 'CRITICAL')
      const repeated = assets.filter((a) => (a.repair_count ?? 0) >= 3)
      const warranty = assets.filter((a) => {
        const ws = warrantyStatus(a)
        return ws === 'EXPIRING_SOON' || ws === 'EXPIRED'
      })
      return {
        critical_repairs: critical.map((r) => ({
          ticket_number: r.ticket_number,
          asset: r.asset?.asset_tag,
          title: r.title,
          status: r.status,
          technician: r.technician?.full_name ?? 'Unassigned',
        })),
        repeated_failures: repeated.map((a) => ({
          asset_tag: a.asset_tag,
          name: a.name,
          repair_count: a.repair_count,
        })),
        warranty_warnings: warranty.map((a) => ({
          asset_tag: a.asset_tag,
          name: a.name,
          warranty_status: warrantyStatus(a),
          warranty_end: a.warranty_end,
        })),
      }
    },
  },
]

// ---------------- resolvers ----------------

async function resolveAsset(ref: string): Promise<Asset> {
  let asset: Asset | null = null
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)) {
    asset = await fetchAsset(ref)
  }
  if (!asset) {
    const all = await fetchAssets({})
    asset = all.find((a) => a.asset_tag.toUpperCase() === String(ref).toUpperCase()) ?? null
  }
  if (!asset) throw new Error(`NOT_FOUND: asset "${ref}" not found or not accessible.`)
  return asset
}

async function resolveRepair(ref: string): Promise<Repair> {
  let repair: Repair | null = null
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)) {
    repair = await fetchRepair(ref)
  }
  if (!repair) {
    const all = await fetchRepairs({})
    const norm = String(ref).replace(/^#/, '').toUpperCase()
    repair = all.find((r) => r.ticket_number.toUpperCase() === norm) ?? null
  }
  if (!repair) throw new Error(`NOT_FOUND: repair "${ref}" not found or not accessible.`)
  return repair
}

// ============================================================
// Tool execution wrapper: authentication + authorization + audit
// ============================================================

export async function executeTool(name: string, input: unknown): Promise<{ success: boolean; result?: unknown; error?: { code: string; message: string } }> {
  const started = Date.now()
  const tool = TOOLS.find((t) => t.name === name)

  if (!tool) {
    await logExecution(name, input, null, `Unknown tool: ${name}`, started)
    return { success: false, error: { code: 'NOT_FOUND', message: `Unknown tool: ${name}` } }
  }

  try {
    const user = await requireUser()

    // Role-restricted tool gating at execute time (defense in depth, in addition
    // to registration filtering and Supabase RLS). Deny-by-default.
    if (!tool.roles || !tool.roles.includes(user.role)) {
      await logExecution(name, input, null, `FORBIDDEN: role ${user.role} may not use ${name}`, started)
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: `Your role (${user.role}) is not permitted to use ${name}.` },
      }
    }

    const result = await tool.run(input ?? {})
    await logExecution(name, input, result, null, started)
    return { success: true, result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tool execution failed'
    await logExecution(name, input, null, message, started)
    const code = message.startsWith('UNAUTHENTICATED')
      ? 'UNAUTHENTICATED'
      : message.startsWith('FORBIDDEN')
        ? 'FORBIDDEN'
        : message.startsWith('NOT_FOUND')
          ? 'NOT_FOUND'
          : message.startsWith('VALIDATION_ERROR')
            ? 'VALIDATION_ERROR'
            : 'INTERNAL_ERROR'
    return { success: false, error: { code, message: message.replace(/^(UNAUTHENTICATED|FORBIDDEN|NOT_FOUND|VALIDATION_ERROR):\s*/, '') } }
  }
}

export function toolManifest() {
  return TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema as object,
    roles: [...t.roles] as string[],
  }))
}

/** Demo activity entries shown in dashboard WebMCP logs before real executions exist. */
export function recentWebmcpSummaries(execs: Array<{ tool_name: string; success: boolean; created_at: string; error_message: string | null }>) {
  return execs.map((e) => ({
    time: formatRelative(e.created_at),
    text: `${e.success ? 'Agent ran' : 'Agent failed'} ${e.tool_name}${e.error_message ? ' — ' + e.error_message : ''}`,
    tone: (e.success ? undefined : 'orange') as 'orange' | undefined,
  }))
}
