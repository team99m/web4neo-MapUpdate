'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/core/supabase/client'
import { useAuth } from '@/core/auth/useAuth'
import { STATUS_CONFIG, CATEGORY_CONFIG } from '../types'
import type { Issue } from '../types'
import styles from './page.module.css'

type Tab = 'inbox' | 'in_progress' | 'resolved' | 'stats'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('inbox')
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'staff' && user.role !== 'admin'))) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  const fetchIssues = useCallback(async () => {
    if (!user) return
    setLoading(true)
    let query = supabase.from('issues').select('*').order('created_at', { ascending: false })
    if (user.role === 'staff' && user.department) {
      query = query.eq('department', user.department)
    }
    const { data } = await query
    setIssues((data || []) as Issue[])
    setLoading(false)
  }, [user])

  useEffect(() => { if (user) fetchIssues() }, [user, fetchIssues])

  // Realtime
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('dashboard-issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => fetchIssues())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchIssues])

  const updateStatus = async (issueId: string, status: string) => {
    await supabase.from('issues').update({ status }).eq('id', issueId)
    fetchIssues()
  }

  const handleReject = async () => {
    if (!rejectModal) return
    await supabase.from('comments').insert({
      user_id: user!.id,
      parent_type: 'issue',
      parent_id: rejectModal,
      content: `Rejected: ${rejectReason}`,
    })
    await updateStatus(rejectModal, 'rejected')
    setRejectModal(null)
    setRejectReason('')
  }

  const filtered = issues.filter((i) => {
    if (tab === 'inbox') return i.status === 'open'
    if (tab === 'in_progress') return i.status === 'in_progress'
    if (tab === 'resolved') return i.status === 'resolved' || i.status === 'rejected'
    return true
  })

  const stats = {
    open: issues.filter((i) => i.status === 'open').length,
    in_progress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
    rejected: issues.filter((i) => i.status === 'rejected').length,
    avgResolution: (() => {
      const resolved = issues.filter((i) => i.status === 'resolved')
      if (!resolved.length) return 'N/A'
      const avg = resolved.reduce((sum, i) => sum + (new Date(i.updated_at).getTime() - new Date(i.created_at).getTime()), 0) / resolved.length
      const hours = Math.round(avg / 3600000)
      return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`
    })(),
  }

  if (authLoading || !user) return null

  return (
    <div className={styles.dashboard} id="staff-dashboard">
      <h1 className={styles.title}>Staff Dashboard</h1>

      <div className={styles.tabs}>
        {(['inbox', 'in_progress', 'resolved', 'stats'] as Tab[]).map((t) => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {t === 'inbox' ? 'Inbox' : t === 'in_progress' ? 'In Progress' : t === 'resolved' ? 'Resolved' : 'Stats'}
          </button>
        ))}
      </div>

      {tab === 'stats' ? (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}><div className={styles.statNumber}>{stats.open}</div><div className={styles.statLabel}>Open</div></div>
          <div className={styles.statCard}><div className={styles.statNumber}>{stats.in_progress}</div><div className={styles.statLabel}>In Progress</div></div>
          <div className={styles.statCard}><div className={styles.statNumber}>{stats.resolved}</div><div className={styles.statLabel}>Resolved</div></div>
          <div className={styles.statCard}><div className={styles.statNumber}>{stats.rejected}</div><div className={styles.statLabel}>Rejected</div></div>
          <div className={styles.statCard}><div className={styles.statNumber}>{stats.avgResolution}</div><div className={styles.statLabel}>Avg Resolution Time</div></div>
        </div>
      ) : loading ? (
        <div className={styles.empty}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No issues in this tab.</div>
      ) : (
        filtered.map((issue) => {
          const stat = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open
          const cat = CATEGORY_CONFIG[issue.category] || CATEGORY_CONFIG.other
          return (
            <div key={issue.id} className={styles.issueRow}>
              <span className={styles.badge} style={{ background: stat.color }}>{stat.icon}</span>
              <div className={styles.issueInfo}>
                <div className={styles.issueTitle}>{cat.emoji} {issue.title}</div>
                <div className={styles.issueMeta}>{issue.address || `${issue.lat.toFixed(2)}, ${issue.lng.toFixed(2)}`} · {new Date(issue.created_at).toLocaleDateString()}</div>
              </div>
              <div className={styles.actions}>
                {issue.status === 'open' && (
                  <>
                    <button className={`${styles.actionBtn} ${styles.acceptBtn}`} onClick={() => updateStatus(issue.id, 'in_progress')}>Accept</button>
                    <button className={`${styles.actionBtn} ${styles.rejectBtn}`} onClick={() => setRejectModal(issue.id)}>Reject</button>
                  </>
                )}
                {issue.status === 'in_progress' && (
                  <button className={`${styles.actionBtn} ${styles.resolveBtn}`} onClick={() => updateStatus(issue.id, 'resolved')}>Resolve</button>
                )}
                <button className={styles.actionBtn} style={{ background: 'var(--color-secondary)' }} onClick={() => router.push(`/map/${issue.id}`)}>View</button>
              </div>
            </div>
          )
        })
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className={styles.modal} onClick={() => setRejectModal(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Rejection Reason</h3>
            <textarea className={styles.modalInput} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Why is this issue being rejected?" />
            <div className={styles.modalActions}>
              <button className={styles.actionBtn} style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text)' }} onClick={() => setRejectModal(null)}>Cancel</button>
              <button className={`${styles.actionBtn} ${styles.rejectBtn}`} onClick={handleReject} disabled={!rejectReason.trim()}>Reject Issue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
