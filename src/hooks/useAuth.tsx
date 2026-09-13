import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { loadCurrentUser, signIn, signOut, signUp, updatePassword } from '@/services/authService'
import type { User } from '@/types'

export interface AuthState {
  initializing: boolean
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<unknown>
  signOut: () => Promise<void>
  updatePassword: (pw: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(async ({ data: { session: s } }) => {
        setSession(s)
        if (s?.user) {
          try {
            setUser(await loadCurrentUser())
          } catch (e) {
            console.error('Failed to load user profile', e)
          }
        }
      })
      .finally(() => setInitializing(false))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (s?.user) {
        try {
          setUser(await loadCurrentUser())
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const value: AuthState = {
    initializing,
    session,
    user,
    signIn: async (email, password) => {
      await signIn(email, password)
    },
    signUp: async (email, password, fullName) => {
      const result = await signUp(email, password, fullName)
      try {
        await supabase.auth.signInWithPassword({ email, password })
      } catch {
        /* session confirmed via email for some projects */
      }
      return result
    },
    signOut: async () => {
      await signOut()
      setUser(null)
      setSession(null)
    },
    updatePassword: async (pw) => {
      await updatePassword(pw)
    },
    refreshUser: async () => {
      try {
        setUser(await loadCurrentUser())
      } catch {
        /* keep current on failure */
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
