'use client'

import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  lat: number | null
  lng: number | null
  accuracy: number | null
  loading: boolean
  error: string | null
}

/**
 * Hook for GPS geolocation.
 * Returns current position with loading/error states.
 *
 * Usage:
 *   const { lat, lng, loading, error, refresh } = useGeolocation()
 */
export function useGeolocation(options?: { watch?: boolean }) {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    loading: false,
    error: null,
  })

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'Geolocation is not supported', loading: false }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
        })
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message,
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [])

  useEffect(() => {
    if (!options?.watch) return

    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
        })
      },
      (err) => {
        setState((prev) => ({ ...prev, error: err.message, loading: false }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [options?.watch])

  return {
    ...state,
    refresh: getPosition,
  }
}
