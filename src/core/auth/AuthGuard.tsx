'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'

interface AuthGuardProps {
  children: ReactNode
  /** Required role(s). If not set, any logged-in user passes. */
  requiredRole?: string[]
  /** Custom redirect path. Defaults to /login */
  redirectTo?: string
}

/**
 * AuthGuard — wraps pages that require authentication.
 * Redirects to /login (or custom path) if not authenticated.
 * Optionally enforces role-based access.
 *
 * Usage:
 *   <AuthGuard requiredRole={['admin']}>
 *     <AdminPage />
 *   </AuthGuard>
 */
export function AuthGuard({ children, requiredRole, redirectTo = '/login' }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace(redirectTo)
      return
    }

    if (requiredRole && !requiredRole.includes(user.role)) {
      router.replace('/')
      return
    }
  }, [user, loading, requiredRole, redirectTo, router])

  // Show nothing while checking auth
  if (loading) {
    return null
  }

  // Not authenticated or wrong role
  if (!user) {
    return null
  }

  if (requiredRole && !requiredRole.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
