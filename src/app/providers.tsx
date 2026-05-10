'use client'

import { AuthProvider } from '@/core/auth/AuthProvider'
import { I18nProvider } from '@/core/i18n/I18nProvider'
import { BottomNav } from '@/core/components/BottomNav'
import { ToastContainer } from '@/core/components/Toast'
import { useToastState } from '@/core/stores/toastStore'
import { createContext, useContext } from 'react'

// Global toast context so any component can trigger toasts
type ToastFn = (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => string

const ToastContext = createContext<ToastFn>(() => '')

export function useToast() {
  return useContext(ToastContext)
}

import { Header } from '@/core/components/Header'

/**
 * Providers — wraps the entire app with:
 * - AuthProvider (Supabase auth session)
 * - I18nProvider (translations)
 * - ToastContainer (notifications)
 * - Header (top navigation)
 * - BottomNav (mobile navigation)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const { toasts, addToast, dismissToast } = useToastState()

  return (
    <AuthProvider>
      <I18nProvider>
        <ToastContext.Provider value={addToast}>
          <Header />
          <main className="main-content">{children}</main>
          <BottomNav />
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
      </I18nProvider>
    </AuthProvider>
  )
}
