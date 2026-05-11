'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/core/auth/useAuth'
import { useTranslation } from '@/core/i18n/useTranslation'
import { Avatar } from './Avatar'
import { cn } from '@/core/utils/cn'
import styles from './DesktopSidebar.module.css'

export function DesktopSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home' || pathname === '/'
    return pathname.startsWith(href)
  }

  const navItems = [
    { href: '/home', icon: '🏠', label: 'Home' },
    { href: '/feed', icon: '💬', label: 'Feed' },
    { href: '/map', icon: '🗺️', label: 'Map' },
    { href: '/transit', icon: '🚌', label: 'Transit' },
  ]

  const accountItems = [
    { href: user ? `/profile/${user.username}` : '/login', icon: '👤', label: 'My Profile' },
    { href: '/notifications', icon: '🔔', label: 'Notifications' },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🏙️</span>
          <span className={styles.logoText}>Web4neo</span>
        </Link>

        {/* User Info */}
        {user && (
          <div className={styles.userCard}>
            <Avatar size="lg" src={user.avatar_url} fallback={user.username || '?'} />
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user.display_name || user.username}</span>
              <span className={styles.userHandle}>@{user.username}</span>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className={styles.nav}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Main Menu</h3>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(styles.navLink, isActive(item.href) && styles.navLinkActive)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            ))}
          </div>

          {user && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Account</h3>
              {accountItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(styles.navLink, isActive(item.href) && styles.navLinkActive)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {(user?.role === 'admin' || user?.role === 'staff' || user?.username === 'admin') && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Management</h3>
              <Link href="/dashboard" className={cn(styles.navLink, isActive('/dashboard') && styles.navLinkActive)}>
                <span className={styles.navIcon}>📊</span>
                <span className={styles.navLabel}>Staff Dashboard</span>
              </Link>
              <Link href="/admin/moderation" className={cn(styles.navLink, isActive('/admin/moderation') && styles.navLinkActive)}>
                <span className={styles.navIcon}>⚖️</span>
                <span className={styles.navLabel}>Moderation Center</span>
              </Link>
              {(user?.role === 'admin' || user?.username === 'admin') && (
                <Link href="/admin" className={cn(styles.navLink, isActive('/admin') && styles.navLinkActive)}>
                  <span className={styles.navIcon}>🛡️</span>
                  <span className={styles.navLabel}>Admin Panel</span>
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* Post CTA */}
        <Link href="/post/new" className={styles.postBtn}>
          + New Post
        </Link>

        {/* Footer */}
        <div className={styles.footer}>
          {user ? (
            <button className={styles.logoutBtn} onClick={() => logout()}>
              Sign Out
            </button>
          ) : (
            <div className={styles.authLinks}>
              <Link href="/login" className={styles.authBtn}>Login</Link>
              <Link href="/register" className={cn(styles.authBtn, styles.registerBtn)}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
