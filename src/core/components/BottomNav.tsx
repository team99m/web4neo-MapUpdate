'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/core/utils/cn'
import { useTranslation } from '@/core/i18n/useTranslation'
import { ActionWindow } from './ActionWindow'
import styles from './BottomNav.module.css'

interface NavItem {
  key: string
  href: string
  icon: string
  labelKey: string
}

const leftNavItems: NavItem[] = [
  { key: 'home', href: '/home', icon: '🏠', labelKey: 'nav.home' },
  { key: 'feed', href: '/feed', icon: '💬', labelKey: 'nav.feed' },
]

const rightNavItems: NavItem[] = [
  { key: 'map', href: '/map', icon: '🗺️', labelKey: 'nav.map' },
  { key: 'transit', href: '/transit', icon: '🚌', labelKey: 'nav.transit' },
]

/**
 * BottomNav — modernized mobile bottom navigation bar.
 * Features a floating glassmorphic pill and a central Action Window trigger.
 */
export function BottomNav() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [isActionWindowOpen, setActionWindowOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const renderItem = (item: NavItem) => (
    <Link
      key={item.key}
      href={item.href}
      className={cn(styles.item, isActive(item.href) && styles.active)}
      aria-current={isActive(item.href) ? 'page' : undefined}
    >
      <span className={styles.icon}>{item.icon}</span>
      <span className={styles.label}>{t(item.labelKey)}</span>
    </Link>
  )

  return (
    <>
      <nav className={cn(styles.navWrapper, 'gpu-layer')} role="navigation" aria-label="Main navigation">
        <div className={styles.navBar}>
          <div className={styles.navGroup}>
            {leftNavItems.map(renderItem)}
          </div>

          <button 
            className={cn(styles.fab, isActionWindowOpen && styles.fabActive)}
            onClick={() => setActionWindowOpen(true)}
            aria-label="Open Action Menu"
          >
            <span className={styles.fabIcon}>+</span>
          </button>

          <div className={styles.navGroup}>
            {rightNavItems.map(renderItem)}
          </div>
        </div>
      </nav>

      <ActionWindow 
        isOpen={isActionWindowOpen} 
        onClose={() => setActionWindowOpen(false)} 
      />
    </>
  )
}
