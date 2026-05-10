'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for persisting state in localStorage.
 *
 * Usage:
 *   const [value, setValue] = useLocalStorage('key', defaultValue)
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setValue = useCallback(
    (value: T) => {
      setState(value)
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        console.warn(`Failed to save to localStorage: ${key}`)
      }
    },
    [key]
  )

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setState(JSON.parse(e.newValue))
        } catch {
          /* ignore parse errors */
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key])

  return [state, setValue]
}
