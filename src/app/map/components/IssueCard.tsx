'use client'

import Link from 'next/link'
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../types'
import type { Issue } from '../types'
import styles from './IssueCard.module.css'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

interface IssueCardProps {
  issue: Issue
  compact?: boolean
  showViewButton?: boolean
}

export function IssueCard({ issue, compact = false, showViewButton = false }: IssueCardProps) {
  const cat = CATEGORY_CONFIG[issue.category] || CATEGORY_CONFIG.other
  const stat = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open

  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''}`} id={`issue-card-${issue.id}`}>
      <div className={styles.header}>
        <span className={styles.badge} style={{ background: stat.color }}>
          {stat.icon} {stat.label}
        </span>
        <span className={styles.badge} style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text)' }}>
          {cat.emoji} {cat.label}
        </span>
      </div>
      <div className={styles.title}>{issue.title}</div>
      <div className={styles.location}>📍 {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}</div>
      <div className={styles.meta}>
        <span>{timeAgo(issue.created_at)}</span>
        <div className={styles.counts}>
          <span className={styles.countItem}>👍 {issue.like_count ?? 0}</span>
          <span className={styles.countItem}>💬 {issue.comment_count ?? 0}</span>
        </div>
      </div>
      {showViewButton && (
        <Link href={`/map/${issue.id}`} className={styles.viewBtn}>
          View Details
        </Link>
      )}
    </div>
  )
}
