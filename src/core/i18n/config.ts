/**
 * i18n Configuration (WDD §14)
 * EN-only for now. TH support structured but added later.
 */

export const locales = ['en', 'th'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

/**
 * Detect browser locale. Currently returns 'en' always.
 * When TH is added, this will check navigator.language.
 */
export function detectLocale(): Locale {
  // Future: uncomment when TH is added
  // if (typeof navigator === 'undefined') return defaultLocale
  // const lang = navigator.language.slice(0, 2)
  // return locales.includes(lang as Locale) ? (lang as Locale) : defaultLocale
  return defaultLocale
}
