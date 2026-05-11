'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/core/utils/cn'
import styles from './ActionWindow.module.css'

interface ActionWindowProps {
  isOpen: boolean
  onClose: () => void
}

export function ActionWindow({ isOpen, onClose }: ActionWindowProps) {
  const [shouldRender, setRender] = useState(isOpen)

  // Handle animation unmounting
  useEffect(() => {
    if (isOpen) setRender(true)
  }, [isOpen])

  const handleAnimationEnd = () => {
    if (!isOpen) setRender(false)
  }

  if (!shouldRender) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={cn(styles.window, isOpen ? styles.open : styles.close)} 
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className={styles.dragHandle} onClick={onClose} />
        
        <div className={styles.header}>
          <h2 className={styles.title}>Create New</h2>
          <p className={styles.subtitle}>What would you like to share?</p>
        </div>

        <div className={styles.grid}>
          <Link href="/report" className={styles.actionCard} onClick={onClose}>
            <div className={cn(styles.iconWrapper, styles.reportBg)}>📢</div>
            <div className={styles.actionInfo}>
              <span className={styles.actionTitle}>Report Issue</span>
              <span className={styles.actionDesc}>Report infrastructure or civic problems</span>
            </div>
          </Link>

          <Link href="/post/new" className={styles.actionCard} onClick={onClose}>
            <div className={cn(styles.iconWrapper, styles.postBg)}>💬</div>
            <div className={styles.actionInfo}>
              <span className={styles.actionTitle}>Community Post</span>
              <span className={styles.actionDesc}>Share an update or event</span>
            </div>
          </Link>
          
          <Link href="/map" className={styles.actionCard} onClick={onClose}>
            <div className={cn(styles.iconWrapper, styles.mapBg)}>🗺️</div>
            <div className={styles.actionInfo}>
              <span className={styles.actionTitle}>View Map</span>
              <span className={styles.actionDesc}>See nearby reports and alerts</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
