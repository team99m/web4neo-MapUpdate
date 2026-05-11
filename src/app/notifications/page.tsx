'use client'

import { useEffect } from 'react'
import { AuthGuard } from '@/core/auth/AuthGuard'
import { useNotification } from '@/core/hooks/useNotification'
import { NotificationItem } from '@/core/components/NotificationItem'
import { Spinner } from '@/core/components/Spinner'
import styles from './page.module.css'

/**
 * Notifications Page — notification center.
 * Route: /notifications (auth required)
 */
export default function NotificationsPage() {
  const { notifications, loading, markAllRead } = useNotification()

  useEffect(() => {
    // Mark all as read when user views the page
    if (notifications.length > 0 && notifications.some(n => !n.read)) {
      const timer = setTimeout(() => {
        markAllRead()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [notifications, markAllRead])

  return (
    <AuthGuard>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Notifications</h1>
        </header>

        <main className={styles.list}>
          {loading ? (
            <div className={styles.loading}>
              <Spinner size="lg" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map(notification => (
              <NotificationItem key={notification.id} notification={notification} />
            ))
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔔</div>
              <h3>All caught up!</h3>
              <p>No new notifications at the moment.</p>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
