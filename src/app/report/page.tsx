'use client'

import { useTranslation } from '@/core/i18n/useTranslation'
import { AuthGuard } from '@/core/auth/AuthGuard'

/**
 * Report Page — multi-step issue reporting wizard.
 * Route: /report (auth required)
 */
export default function ReportPage() {
  const { t } = useTranslation()

  return (
    <AuthGuard>
      <div className="page-container">
        <h1>{t('nav.report')}</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
          Report wizard: Location → Category → Details → Review & Submit
        </p>
      </div>
    </AuthGuard>
  )
}
