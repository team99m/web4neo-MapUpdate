'use client'

import { createContext, useState, useCallback, type ReactNode } from 'react'
import { defaultLocale, type Locale } from './config'
import en from './messages/en.json'

const messages: Record<string, Record<string, string>> = { en }

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string>) => string
}

export const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key) => key,
})

interface I18nProviderProps {
  children: ReactNode
}

/**
 * I18nProvider — provides translation function and locale state.
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('locale') as Locale | null
      if (saved && messages[saved]) return saved
    }
    return defaultLocale
  })

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('locale', newLocale)
    }
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string>): string => {
      let msg = messages[locale]?.[key] ?? messages[defaultLocale]?.[key] ?? key
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          msg = msg.replace(`{{${k}}}`, v)
        })
      }
      return msg
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}
