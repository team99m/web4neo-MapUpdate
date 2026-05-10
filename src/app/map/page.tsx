'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useIssues } from './store/issues'
import { MapFilterBar } from './components/MapFilterBar'
import { STATUS_CONFIG, CATEGORY_CONFIG } from './types'
import type { Issue } from './types'
import styles from './page.module.css'

const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018]
const DEFAULT_ZOOM = 13

export default function MapPage() {
  const { issues, filter, loading, setCategory, setStatus } = useIssues()
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const initRef = useRef(false)

  // Init Leaflet map
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const timer = setTimeout(async () => {
      try {
        if (!containerRef.current) return
        
        // Dynamic imports
        const L = (await import('leaflet')).default
        await import('leaflet/dist/leaflet.css')
        await import('leaflet.markercluster/dist/MarkerCluster.css')
        await import('leaflet.markercluster/dist/MarkerCluster.Default.css')
        await import('leaflet.markercluster')

        // Fix default icon
        delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        const map = L.map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          zoomControl: false,
        })

        L.control.zoom({ position: 'topright' }).addTo(map)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cluster = (L as any).markerClusterGroup({
          maxClusterRadius: 60,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
        })
        map.addLayer(cluster)

        mapRef.current = map
        clusterRef.current = cluster
        setMapReady(true)

        // Ensure tiles load correctly by forcing a size recalculation
        setTimeout(() => {
          map.invalidateSize()
        }, 100)
      } catch (err) {
        console.error('Map init error:', err)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [])

  // Update markers reactively
  useEffect(() => {
    if (!mapReady || !mapRef.current || !clusterRef.current) return

    const update = async () => {
      const L = (await import('leaflet')).default
      const cluster = clusterRef.current
      cluster.clearLayers()

      issues.forEach((issue: Issue) => {
        const stat = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open
        const cat = CATEGORY_CONFIG[issue.category] || CATEGORY_CONFIG.other

        const icon = L.divIcon({
          className: 'issue-marker',
          html: `<div style="width:32px;height:32px;border-radius:50%;background:${stat.color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;">${stat.icon}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker([issue.lat, issue.lng], { icon })
        const popupHtml = `
          <div style="padding:12px;font-family:Inter,sans-serif;min-width:220px;">
            <div style="display:flex;gap:6px;margin-bottom:8px;">
              <span style="background:${stat.color};color:#fff;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600;">${stat.icon} ${stat.label}</span>
              <span style="background:#f0f0f0;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:500;">${cat.emoji} ${cat.label}</span>
            </div>
            <div style="font-weight:600;font-size:15px;margin-bottom:4px;">${issue.title}</div>
            <div style="font-size:13px;color:#6B6B6B;margin-bottom:8px;">📍 ${issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}</div>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#9B9B9B;margin-bottom:10px;">
              <span>👍 ${issue.like_count ?? 0}  💬 ${issue.comment_count ?? 0}</span>
            </div>
            <a href="/map/${issue.id}" style="display:block;text-align:center;padding:8px;background:#1D9E75;color:#fff;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">View Details</a>
          </div>`
        marker.bindPopup(popupHtml, { maxWidth: 320, className: 'issue-popup' })
        cluster.addLayer(marker)
      })
    }
    update()
  }, [issues, mapReady])

  return (
    <div className={styles.mapPage} id="map-page">
      <MapFilterBar
        activeCategory={filter.category}
        activeStatus={filter.status}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
      />

      <div
        ref={containerRef}
        className="gpu-layer"
        style={{ position: 'absolute', inset: 0 }}
      />
    </div>
  )
}
