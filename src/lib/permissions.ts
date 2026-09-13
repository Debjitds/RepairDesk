import type { AppRole } from '@/types'

/**
 * Frontend permission helpers — UX-layer only.
 * Real authorization is enforced by Supabase RLS + RPC functions.
 */

export function isAdmin(role: AppRole | undefined): boolean {
  return role === 'ADMIN'
}

export function isManagerOrAdmin(role: AppRole | undefined): boolean {
  return role === 'ADMIN' || role === 'MANAGER'
}

export function isTechnician(role: AppRole | undefined): boolean {
  return role === 'TECHNICIAN'
}

export function isEmployee(role: AppRole | undefined): boolean {
  return role === 'EMPLOYEE'
}

/** Map error message from Supabase RPC failures to user-safe messages */
export function rpcErrorMessage(err: { message?: string } | null | undefined): string {
  const raw = err?.message ?? 'An unexpected error occurred'
  const m = raw.match(/^POLLUX|^(\w+):\s*(.*)$/) ?? null
  const codeMatch = raw.match(/^(UNAUTHENTICATED|FORBIDDEN|NOT_FOUND|VALIDATION_ERROR)[:(]?\s*(.*)$/)
  if (codeMatch) {
    const code = codeMatch[1]
    const detail = codeMatch[2].trim()
    switch (code) {
      case 'UNAUTHENTICATED':
        return 'Your session has expired. Please sign in again.'
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.'
      case 'NOT_FOUND':
        return 'The requested resource was not found.'
      case 'VALIDATION_ERROR':
        return detail || 'The submitted data is invalid.'
    }
  }
  if (m) return m[2] || m[1]
  if (raw.includes('duplicate key')) return 'A record with this identifier already exists.'
  if (raw.includes('Failed to fetch')) return 'Network error — check your connection and try again.'
  return 'Operation failed. Please try again.'
}
