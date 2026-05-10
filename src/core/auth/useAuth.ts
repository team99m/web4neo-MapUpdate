'use client'

import { useContext } from 'react'
import { AuthContext } from './AuthProvider'
import type { AuthContextValue } from './types'

/**
 * Hook to access auth state and methods.
 *
 * Usage:
 *   const { user, login, logout, loading } = useAuth()
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
