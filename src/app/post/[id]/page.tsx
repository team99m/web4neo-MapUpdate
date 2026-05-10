'use client'

import { useParams } from 'next/navigation'

/**
 * Post Detail Page — single post with comments and reactions.
 * Route: /post/[id]
 */
export default function PostDetailPage() {
  const params = useParams()
  const postId = params.id as string

  return (
    <div className="page-container">
      <h1>Post Detail</h1>
      <p>Post ID: <code>{postId}</code></p>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
        Full post content, photo grid, comment thread, and reactions.
      </p>
    </div>
  )
}
