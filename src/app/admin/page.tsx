'use client'

import { AuthGuard } from '@/core/auth/AuthGuard'
import { Card } from '@/core/components/Card'
import Link from 'next/link'
import styles from './page.module.css'

export default function AdminPage() {
  return (
    <AuthGuard requiredRole={['admin']} allowUsername="admin">
      <div className="page-container">
        <h1 className={styles.title}>Admin Control Panel</h1>
        <p className={styles.subtitle}>Manage platform users, civic issues, and transit configurations.</p>

        <div className={styles.grid}>
          <Link href="/admin/users" className={styles.cardLink}>
            <Card interactive className={styles.card}>
              <div className={styles.icon}>👥</div>
              <h2 className={styles.cardTitle}>User Management</h2>
              <p className={styles.cardDesc}>Manage roles, assign staff departments, and view profiles.</p>
            </Card>
          </Link>

          <Link href="/admin/issues" className={styles.cardLink}>
            <Card interactive className={styles.card}>
              <div className={styles.icon}>📢</div>
              <h2 className={styles.cardTitle}>Issue Management</h2>
              <p className={styles.cardDesc}>Overview of all reported issues across all departments.</p>
            </Card>
          </Link>

          <Link href="/admin/transit" className={styles.cardLink}>
            <Card interactive className={styles.card}>
              <div className={styles.icon}>🚌</div>
              <h2 className={styles.cardTitle}>Transit Configuration</h2>
              <p className={styles.cardDesc}>Manage transit routes, stops, and service alerts.</p>
            </Card>
          </Link>

          <Link href="/admin/moderation" className={styles.cardLink}>
            <Card interactive className={styles.card}>
              <div className={styles.icon}>🛡️</div>
              <h2 className={styles.cardTitle}>Moderation Center</h2>
              <p className={styles.cardDesc}>Review user reports and manage community content.</p>
            </Card>
          </Link>
        </div>
      </div>
    </AuthGuard>
  )
}
