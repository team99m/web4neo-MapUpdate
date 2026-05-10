'use client'

import { AuthGuard } from '@/core/auth/AuthGuard'

/**
 * Admin Transit Management.
 * Route: /admin/transit (admin only)
 */
export default function AdminTransitPage() {
  return (
    <AuthGuard requiredRole={['admin']}>
      <div className="page-container">
        <h1>Admin — Transit</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
          Route/stop CRUD, service alert management, route preview.
        </p>
      </div>
    </AuthGuard>
  )
}
