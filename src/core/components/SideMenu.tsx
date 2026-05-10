'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/core/auth/useAuth'
import { useTranslation } from '@/core/i18n/useTranslation'
import { Avatar } from './Avatar'
import { cn } from '@/core/utils/cn'
import styles from './SideMenu.module.css'

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const [shouldRender, setRender] = useState(isOpen)

  useEffect(() => {
    if (isOpen) setRender(true)
  }, [isOpen])

  const handleAnimationEnd = () => {
    if (!isOpen) setRender(false)
  }

  if (!shouldRender) return null

  return (
    <div className={cn(styles.overlay, isOpen && styles.overlayVisible)} onClick={onClose}>
      <aside 
        className={cn(styles.menu, isOpen ? styles.open : styles.close)}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className={styles.content}>
          <div className={styles.header}>
            {user ? (
              <div className={styles.userInfo}>
                <Avatar size="lg" src={user.avatar_url} fallback={user.username || '?'} />
                <div className={styles.userDetails}>
                  <span className={styles.userName}>{user.display_name || user.username}</span>
                  <span className={styles.userHandle}>@{user.username}</span>
                </div>
              </div>
            ) : (
              <div className={styles.guestHeader}>
                <span className={styles.guestIcon}>🏙️</span>
                <span className={styles.guestTitle}>Welcome to Web4neo</span>
              </div>
            )}
          </div>

          <nav className={styles.nav}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Main Menu</h3>
              <Link href="/home" className={styles.link} onClick={onClose}>🏠 Home</Link>
              <Link href="/feed" className={styles.link} onClick={onClose}>💬 Feed</Link>
              <Link href="/map" className={styles.link} onClick={onClose}>🗺️ Map</Link>
              <Link href="/transit" className={styles.link} onClick={onClose}>🚌 Transit</Link>
            </div>

            {user && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Account</h3>
                <Link href={`/profile/${user.username}`} className={styles.link} onClick={onClose}>👤 My Profile</Link>
                <Link href="/notifications" className={styles.link} onClick={onClose}>🔔 Notifications</Link>
                <Link href="/settings" className={styles.link} onClick={onClose}>⚙️ Settings</Link>
              </div>
            )}

            {(user?.role === 'admin' || user?.role === 'staff') && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Management</h3>
                <Link href="/dashboard" className={styles.link} onClick={onClose}>📊 Staff Dashboard</Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className={styles.link} onClick={onClose}>🛡️ Admin Panel</Link>
                )}
              </div>
            )}
          </nav>

          <div className={styles.footer}>
            {user ? (
              <button className={styles.logoutBtn} onClick={() => { logout(); onClose(); }}>
                Sign Out
              </button>
            ) : (
              <div className={styles.authLinks}>
                <Link href="/login" className={styles.authBtn} onClick={onClose}>Login</Link>
                <Link href="/register" className={cn(styles.authBtn, styles.registerBtn)} onClick={onClose}>Register</Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
