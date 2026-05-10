'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/core/auth/AuthGuard'
import { useAuth } from '@/core/auth/useAuth'
import { supabase } from '@/core/supabase/client'
import type { Issue, IssueStatus } from '@/core/supabase/types'
import { Badge } from '@/core/components/Badge'
import { Spinner } from '@/core/components/Spinner'
import { formatDateTime } from '@/core/utils/formatDate'
import { useToast } from '@/app/providers'
import Link from 'next/link'
import styles from './page.module.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const addToast = useToast()
  
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const fetchIssues = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      // If user has a department, we could optionally filter by it here
      // if (user?.department) {
      //   query = query.eq('department', user.department)
      // }

      const { data, error } = await query
      if (error) throw error
      
      setIssues(data as Issue[])
    } catch (err) {
      console.error(err)
      addToast('Failed to load issues', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchIssues()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterStatus])

  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    try {
      // Optimistic UI update
      setIssues(prev => prev.map(issue => 
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      ))

      const { error } = await supabase
        .from('issues')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', issueId)

      if (error) {
        // Revert on error
        await fetchIssues()
        throw error
      }
      
      addToast(`Issue marked as ${newStatus.replace('_', ' ')}`, 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to update status', 'error')
    }
  }

  return (
    <AuthGuard requiredRole={['staff', 'admin']}>
      <div className="page-container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Department Inbox</h1>
            {user?.department && (
              <p className={styles.subtitle}>Assigned to: {user.department}</p>
            )}
          </div>
          
          <select 
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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
