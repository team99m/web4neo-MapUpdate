'use client'

import { useContext, useEffect, useState, useCallback } from 'react'
import { AuthContext } from './AuthProvider'
import { supabase } from '@/core/supabase/client'
import type { AuthContextValue, AuthUser } from './types'
import type { Profile } from '@/core/supabase/types'

/**
 * Hook to access auth state and methods.
 * Wraps the simple AuthContext with profile fetching and auth actions
 * for backward compatibility with existing components.
 */
export function useAuth(): AuthContextValue {
  const { user: supabaseUser, loading: sessionLoading, signOut } = useContext(AuthContext)
  const [profile, setProfile] = useState<AuthUser | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Fetch profile when supabase user changes
  useEffect(() => {
    if (!supabaseUser) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setProfile(null)
        } else {
          setProfile({
            ...(data as Profile),
            email: supabaseUser.email || '',
          })
        }
        setProfileLoading(false)
      })
  }, [supabaseUser])

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const googleLogin = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://web4neo-map-update.vercel.app/auth/callback'
      }
    })
    if (error) throw error
    if (data?.url) {
      window.location.href = data.url
    }
  }, [])

  const register = useCallback(async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })
    if (error) throw error
  }, [])

  const demoLogin = useCallback(async () => {
    const randomId = crypto.randomUUID().split('-')[0]
    const email = `demo-${randomId}@web4neo.local`
    const password = crypto.randomUUID()
    const username = `DemoUser_${randomId}`
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })
    if (error) throw error
  }, [])

  const logout = useCallback(async () => {
    await signOut()
  }, [signOut])

  return {
    user: profile,
    loading: sessionLoading || profileLoading,
    login,
    googleLogin,
    demoLogin,
    register,
    logout,
  }
}
