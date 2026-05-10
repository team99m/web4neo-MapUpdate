'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for infinite scroll with cursor-based pagination.
 *
 * Usage:
 *   const { containerRef, isNearBottom } = useInfiniteScroll({
 *     onLoadMore: () => fetchNextPage(),
 *     threshold: 200,
 *   })
 */
export function useInfiniteScroll({
  onLoadMore,
  threshold = 200,
  enabled = true,
}: {
  onLoadMore: () => void
  threshold?: number
  enabled?: boolean
}) {
  const [isNearBottom, setIsNearBottom] = useState(false)

  const handleScroll = useCallback(() => {
    if (!enabled) return

    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = document.documentElement.clientHeight

    const nearBottom = scrollHeight - scrollTop - clientHeight < threshold
    setIsNearBottom(nearBottom)

    if (nearBottom) {
      onLoadMore()
    }
  }, [enabled, threshold, onLoadMore])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return { isNearBottom }
}
