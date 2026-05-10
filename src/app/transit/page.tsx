'use client'

import { useTranslation } from '@/core/i18n/useTranslation'

/**
 * Transit Map Page — public transport routes and stops.
 * Route: /transit
 */
export default function TransitPage() {
  const { t } = useTranslation()

  return (
    <div className="page-container">
      <h1>{t('nav.transit')}</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
        Full-screen transit map with route polylines, stop markers, and filters.
      </p>
    </div>
  )
}
