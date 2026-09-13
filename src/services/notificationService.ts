import { supabase } from '@/lib/supabase'
import { rpcErrorMessage } from '@/lib/permissions'
import type { Notification, User } from '@/types'

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      related_repair:repairs!notifications_related_repair_id_fkey(id, ticket_number, title, status),
      related_asset:assets!notifications_related_asset_id_fkey(id, asset_tag, name, status)
    `)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as unknown as Notification[]
}

export async function unreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)
  if (error) throw error
  return count ?? 0
}

export async function markNotificationsRead(ids?: string[] | null): Promise<number> {
  const { data, error } = await supabase.rpc('mark_notifications_read', { p_ids: ids ?? null })
  if (error) throw new Error(rpcErrorMessage(error))
  return data as number
}

export async function clearReadNotifications(): Promise<number> {
  const { data, error } = await supabase.rpc('clear_read_notifications')
  if (error) throw new Error(rpcErrorMessage(error))
  return data as number
}

// ---------- user directory (admin/manager settings) ----------

export async function fetchOrgUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').order('full_name')
  if (error) throw error
  return (data ?? []) as User[]
}

export async function adminUpdateUser(input: {
  user_id: string
  role?: string | null
  department?: string | null
  is_active?: boolean | null
}): Promise<User> {
  const { data, error } = await supabase.rpc('admin_update_user', {
    p_user_id: input.user_id,
    p_role: input.role ?? null,
    p_department: input.department ?? null,
    p_is_active: input.is_active ?? null,
  })
  if (error) throw new Error(rpcErrorMessage(error))
  return data as unknown as User
}

export async function updateOwnProfile(input: {
  full_name: string
  department?: string | null
  phone?: string | null
}): Promise<User> {
  const { data, error } = await supabase.rpc('update_own_profile', {
    p_full_name: input.full_name,
    p_department: input.department ?? null,
    p_phone: input.phone ?? null,
  })
  if (error) throw new Error(rpcErrorMessage(error))
  return data as unknown as User
}
