'use client'

import { AuthGuard } from '@/core/auth/AuthGuard'

/**
 * Admin Issues Management.
 * Route: /admin/issues (admin only)
 */
export default function AdminIssuesPage() {
  return (
    <AuthGuard requiredRole={['admin']}>
      <div className="page-container">
        <h1>Admin — Issues</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
          All issues table with filters, bulk actions, and CSV export.
        </p>
      </div>
    </AuthGuard>
  )
}
