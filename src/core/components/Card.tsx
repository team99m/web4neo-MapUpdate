'use client'

import { type ReactNode } from 'react'
import { cn } from '@/core/utils/cn'
import styles from './Card.module.css'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  /** If true, card is clickable with hover state */
  interactive?: boolean
}

/**
 * Card — container component with optional click behavior.
 */
export function Card({ children, className, onClick, interactive = false }: CardProps) {
  return (
    <div
      className={cn(styles.card, interactive && styles.interactive, className)}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  )
}
