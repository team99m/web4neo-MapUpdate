'use client'

import { useParams } from 'next/navigation'

/**
 * Stop Detail Page — transit stop with routes passing through.
 * Route: /transit/stop/[stopId]
 */
export default function StopDetailPage() {
  const params = useParams()
  const stopId = params.stopId as string

  return (
    <div className="page-container">
      <h1>Stop Detail</h1>
      <p>Stop ID: <code>{stopId}</code></p>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
        Stop location, routes passing through, nearby issues, and photos.
      </p>
    </div>
  )
}
