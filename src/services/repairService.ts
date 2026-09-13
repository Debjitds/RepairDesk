import { supabase } from '@/lib/supabase'
import { rpcErrorMessage } from '@/lib/permissions'
import type { Repair, RepairHistoryEntry, RepairNote, RepairPriority, RepairStatus, User } from '@/types'

const REPAIR_SELECT = `
  *,
  asset:assets!repairs_asset_id_fkey(*),
  reporter:users!repairs_reported_by_fkey(id, full_name, email, role, department),
  technician:users!repairs_assigned_technician_id_fkey(id, full_name, email, role, department)
`

export interface RepairFilters {
  search?: string
  status?: RepairStatus | 'ALL'
  priority?: RepairPriority | 'ALL'
  assignedToMe?: boolean
  reportedByMe?: boolean
  scope?: 'open' | 'all' | 'history'
}

export async function fetchRepairs(filters: RepairFilters = {}): Promise<Repair[]> {
  let query = supabase.from('repairs').select(REPAIR_SELECT)

  if (filters.scope === 'history') query = query.in('status', ['RESOLVED', 'CLOSED'])
  else if (filters.scope === 'open') query = query.not('status', 'in', '("RESOLVED","CLOSED")')

  if (filters.status && filters.status !== 'ALL') query = query.eq('status', filters.status)
  if (filters.priority && filters.priority !== 'ALL') query = query.eq('priority', filters.priority)
  if (filters.assignedToMe) {
    const uid = (await supabase.auth.getUser()).data.user?.id
    const { data: me } = await supabase.from('users').select('id').eq('auth_user_id', uid!).single()
    if (me) query = query.eq('assigned_technician_id', me.id)
  }
  if (filters.reportedByMe) {
    const uid = (await supabase.auth.getUser()).data.user?.id
    const { data: me } = await supabase.from('users').select('id').eq('auth_user_id', uid!).single()
    if (me) query = query.eq('reported_by', me.id)
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(200)
  if (error) throw error

  let repairs = (data ?? []) as unknown as Repair[]

  if (filters.search) {
    const q = filters.search.toLowerCase()
    repairs = repairs.filter(
      (r) =>
        r.ticket_number.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.asset?.name ?? '').toLowerCase().includes(q) ||
        (r.asset?.asset_tag ?? '').toLowerCase().includes(q) ||
        (r.technician?.full_name ?? '').toLowerCase().includes(q),
    )
  }
  return repairs
}

export async function fetchRepair(id: string): Promise<Repair | null> {
  const { data, error } = await supabase
    .from('repairs')
    .select(REPAIR_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as unknown as Repair) ?? null
}

export async function fetchRepairNotes(repairId: string): Promise<RepairNote[]> {
  const { data, error } = await supabase
    .from('repair_notes')
    .select('*, author:users!repair_notes_author_id_fkey(id, full_name, role)')
    .eq('repair_id', repairId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as RepairNote[]
}

export async function fetchRepairHistory(repairId: string): Promise<RepairHistoryEntry[]> {
  const { data, error } = await supabase
    .from('repair_history')
    .select('*, actor:users!repair_history_actor_id_fkey(id, full_name, role)')
    .eq('repair_id', repairId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as RepairHistoryEntry[]
}

export async function fetchAssetRepairHistory(assetId: string): Promise<Repair[]> {
  const { data, error } = await supabase
    .from('repairs')
    .select(REPAIR_SELECT)
    .eq('asset_id', assetId)
    .in('status', ['RESOLVED', 'CLOSED'])
    .order('resolved_at', { ascending: false, nullsFirst: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as unknown as Repair[]
}

// ---------- Mutations (all flow through backend RPC business logic) ----------

export async function createRepairTicket(input: {
  asset_id: string
  title: string
  description: string
  priority: RepairPriority
  due_date?: string | null
}): Promise<Repair> {
  const { data, error } = await supabase.rpc('create_repair_ticket', {
    p_asset_id: input.asset_id,
    p_title: input.title,
    p_description: input.description,
    p_priority: input.priority,
    p_due_date: input.due_date ?? null,
  })
  if (error) throw new Error(rpcErrorMessage(error))
  return data as unknown as Repair
}

export async function assignTechnician(repairId: string, technicianId: string): Promise<Repair> {
  const { data, error } = await supabase.rpc('assign_technician', {
    p_repair_id: repairId,
    p_technician_id: technicianId,
  })
  if (error) throw new Error(rpcErrorMessage(error))
  return data as unknown as Repair
}

export async function updateRepairStatus(input: {
  repair_id: string
  new_status: RepairStatus
  note?: string | null
  diagnosis?: string | null
  resolution?: string | null
}): Promise<Repair> {
  const { data, error } = await supabase.rpc('update_repair_status', {
    p_repair_id: input.repair_id,
    p_new_status: input.new_status,
    p_note: input.note ?? null,
    p_diagnosis: input.diagnosis ?? null,
    p_resolution: input.resolution ?? null,
  })
  if (error) throw new Error(rpcErrorMessage(error))
  return data as unknown as Repair
}

export async function addRepairNote(repairId: string, content: string): Promise<RepairNote> {
  const { data, error } = await supabase.rpc('add_repair_note', {
    p_repair_id: repairId,
    p_content: content,
  })
  if (error) throw new Error(rpcErrorMessage(error))
  return data as unknown as RepairNote
}

export async function fetchTechnicians(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'TECHNICIAN')
    .eq('is_active', true)
    .order('full_name')
  if (error) throw error
  return (data ?? []) as User[]
}

export interface TechnicianWorkload {
  technician: User
  activeCount: number
  criticalCount: number
}

export async function fetchTechnicianWorkload(): Promise<TechnicianWorkload[]> {
  const techs = await fetchTechnicians()
  const { data: repairs } = await supabase
    .from('repairs')
    .select('assigned_technician_id, priority')
    .not('status', 'in', '("RESOLVED","CLOSED")')
    .not('assigned_technician_id', 'is', null)
  const active = (repairs ?? []) as Array<{ assigned_technician_id: string; priority: string }>
  return techs.map((t) => {
    const mine = active.filter((r) => r.assigned_technician_id === t.id)
    return {
      technician: t,
      activeCount: mine.length,
      criticalCount: mine.filter((r) => r.priority === 'CRITICAL').length,
    }
  })
}
