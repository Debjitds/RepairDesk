export type AppRole = 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'EMPLOYEE'
export type AssetStatus = 'ACTIVE' | 'IN_REPAIR' | 'RETIRED'
export type WarrantyStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'
export type RepairStatus = 'OPEN' | 'ASSIGNED' | 'DIAGNOSING' | 'IN_REPAIR' | 'RESOLVED' | 'CLOSED'
export type RepairPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type NotificationType =
  | 'REPAIR_CREATED'
  | 'REPAIR_ASSIGNMENT'
  | 'REPAIR_STATUS'
  | 'REPAIR_RESOLVED'
  | 'REPAIR_CLOSED'
  | 'CRITICAL_REPAIR'
  | 'ASSET_UPDATE'
  | 'WARRANTY_WARNING'
  | 'DEADLINE_REMINDER'
  | 'SYSTEM_NOTICE'

export const ASSET_CATEGORIES = ['Laptop', 'Monitor', 'Projector', 'Printer', 'Phone', 'Network', 'Other'] as const
export type AssetCategory = (typeof ASSET_CATEGORIES)[number]

export interface Organization {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  auth_user_id: string
  organization_id: string
  full_name: string
  email: string
  role: AppRole
  department: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  organization_id: string
  asset_tag: string
  name: string
  category: AssetCategory | string
  serial_number: string | null
  description: string | null
  assigned_to: string | null
  status: AssetStatus
  location: string | null
  purchase_date: string | null
  warranty_start: string | null
  warranty_end: string | null
  created_at: string
  updated_at: string
  // joined
  assigned_user?: User | null
  repair_count?: number
  last_repair_at?: string | null
  open_repair_id?: string | null
  open_repair_ticket?: string | null
}

export interface Repair {
  id: string
  ticket_number: string
  organization_id: string
  asset_id: string
  reported_by: string
  assigned_technician_id: string | null
  title: string
  description: string
  priority: RepairPriority
  status: RepairStatus
  due_date: string | null
  diagnosis: string | null
  resolution: string | null
  reported_at: string
  assigned_at: string | null
  resolved_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  // joined
  asset?: Asset
  reporter?: User
  technician?: User | null
  repair_count_for_asset?: number
}

export interface RepairNote {
  id: string
  repair_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  author?: User
}

export interface RepairHistoryEntry {
  id: string
  organization_id: string
  repair_id: string
  actor_id: string | null
  event_type: string
  previous_status: RepairStatus | null
  new_status: RepairStatus | null
  description: string
  created_at: string
  actor?: User | null
}

export interface Notification {
  id: string
  organization_id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  related_repair_id: string | null
  related_asset_id: string | null
  is_read: boolean
  created_at: string
  related_repair?: Repair | null
  related_asset?: Asset | null
}

export interface AuditLog {
  id: string
  organization_id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  actor?: User | null
}

export interface WebmcpExecution {
  id: string
  organization_id: string
  actor_id: string | null
  tool_name: string
  input: Record<string, unknown> | null
  result: Record<string, unknown> | null
  success: boolean
  error_code: string | null
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

// ---------- derived helpers ----------

export function warrantyStatus(asset: Pick<Asset, 'warranty_end'>): WarrantyStatus | null {
  if (!asset.warranty_end) return null
  const end = new Date(asset.warranty_end)
  const now = new Date()
  const diffDays = (end.getTime() - now.getTime()) / 86400000
  if (diffDays < 0) return 'EXPIRED'
  if (diffDays <= 30) return 'EXPIRING_SOON'
  return 'ACTIVE'
}

export const STATUS_ORDER: RepairStatus[] = ['OPEN', 'ASSIGNED', 'DIAGNOSING', 'IN_REPAIR', 'RESOLVED', 'CLOSED']

export const ROLE_LABEL: Record<AppRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  TECHNICIAN: 'Technician',
  EMPLOYEE: 'Employee',
}
