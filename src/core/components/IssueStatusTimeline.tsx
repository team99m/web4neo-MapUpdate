'use client'

import type { Issue } from '@/core/supabase/types'
import type { IssueStatus } from '@/core/types/issue'
import styles from './IssueStatusTimeline.module.css'

const STATUS_ORDER: Record<string, number> = { open: 0, assigned: 1, in_progress: 2, resolved: 3, rejected: 3 }

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface Props {
  issue: Issue
  history?: any[]
}

export function IssueStatusTimeline({ issue, history = [] }: Props) {
  return (
    <div className={styles.timeline}>
      <div className={styles.history}>
        {history.length > 0 ? (
          <div className={styles.historyList}>
            {history.map((entry, i) => (
              <div key={i} className={styles.historyItem}>
                <span className={styles.historyDot} />
                <div className={styles.historyInfo}>
                  <span className={styles.historyStatus}>{entry.status.replace('_', ' ')}</span>
                  {entry.note && <p className={styles.historyNote}>{entry.note}</p>}
                  <span className={styles.historyTime}>{formatDate(entry.changed_at || entry.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.historyItem}>
            <span className={styles.historyDot} />
            <div className={styles.historyInfo}>
              <span className={styles.historyStatus}>Issue Created</span>
              <span className={styles.historyTime}>{formatDate(issue.created_at)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
