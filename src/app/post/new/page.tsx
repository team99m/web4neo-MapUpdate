'use client'

import { useTranslation } from '@/core/i18n/useTranslation'
import { AuthGuard } from '@/core/auth/AuthGuard'

/**
 * New Post Composer Page.
 * Route: /post/new (auth required)
 */
export default function NewPostPage() {
  const { t } = useTranslation()

  return (
    <AuthGuard>
      <div className="page-container">
        <h1>New Post</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
          Post composer with text, images, category, and issue link.
        </p>
      </div>
    </AuthGuard>
  )
}
