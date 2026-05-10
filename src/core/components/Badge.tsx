'use client'

import { cn } from '@/core/utils/cn'
import type { IssueStatus } from '@/core/supabase/types'
import styles from './Badge.module.css'

interface BadgeProps {
  status: IssueStatus | string
  className?: string
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
}

/**
 * Badge — status indicator pill.
 * Color-coded by issue status.
 */
export function Badge({ status, className }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[status] || styles.default, className)}>
      {statusLabels[status] || status}
    </span>
  )
}
