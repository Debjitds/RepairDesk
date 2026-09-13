import { supabase } from '@/lib/supabase'
import { rpcErrorMessage } from '@/lib/permissions'
import type { Asset, AssetStatus, User } from '@/types'

export interface AssetFilters {
  search?: string
  status?: AssetStatus | 'ALL'
  category?: string
  location?: string
  warranty?: string
  assigned?: 'ALL' | 'Assigned' | 'Unassigned'
}

export const ASSET_SELECT = `
  *,
  assigned_user:users!assets_assigned_to_fkey(id, full_name, email, role, department),
  repair_count:repairs(count),
  last_repair_at:repairs(resolved_at, status),
  open_repairs:repairs!repairs_asset_id_fkey(id, ticket_number, status)
`.replace(/\s+/g, ' ')

function shapeAsset(row: any): Asset {
  // PostgREST embeds last_repair_at as an array of row objects: [{ resolved_at, status }]
  const resolvedList: Array<{ resolved_at: string | null; status: string } | null> = row.last_repair_at ?? []
  const lastResolved =
    resolvedList
      .filter((r) => !!r?.resolved_at && (r.status === 'RESOLVED' || r.status === 'CLOSED'))
      .map((r) => r!.resolved_at as string)
      .sort()
      .pop() ?? null
  const open = (row.open_repairs ?? []).find(
    (r: { id: string; ticket_number: string; status: string }) => !['RESOLVED', 'CLOSED'].includes(r.status),
  )
  return {
    ...(row as Asset),
    assigned_user: (row.assigned_user ?? null) as User | null,
    repair_count: row.repair_count?.[0]?.count ?? 0,
    last_repair_at: lastResolved,
    open_repair_id: open?.id ?? null,
    open_repair_ticket: open?.ticket_number ?? null,
  }
}

export async function fetchAssets(filters: AssetFilters = {}): Promise<Asset[]> {
  let query = supabase.from('assets').select(ASSET_SELECT).order('asset_tag')

  if (filters.search) {
    const q = `%${filters.search.toLowerCase()}%`
    query = query.or(`asset_tag.ilike.${q},name.ilike.${q},serial_number.ilike.${q}`)
  }
  if (filters.status && filters.status !== 'ALL') query = query.eq('status', filters.status)
  if (filters.category && filters.category !== 'ALL') query = query.eq('category', filters.category)
  if (filters.location && filters.location !== 'ALL') query = query.eq('location', filters.location)
  if (filters.assigned === 'Assigned') query = query.not('assigned_to', 'is', null)
  if (filters.assigned === 'Unassigned') query = query.is('assigned_to', null)

  const { data, error } = await query.limit(200)
  if (error) throw error
  let assets: Asset[] = (data ?? []).map((row: any) => shapeAsset(row))

  if (filters.warranty && filters.warranty !== 'ALL') {
    const today = new Date()
    const in30 = new Date(today.getTime() + 30 * 86400000)
    const iso = (d: Date) => d.toISOString().slice(0, 10)
    assets = assets.filter((a) => {
      if (!a.warranty_end) return false
      const end = a.warranty_end.slice(0, 10)
      if (filters.warranty === 'EXPIRED') return end < iso(today)
      if (filters.warranty === 'EXPIRING_SOON') return end >= iso(today) && end <= iso(in30)
      return end > iso(in30)
    })
  }
  return assets
}

export async function fetchAsset(id: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .select(ASSET_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? shapeAsset(data) : null
}

export async function fetchAssetLocations(): Promise<string[]> {
  const { data, error } = await supabase.from('assets').select('location').not('location', 'is', null)
  if (error) throw error
  return [...new Set((data ?? []).map((r: { location: string }) => r.location))].sort()
}

export interface AssetInput {
  id?: string | null
  asset_tag: string
  name: string
  category: string
  serial_number?: string | null
  description?: string | null
  assigned_to?: string | null
  status: AssetStatus
  location?: string | null
  purchase_date?: string | null
  warranty_start?: string | null
  warranty_end?: string | null
}

export async function saveAsset(input: AssetInput): Promise<Asset> {
  const { data, error } = await supabase.rpc('upsert_asset', {
    p_asset_id: input.id ?? null,
    p_asset_tag: input.asset_tag,
    p_name: input.name,
    p_category: input.category,
    p_serial_number: input.serial_number ?? null,
    p_description: input.description ?? null,
    p_assigned_to: input.assigned_to ?? null,
    p_status: input.status,
    p_location: input.location ?? null,
    p_purchase_date: input.purchase_date ?? null,
    p_warranty_start: input.warranty_start ?? null,
    p_warranty_end: input.warranty_end ?? null,
  })
  if (error) throw new Error(rpcErrorMessage(error))
  return data as unknown as Asset
}
