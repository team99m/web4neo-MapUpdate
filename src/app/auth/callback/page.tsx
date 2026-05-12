'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/core/supabase/client'

/**
 * AuthCallback — Handles OAuth redirect.
 * Supabase client with detectSessionInUrl: true will pick up the session.
 */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/home')
      } else if (event === 'INITIAL_SESSION') {
        if (session) router.push('/home')
        else router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Authentication in progress...</p>
    </div>
  )
}
