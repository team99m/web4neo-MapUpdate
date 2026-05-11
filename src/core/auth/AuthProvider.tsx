'use client'

import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/core/supabase/client'
import type { AuthContextValue, AuthUser } from './types'
import type { Profile } from '@/core/supabase/types'

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  demoLogin: async () => {},
  register: async () => {},
  lineLogin: async () => {},
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
  const fetchProfile = useCallback(async (userId: string, email?: string | null): Promise<AuthUser | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) return null

    const profile = data as Profile
    return {
      ...profile,
      email: email || null,
    }
  }, [])

  /** Initialize — check existing session */
  useEffect(() => {
    const initAuth = async () => {
      // Whitelist paths that don't require authentication or are part of the OAuth flow
      const pathname = window.location.pathname
      const isWhitelistPath = 
        pathname === '/map/login' || 
        pathname === '/login' || 
        pathname === '/auth/callback' ||
        window.location.search.includes('code=') ||
        window.location.search.includes('error=')

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email || '')
          if (profile?.is_banned) {
            await supabase.auth.signOut()
            setUser(null)
            if (!isWhitelistPath) window.location.href = '/login'
          } else {
            setUser(profile)
          }
        } else if (!isWhitelistPath) {
          // If no session and not on a whitelist path, redirect to the main login page
          window.location.href = '/login'
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
          // Sync profile
          const profile = await fetchProfile(session.user.id, session.user.email || '')
          
          // Handle LINE user synchronization if identity is present
          const lineIdentity = session.user.identities?.find(id => id.provider === 'custom:line')
          if (lineIdentity) {
            const lineUserId = lineIdentity.identity_data?.sub
            const displayName = lineIdentity.identity_data?.full_name || lineIdentity.identity_data?.name
            
            await supabase.from('profiles').upsert({
              id: session.user.id,
              username: displayName ?? 'LINE User',
              line_user_id: lineUserId,
              role: 'citizen'
            } as any, { onConflict: 'id' })
          }

          if (profile?.is_banned) {
            await supabase.auth.signOut()
            setUser(null)
          } else {
            // Re-fetch profile to get latest data including potentially new LINE user id
            const updatedProfile = await fetchProfile(session.user.id, session.user.email || '')
            setUser(updatedProfile)
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

  /** LINE Login with OAuth */
  const lineLogin = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'custom:line' as any, // Using 'custom:line' as per user request
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // Standard callback route
        scopes: 'profile openid'
      }
    })
    if (error) throw error
  }, [])

  /** Sign out */
  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, demoLogin, register, lineLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
