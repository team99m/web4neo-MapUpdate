'use client'

import { useContext } from 'react'
import { I18nContext } from './I18nProvider'

/**
 * Hook to access translations.
 *
 * Usage:
 *   const { t, locale, setLocale } = useTranslation()
 *   t('nav.home') → "Home"
 *   t('greeting', { name: 'John' }) → interpolates {{name}}
 */
export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }
  return context
}
