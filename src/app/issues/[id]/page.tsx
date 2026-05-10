'use client'

import { useParams } from 'next/navigation'
import { useTranslation } from '@/core/i18n/useTranslation'
import { Badge } from '@/core/components/Badge'
import { Spinner } from '@/core/components/Spinner'

/**
 * Issue Detail Page — dynamic route.
 * Route: /issues/[id]
 */
export default function IssueDetailPage() {
  const params = useParams()
  const { t } = useTranslation()
  const issueId = params.id as string

  return (
    <div className="page-container">
      <h1>Issue Detail</h1>
      <p>Issue ID: <code>{issueId}</code></p>
      <p>Status: <Badge status="open" /></p>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
        This page will show: status timeline, photos, comments, reactions, and review section.
      </p>
    </div>
  )
}
