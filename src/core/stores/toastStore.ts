'use client'

import { useCallback, useRef, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

/**
 * Hook for managing toast notifications.
 * Returns toast state and methods to add/dismiss toasts.
 */
export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${++counterRef.current}`
    const toast: Toast = { id, message, type, duration }

    setToasts((prev) => [...prev, toast])

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return { toasts, addToast, dismissToast, dismissAll }
}
