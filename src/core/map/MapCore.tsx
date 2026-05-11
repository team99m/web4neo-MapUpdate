'use client'

import { useEffect, useRef, useState } from 'react'
import type { MarkerConfig } from './MapMarker'
import styles from './MapCore.module.css'

interface MapCoreProps {
  center?: [number, number]
  zoom?: number
  markers?: MarkerConfig[]
  onMapClick?: (lat: number, lng: number) => void
  onMarkerClick?: (id: string) => void
  className?: string
  /** Show user location dot */
  showUserLocation?: boolean
}

// Default center: Bangkok
const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018]
const DEFAULT_ZOOM = 13

/**
 * MapCore — Leaflet map wrapper component.
 *
 * Dynamically imports Leaflet (client-side only, no SSR).
 * This is the shared map foundation used by all modules (WDD §8 MapCore).
 *
 * Usage:
 *   <MapCore
 *     center={[13.7563, 100.5018]}
 *     zoom={13}
 *     markers={markers}
 *     onMapClick={(lat, lng) => console.log(lat, lng)}
 *     onMarkerClick={(id) => console.log(id)}
 *   />
 */
export function MapCore({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  markers = [],
  onMapClick,
  onMarkerClick,
  className,
  showUserLocation = false,
}: MapCoreProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const clusterRef = useRef<any>(null)
  const initRef = useRef(false)
  const [ready, setReady] = useState(false)

  // Initialize map (client-side only)
  useEffect(() => {
    const initMap = async () => {
      if (initRef.current) return
      initRef.current = true

      const L = (await import('leaflet')).default
      // Attach to window so leaflet.markercluster can find it
      ;(window as any).L = L

      // Fix default marker icons
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      if (!mapContainerRef.current || mapRef.current) return

      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false, // We'll position it manually
        attributionControl: true,
      })

      // Add zoom control to top-right (better for mobile)
      L.control.zoom({ position: 'topright' }).addTo(map)

      // OpenStreetMap tiles (free)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Create markers cluster group
      await import('leaflet.markercluster/dist/MarkerCluster.css')
      await import('leaflet.markercluster/dist/MarkerCluster.Default.css')
      await import('leaflet.markercluster')
      
      const cluster = (L as any).markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      })
      map.addLayer(cluster)
      clusterRef.current = cluster

      // Map click handler
      if (onMapClick) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onMapClick(e.latlng.lat, e.latlng.lng)
        })
      }

      // User location
      if (showUserLocation) {
        map.locate({ setView: false, maxZoom: 16 })
        map.on('locationfound', (e: L.LocationEvent) => {
          L.circleMarker(e.latlng, {
            radius: 8,
            fillColor: '#378ADD',
            fillOpacity: 0.9,
            color: '#fff',
            weight: 2,
          }).addTo(map)

          // Accuracy circle
          L.circle(e.latlng, {
            radius: e.accuracy / 2,
            fillColor: '#378ADD',
            fillOpacity: 0.1,
            color: '#378ADD',
            weight: 1,
          }).addTo(map)
        })
      }

      mapRef.current = map
      setReady(true)
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers when they change
  useEffect(() => {
    if (!ready || !mapRef.current || !clusterRef.current) return

    const L = require('leaflet') as typeof import('leaflet')
    const cluster = clusterRef.current
    cluster.clearLayers()

    markers.forEach((m) => {
      const statusColors: Record<string, string> = {
        open: '#E24B4A',
        in_progress: '#EF9F27',
        resolved: '#1D9E75',
        rejected: '#888780',
      }

      const statusIcons: Record<string, string> = {
        open: '!',
        in_progress: '⟳',
        resolved: '✓',
        rejected: '×',
      }

      let icon: L.DivIcon

      if (m.type === 'issue') {
        const color = statusColors[m.status || 'open'] || statusColors.open
        const iconChar = statusIcons[m.status || 'open'] || '!'
        icon = L.divIcon({
          className: 'issue-marker',
          html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${iconChar}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
      } else if (m.type === 'stop') {
        const color = m.status || '#607D8B'
        icon = L.divIcon({
          className: 'transit-stop',
          html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        })
      } else {
        icon = L.divIcon({
          className: 'vehicle-marker',
          html: `<div style="width:20px;height:20px;border-radius:50%;background:#378ADD;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff;">🚌</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
      }

      const marker = L.marker([m.lat, m.lng], { icon })

      if (m.label) {
        marker.bindTooltip(m.label)
      }

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(m.id))
      }

      // Add popup for issues (from srcfriend logic)
      if (m.type === 'issue') {
        const popupHtml = `
          <div style="padding:8px;font-family:Inter,sans-serif;min-width:200px;">
            <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${m.label || 'Issue'}</div>
            <div style="font-size:12px;color:#6B6B6B;margin-bottom:8px;">Status: ${m.status}</div>
            <button onclick="window.location.href='/map/${m.id}'" style="display:block;width:100%;text-align:center;padding:6px;background:#1D9E75;color:#fff;border-radius:6px;font-size:12px;font-weight:600;border:none;cursor:pointer;">View Details</button>
          </div>`
        marker.bindPopup(popupHtml, { maxWidth: 300 })
      }

      marker.addTo(cluster)
    })
  }, [markers, ready, onMarkerClick])

  // Update center/zoom when props change
  useEffect(() => {
    if (mapRef.current && ready) {
      mapRef.current.setView(center, zoom)
    }
  }, [center, zoom, ready])

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div
        ref={mapContainerRef}
        className={`${styles.map} gpu-layer ${className || ''}`}
      />
    </>
  )
}
