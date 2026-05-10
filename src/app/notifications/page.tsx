'use client'

import { AuthGuard } from '@/core/auth/AuthGuard'

/**
 * Notifications Page — notification center.
 * Route: /notifications (auth required)
 */
export default function NotificationsPage() {
  return (
    <AuthGuard>
      <div className="page-container">
        <h1>Notifications</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
          No new notifications.
        </p>
      </div>
    </AuthGuard>
  )
}
