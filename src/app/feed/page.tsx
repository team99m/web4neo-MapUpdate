'use client'

import { useTranslation } from '@/core/i18n/useTranslation'

/**
 * Social Feed Page — community posts with infinite scroll.
 * Route: /feed
 */
export default function FeedPage() {
  const { t } = useTranslation()

  return (
    <div className="page-container">
      <h1>{t('nav.feed')}</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
        {t('feed.empty')}
      </p>
    </div>
  )
}
