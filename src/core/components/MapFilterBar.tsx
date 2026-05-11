'use client'

import { useCallback } from 'react'
import type { IssueCategory, IssueStatus } from '@/core/types/issue'
import styles from './MapFilterBar.module.css'

const CATEGORIES: { value: IssueCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'road', label: '🛣️ Road' },
  { value: 'flood', label: '🌊 Flood' },
  { value: 'light', label: '💡 Light' },
  { value: 'trash', label: '🗑️ Trash' },
  { value: 'other', label: '📋 Other' },
]

const STATUSES: { value: IssueStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

interface MapFilterBarProps {
  activeCategory: IssueCategory | 'all'
  activeStatus: IssueStatus | 'all'
  onCategoryChange: (c: IssueCategory | 'all') => void
  onStatusChange: (s: IssueStatus | 'all') => void
}

export function MapFilterBar({ activeCategory, activeStatus, onCategoryChange, onStatusChange }: MapFilterBarProps) {
  const catClick = useCallback((v: IssueCategory | 'all') => () => onCategoryChange(v), [onCategoryChange])
  const statClick = useCallback((v: IssueStatus | 'all') => () => onStatusChange(v), [onStatusChange])

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY
    }
  }

  return (
    <div className={styles.filterBar} id="map-filter-bar">
      <div className={styles.row} onWheel={handleWheel}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`${styles.chip} ${activeCategory === c.value ? styles.chipActive : ''}`}
            onClick={catClick(c.value)}
            id={`filter-cat-${c.value}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className={styles.row} onWheel={handleWheel}>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            className={`${styles.chip} ${activeStatus === s.value ? styles.chipActive : ''}`}
            onClick={statClick(s.value)}
            id={`filter-status-${s.value}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
