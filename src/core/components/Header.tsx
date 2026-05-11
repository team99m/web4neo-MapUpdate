'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/core/auth/useAuth'
import { useTranslation } from '@/core/i18n/useTranslation'
import { Avatar } from './Avatar'
import { SideMenu } from '@/core/components/SideMenu'
import styles from './Header.module.css'

import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [isMenuOpen, setMenuOpen] = useState(false)

  // Hide global header on the Create Post page
  if (pathname === '/post/new') return null

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.left}>
            <button 
              className={styles.menuBtn} 
              onClick={() => setMenuOpen(true)}
              aria-label="Open Menu"
            >
              <div className={styles.hamburger}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoIcon}>🏙️</span>
              <span className={styles.logoText}>Web4neo</span>
            </Link>
          </div>

          <div className={styles.right}>
            {user ? (
              <Link href={`/profile/${user.username}`} className={styles.profileLink}>
                <Avatar size="sm" src={user.avatar_url} fallback={user.username || '?'} />
              </Link>
            ) : (
              <Link href="/login" className={styles.loginBtn}>
                {t('auth.login')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <SideMenu isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
