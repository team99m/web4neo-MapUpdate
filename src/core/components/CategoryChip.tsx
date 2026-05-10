'use client'

import { cn } from '@/core/utils/cn'
import styles from './CategoryChip.module.css'

interface CategoryChipProps {
  label: string
  color?: string
  active?: boolean
  onClick?: () => void
  className?: string
}

const categoryColors: Record<string, string> = {
  road: '#E24B4A',
  flood: '#378ADD',
  light: '#EF9F27',
  trash: '#888780',
  noise: '#9C27B0',
  other: '#607D8B',
  community: '#1D9E75',
  transit: '#185FA5',
}

/**
 * CategoryChip — colored tag pill for category filtering.
 */
export function CategoryChip({ label, color, active = false, onClick, className }: CategoryChipProps) {
  const chipColor = color || categoryColors[label] || '#607D8B'

  return (
    <button
      className={cn(styles.chip, active && styles.active, className)}
      onClick={onClick}
      style={{
        '--chip-color': chipColor,
        '--chip-bg': active ? chipColor : 'transparent',
      } as React.CSSProperties}
      type="button"
    >
      <span className={styles.dot} style={{ backgroundColor: chipColor }} />
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </button>
  )
}
