'use client'

import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/core/utils/cn'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

/**
 * Button — core UI component.
 * Variants: primary, secondary, ghost, danger
 * Sizes: sm, md, lg
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        loading && styles.loading,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={styles.spinner} />}
      <span className={cn(loading && styles.labelHidden)}>{children}</span>
    </button>
  )
}
