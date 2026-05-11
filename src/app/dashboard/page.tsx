'use client'

import { AuthGuard } from '@/core/auth/AuthGuard'
import { useAuth } from '@/core/auth/useAuth'
import { supabase } from '@/core/supabase/client'
import type { IssueStatus } from '@/core/types/issue'
import { Badge } from '@/core/components/Badge'
import { Spinner } from '@/core/components/Spinner'
import { formatDateTime } from '@/core/utils/formatDate'
import { useIssues } from '@/core/hooks/useIssues'
import Link from 'next/link'
import styles from './page.module.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const { issues, filter, setStatus, loading, refetch } = useIssues()

  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', issueId)

      if (error) throw error
      
      // Add timeline entry
      await supabase.from('issue_timeline').insert({
        issue_id: issueId,
        status: newStatus,
        changed_by: user?.id,
        note: `Status changed to ${newStatus.replace('_', ' ')}`
      })

      refetch()
    } catch (err) {
      console.error('Update status error:', err)
      alert('Failed to update status')
    }
  }

  return (
    <AuthGuard requiredRole={['staff', 'admin']}>
      <div className="page-container" id="staff-dashboard">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Department Inbox</h1>
            {user?.department && (
              <p className={styles.subtitle}>Assigned to: {user.department}</p>
            )}
          </div>
          
          <select 
            className={styles.filterSelect}
            value={filter.status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <Spinner size="lg" />
          </div>
        ) : issues.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No issues found matching the current filter.</p>
          </div>
        ) : (
          <div className={styles.issueList}>
            {issues.map(issue => (
              <div key={issue.id} className={styles.issueCard}>
                <div className={styles.issueHeader}>
                  <Badge status={issue.status} />
                  <span className={styles.date}>{formatDateTime(issue.created_at)}</span>
                </div>
                
                <Link href={`/issues/${issue.id}`} className={styles.issueTitle}>
                  {issue.title}
                </Link>
                
                <div className={styles.metaRow}>
                  <span className={styles.metaBadge}>{issue.category}</span>
                  {issue.department && <span className={styles.metaBadge}>{issue.department}</span>}
                </div>

                <div className={styles.actions}>
                  <select
                    className={styles.actionSelect}
                    value={issue.status}
                    onChange={(e) => handleStatusChange(issue.id, e.target.value as IssueStatus)}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">Mark In Progress</option>
                    <option value="resolved">Mark Resolved</option>
                    <option value="rejected">Reject Issue</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
