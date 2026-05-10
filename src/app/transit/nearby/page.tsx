'use client'

import { useTranslation } from '@/core/i18n/useTranslation'

/**
 * Nearby Stops Page — GPS-based proximity search.
 * Route: /transit/nearby
 */
export default function NearbyPage() {
  const { t } = useTranslation()

  return (
    <div className="page-container">
      <h1>{t('transit.nearby')}</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
        Stops within 500m radius, sorted by walking distance.
      </p>
    </div>
  )
}
