'use client'

import { cn } from '@/core/utils/cn'
import styles from './Avatar.module.css'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg'
  /** Fallback initials when no image */
  fallback?: string
  className?: string
}

/**
 * Avatar — user profile image with fallback initials.
 * Sizes: sm (24px), md (40px), lg (80px)
 */
export function Avatar({ src, alt = 'Avatar', size = 'md', fallback, className }: AvatarProps) {
  const initials = fallback
    ? fallback
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div className={cn(styles.avatar, styles[size], className)}>
      {src ? (
        <img src={src} alt={alt} className={styles.image} />
      ) : (
        <span className={styles.fallback}>{initials}</span>
      )}
    </div>
  )
}
