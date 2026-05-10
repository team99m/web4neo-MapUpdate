'use client'

import type { Issue, IssueStatus } from '../types'
import styles from './IssueStatusTimeline.module.css'

const STEPS: { key: IssueStatus | 'assigned'; label: string; icon: string }[] = [
  { key: 'open', label: 'Created', icon: '📝' },
  { key: 'assigned', label: 'Assigned', icon: '👤' },
  { key: 'in_progress', label: 'In Progress', icon: '⟳' },
  { key: 'resolved', label: 'Resolved', icon: '✓' },
]

const STATUS_ORDER: Record<string, number> = { open: 0, assigned: 1, in_progress: 2, resolved: 3, rejected: 3 }

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface Props {
  issue: Issue
}

export function IssueStatusTimeline({ issue }: Props) {
  const currentIdx = STATUS_ORDER[issue.status] ?? 0
  const isRejected = issue.status === 'rejected'

  return (
    <div className={styles.timeline} id="issue-timeline">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIdx
        const isCurrent = idx === currentIdx
        const isPending = idx > currentIdx

        let dotClass = styles.dot
        if (isDone) dotClass += ` ${styles.dotDone}`
        else if (isCurrent) dotClass += ` ${styles.dotCurrent}`
        else dotClass += ` ${styles.dotPending}`

        let lineClass = styles.line
        if (isDone) lineClass += ` ${styles.lineDone}`

        // Timestamps
        let timestamp: string | null = null
        if (idx === 0) timestamp = formatDate(issue.created_at)
        else if (isDone || isCurrent) timestamp = formatDate(issue.updated_at)

        return (
          <div className={styles.step} key={step.key}>
            <div className={lineClass} />
            <div className={dotClass}>{isDone ? '✓' : isCurrent ? step.icon : ''}</div>
            <div className={styles.info}>
              <span className={styles.stepLabel}>
                {isRejected && isCurrent ? '× Rejected' : step.label}
              </span>
              {timestamp && <span className={styles.stepTime}>{timestamp}</span>}
              {isPending && <span className={styles.stepTime}>—</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
