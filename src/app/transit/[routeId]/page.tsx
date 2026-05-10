'use client'

import { useParams } from 'next/navigation'

/**
 * Route Detail Page — transit route with stops, schedule, alerts.
 * Route: /transit/[routeId]
 */
export default function RouteDetailPage() {
  const params = useParams()
  const routeId = params.routeId as string

  return (
    <div className="page-container">
      <h1>Route Detail</h1>
      <p>Route ID: <code>{routeId}</code></p>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
        Route polyline, stop list, schedule, and service alerts.
      </p>
    </div>
  )
}
