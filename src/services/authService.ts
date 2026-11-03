import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
export interface AuthContext {
  sessionUserId: string
  user: User
}

/** Load the application profile for the signed-in Supabase auth user. */
export async function loadCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) throw error
  if (data) return data as User

  // Authenticated in Supabase but no application profile yet (e.g. an account
  // provisioned outside the signup trigger, or a race right after signup). Ask
  // the backend to onboard the caller into the default organization so they are
  // not stranded on the "No Application Profile" screen.
  const { data: ensured, error: ensureError } = await supabase.rpc('ensure_current_profile')
  if (ensureError) throw ensureError
  return (ensured as User) ?? null
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
