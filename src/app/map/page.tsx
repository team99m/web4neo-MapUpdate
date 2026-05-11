'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useIssues } from '@/core/hooks/useIssues'
import { MapFilterBar } from '@/core/components/MapFilterBar'
import styles from './page.module.css'

const MapCore = dynamic(() => import('@/core/map/MapCore').then(m => ({ default: m.MapCore })), {
  ssr: false,
  loading: () => <div className={styles.loader}>Loading map…</div>,
})

/**
 * Map Page — full-screen map with issue pins and filtering.
 * Route: /map
 */
export default function MapPage() {
  const router = useRouter()
  const { issues, filter, setCategory, setStatus, loading } = useIssues()

  // Convert issues to MapCore markers
  const markers = useMemo(() => {
    return issues.map(issue => ({
      id: issue.id,
      lat: issue.lat,
      lng: issue.lng,
      type: 'issue' as const,
      status: issue.status,
      label: issue.title
    }))
  }, [issues])

  return (
    <div className="page-full" id="map-page">
      <MapFilterBar
        activeCategory={filter.category}
        activeStatus={filter.status}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
      />

      <MapCore
        showUserLocation
        markers={markers}
        onMarkerClick={(id) => {
          router.push(`/issues/${id}`)
        }}
      />
      
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}>Syncing...</div>
        </div>
      )}
    </div>
  )
}
