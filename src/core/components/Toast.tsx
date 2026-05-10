'use client'

import { cn } from '@/core/utils/cn'
import type { Toast as ToastType, ToastType as TType } from '@/core/stores/toastStore'
import styles from './Toast.module.css'

interface ToastProps {
  toast: ToastType
  onDismiss: (id: string) => void
}

const iconMap: Record<TType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

/**
 * Single toast notification.
 */
function ToastItem({ toast, onDismiss }: ToastProps) {
  return (
    <div className={cn(styles.toast, styles[toast.type])}>
      <span className={styles.icon}>{iconMap[toast.type]}</span>
      <span className={styles.message}>{toast.message}</span>
      <button className={styles.dismiss} onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        ✕
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastType[]
  onDismiss: (id: string) => void
}

/**
 * ToastContainer — renders all active toasts at the bottom of the screen.
 */
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
