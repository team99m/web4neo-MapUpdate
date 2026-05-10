'use client'

import { cn } from '@/core/utils/cn'
import styles from './Spinner.module.css'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Spinner — loading indicator.
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={cn(styles.spinner, styles[size], className)} role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>
    </div>
  )
}
