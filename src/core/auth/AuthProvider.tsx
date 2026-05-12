'use client'

import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/core/supabase/client'
import type { AuthContextValue, AuthUser } from './types'
import type { Profile } from '@/core/supabase/types'

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  googleLogin: async () => {},
  demoLogin: async () => {},
  register: async () => {},
  logout: async () => {},
})

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider — wraps the app with authentication context.
 * Manages Supabase auth session and profile data.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  /** Fetch profile from Supabase and merge with auth user */
  const fetchProfile = useCallback(async (userId: string, email: string): Promise<AuthUser | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) return null

    const profile = data as Profile
    return {
      ...profile,
      email,
    }
  }, [])

  /** Initialize — check existing session */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email || '')
          if (profile?.is_banned) {
            await supabase.auth.signOut()
            setUser(null)
          } else {
            setUser(profile)
          }
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email || '')
          if (profile?.is_banned) {
            await supabase.auth.signOut()
            setUser(null)
          } else {
            setUser(profile)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  /** Sign in with email/password */
  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  /** Sign in with Google */
  const googleLogin = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) console.error('Google login error:', error)
  }, [])

  /** Register with email/password (Profile created via backend trigger) */
  const register = useCallback(async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          username: username,
        }
      }
    })
    if (error) throw error
  }, [])

  /** Unique Random Demo Login */
  const demoLogin = useCallback(async () => {
    // Generate a unique random ID for this session
    const randomId = crypto.randomUUID().split('-')[0]
    const email = `demo-${randomId}@web4neo.local`
    const password = crypto.randomUUID()
    const username = `DemoUser_${randomId}`

    // Register a brand new unique demo account
    const { error: regError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          username: username,
        }
      }
    })
    
    if (regError) {
      if (regError.message.toLowerCase().includes('rate limit')) {
        throw new Error('Supabase signup rate limit reached. Please wait a few minutes or create a shared demo account.')
      }
      throw regError
    }
  }, [])

  /** Sign out */
  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, demoLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
