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
  /** Explicitly allow a specific username even if role doesn't match */
  allowUsername?: string
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
export function AuthGuard({ children, requiredRole, redirectTo = '/login', allowUsername }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace(redirectTo)
      return
    }

    const hasRole = requiredRole ? requiredRole.includes(user.role) : true
    const isAllowedUser = allowUsername ? user.username === allowUsername : false

    if (!hasRole && !isAllowedUser) {
      router.replace('/')
      return
    }
  }, [user, loading, requiredRole, redirectTo, router, allowUsername])

  // Show nothing while checking auth
  if (loading) {
    return null
  }

  // Not authenticated
  if (!user) {
    return null
  }

  const hasRole = requiredRole ? requiredRole.includes(user.role) : true
  const isAllowedUser = allowUsername ? user.username === allowUsername : false

  if (!hasRole && !isAllowedUser) {
    return null
  }

  return <>{children}</>
}
