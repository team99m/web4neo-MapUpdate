'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/core/auth/AuthGuard'
import { supabase } from '@/core/supabase/client'
import { Button } from '@/core/components/Button'
import { Spinner } from '@/core/components/Spinner'
import { useToast } from '@/app/providers'
import { formatDistanceToNow } from '@/core/utils/date'
import styles from './page.module.css'

interface Report {
  id: string
  created_at: string
  reporter_id: string
  target_type: 'post' | 'comment'
  target_id: string
  reason: string
  target_content?: string
  reporter_username?: string
}

export default function ModerationPage() {
  const addToast = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles:reporter_id(username)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const rawReports = data as any[]
      
      // Fetch target content for each report
      const enrichedReports = await Promise.all(rawReports.map(async (r) => {
        let content = 'Content removed or unavailable'
        try {
          if (r.target_type === 'post') {
            const { data: post } = await supabase.from('posts').select('content').eq('id', r.target_id).maybeSingle()
            if (post) content = post.content
          } else {
            const { data: comment } = await supabase.from('comments').select('content').eq('id', r.target_id).maybeSingle()
            if (comment) content = comment.content
          }
        } catch (e) {
          console.error(`Error fetching content for ${r.target_type} ${r.target_id}:`, e)
        }

        return {
          ...r,
          target_content: content,
          reporter_username: r.profiles?.username || 'Unknown'
        }
      }))

      setReports(enrichedReports)
    } catch (err) {
      console.error(err)
      addToast('Failed to load reports', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleAction = async (reportId: string, action: 'delete' | 'dismiss', targetType?: string, targetId?: string) => {
    console.log(`Moderation action: ${action} on report ${reportId}`, { targetType, targetId })
    
    try {
      if (action === 'delete' && targetType && targetId) {
        const table = targetType === 'post' ? 'posts' : 'comments'
        console.log(`Attempting to delete content from ${table} with id ${targetId}`)
        
        const { error: deleteError } = await supabase.from(table).delete().eq('id', targetId)
        if (deleteError) {
          console.warn('Content deletion failed (might be already gone):', deleteError)
        } else {
          console.log('Content deletion call completed')
        }
      }

      // Remove the report from the table (marks it as resolved/dismissed)
      console.log(`Removing report ${reportId} from reports table`)
      const { error: removeReportError } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)

      if (removeReportError) {
        console.error('Report removal failed:', JSON.stringify(removeReportError, null, 2))
        throw removeReportError
      }

      console.log('Report removed successfully')
      setReports(prev => prev.filter(r => r.id !== reportId))
      addToast(action === 'delete' ? 'Content deleted and report resolved' : 'Report dismissed', 'success')
    } catch (err: any) {
      console.error('Moderation action fatal error:', JSON.stringify(err, null, 2))
      const msg = err.message || err.details || 'Unknown error'
      addToast(`Action failed: ${msg}`, 'error')
    }
  }

  return (
    <AuthGuard requiredRole={['admin', 'staff']} allowUsername="admin">
      <div className="page-container">
        <div className={styles.header}>
          <h1 className={styles.title}>Moderation Center</h1>
          <Button variant="secondary" onClick={fetchReports} size="sm">Refresh</Button>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <Spinner size="lg" />
          </div>
        ) : reports.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✅</div>
            <h2>All clear!</h2>
            <p>No pending reports to review at this time.</p>
          </div>
        ) : (
          <div className={styles.reportList}>
            {reports.map(report => (
              <div key={report.id} className={styles.reportCard}>
                <div className={styles.reportMeta}>
                  <span className={styles.typeTag}>{report.target_type}</span>
                  <span className={styles.reportDate}>{formatDistanceToNow(new Date(report.created_at))} ago</span>
                  <span className={styles.reporter}>Reported by @{report.reporter_username}</span>
                </div>
                
                <div className={styles.reasonBlock}>
                  <span className={styles.reasonLabel}>Reason:</span>
                  <span className={styles.reasonText}>{report.reason}</span>
                </div>

                <div className={styles.contentPreview}>
                  <span className={styles.previewLabel}>Content:</span>
                  <p className={styles.previewText}>{report.target_content}</p>
                </div>

                <div className={styles.actions}>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleAction(report.id, 'delete', report.target_type, report.target_id)}
                  >
                    🗑️ Delete Content
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleAction(report.id, 'dismiss')}
                  >
                    ✅ Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
