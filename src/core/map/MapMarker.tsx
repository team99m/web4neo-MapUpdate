'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

export interface MarkerConfig {
  id: string
  lat: number
  lng: number
  type: 'issue' | 'stop' | 'vehicle'
  status?: string
  label?: string
}

interface MapMarkerProps {
  map: L.Map | null
  marker: MarkerConfig
  onClick?: (id: string) => void
}

/** Status → color mapping for issue pins (WDD Module 1.1 §4) */
const statusColors: Record<string, string> = {
  open: '#E24B4A',
  in_progress: '#EF9F27',
  resolved: '#1D9E75',
  rejected: '#888780',
}

/** Status → icon mapping */
const statusIcons: Record<string, string> = {
  open: '!',
  in_progress: '⟳',
  resolved: '✓',
  rejected: '×',
}

/** Transit type colors */
const transitColors: Record<string, string> = {
  bus: '#EF9F27',
  bts: '#1D9E75',
  mrt: '#378ADD',
  boat: '#185FA5',
}

function createMarkerIcon(config: MarkerConfig): L.DivIcon {
  const { type, status } = config

  if (type === 'issue') {
    const color = statusColors[status || 'open'] || statusColors.open
    const icon = statusIcons[status || 'open'] || '!'
    return L.divIcon({
      className: 'issue-marker',
      html: `<div style="
        width:28px;height:28px;border-radius:50%;
        background:${color};color:#fff;
        display:flex;align-items:center;justify-content:center;
        font-weight:700;font-size:14px;
        border:2px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
      ">${icon}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
  }

  if (type === 'stop') {
    const color = transitColors[status || 'bus'] || '#607D8B'
    return L.divIcon({
      className: 'transit-stop',
      html: `<div style="
        width:12px;height:12px;border-radius:50%;
        background:${color};
        border:2px solid #fff;
        box-shadow:0 1px 3px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    })
  }

  // vehicle
  return L.divIcon({
    className: 'vehicle-marker',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:#378ADD;color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;border:2px solid #fff;
      box-shadow:0 2px 4px rgba(0,0,0,0.3);
    ">🚌</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

/**
 * MapMarker — renders a single Leaflet marker on a map.
 * Uses custom DivIcon styled by type and status.
 */
export function MapMarker({ map, marker, onClick }: MapMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!map) return

    const icon = createMarkerIcon(marker)
    const leafletMarker = L.marker([marker.lat, marker.lng], { icon })

    if (marker.label) {
      leafletMarker.bindTooltip(marker.label)
    }

    if (onClick) {
      leafletMarker.on('click', () => onClick(marker.id))
    }

    leafletMarker.addTo(map)
    markerRef.current = leafletMarker

    return () => {
      leafletMarker.remove()
    }
  }, [map, marker, onClick])

  return null
}
