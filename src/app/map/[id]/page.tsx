'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/core/supabase/client'
import { useAuth } from '@/core/auth/useAuth'
import { IssueStatusTimeline } from '../components/IssueStatusTimeline'
import { BeforeAfterSlider } from '../components/BeforeAfterSlider'
import { Modal } from '@/core/components/Modal'
import { STATUS_CONFIG, CATEGORY_CONFIG } from '../types'
import type { Issue, Comment, Review, IssueStatus } from '../types'
import styles from './page.module.css'

export default function IssueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params.id as string

  const [issue, setIssue] = useState<Issue | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Staff action state
  const [actionLoading, setActionLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [staffNote, setStaffNote] = useState('')
  const [actionType, setActionType] = useState<'accept' | 'resolve' | null>(null)

  // Fetch issue data
  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: issueData } = await supabase
      .from('issues')
      .select('*, profiles:user_id(id,username,display_name,avatar_url,role,department)')
      .eq('id', id)
      .single()

    if (issueData) {
      console.log('Fetched issue data:', issueData)
      setIssue(issueData as unknown as Issue)
    }

    const { data: commentsData } = await supabase
      .from('comments')
      .select('*, profiles:user_id(id,username,display_name,avatar_url)')
      .eq('parent_type', 'issue')
      .eq('parent_id', id)
      .order('created_at', { ascending: true })

    setComments((commentsData || []) as unknown as Comment[])

    const { data: reviewData } = await supabase
      .from('reviews')
      .select('*, profiles:user_id(id,username,display_name,avatar_url)')
      .eq('issue_id', id)
      .maybeSingle()

    if (reviewData) setReview(reviewData as unknown as Review)
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`issue-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'issues', filter: `id=eq.${id}` },
        (payload) => setIssue((prev) => prev ? { ...prev, ...payload.new } as Issue : prev))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `parent_id=eq.${id}` },
        async () => {
          const { data } = await supabase
            .from('comments')
            .select('*, profiles:user_id(id,username,display_name,avatar_url)')
            .eq('parent_type', 'issue')
            .eq('parent_id', id)
            .order('created_at', { ascending: true })
          setComments((data || []) as unknown as Comment[])
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  const submitComment = async () => {
    if (!commentText.trim() || !user) return
    setSubmittingComment(true)
    await supabase.from('comments').insert({ user_id: user.id, parent_type: 'issue', parent_id: id, content: commentText.trim() })
    setCommentText('')
    setSubmittingComment(false)
  }

  const submitReview = async () => {
    if (!rating || !user || !issue) return
    setSubmittingReview(true)
    await supabase.from('reviews').insert({ issue_id: issue.id, user_id: user.id, rating, comment: reviewText.trim() || null })
    await fetchData()
    setSubmittingReview(false)
  }

  const handleStatusUpdate = async (newStatus: IssueStatus, reason?: string) => {
    if (!user || !issue) return
    setActionLoading(true)

    try {
      // 1. Update issues table
      const updateData: any = { status: newStatus }
      if (reason) updateData.reject_reason = reason
      const { error: updateError } = await supabase.from('issues').update(updateData).eq('id', issue.id)
      if (updateError) throw updateError

      // 2. Insert into issue_timeline
      const { error: timelineError } = await supabase.from('issue_timeline').insert({
        issue_id: issue.id,
        status: newStatus,
        changed_by: user.id,
        note: staffNote.trim() || null
      })
      if (timelineError) console.error('Failed to insert timeline:', timelineError)

      // 3. Insert into comments (public note)
      if (staffNote.trim()) {
        const { error: commentError } = await supabase.from('comments').insert({
          user_id: user.id,
          parent_type: 'issue',
          parent_id: issue.id,
          content: staffNote.trim()
        })
        if (commentError) console.error('Failed to insert comment:', commentError)
      }

      // Refresh data completely to be safe, though realtime might catch some
      await fetchData()
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update status. Make sure you have the required permissions.')
    } finally {
      // Reset UI states
      setStaffNote('')
      setShowNoteInput(false)
      setActionType(null)
      setShowRejectModal(false)
      setRejectReason('')
      setActionLoading(false)
    }
  }

  if (loading) return <div className={styles.loading}>Loading issue…</div>
  if (!issue) return <div className={styles.loading}>Issue not found</div>

  const stat = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open
  const cat = CATEGORY_CONFIG[issue.category] || CATEGORY_CONFIG.other
  const profile = issue.profiles
  const hasAfterPhoto = issue.status === 'resolved' && issue.images && issue.images.length >= 2

  return (
    <div className={styles.detailPage} id="issue-detail">
      <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>

      {/* Badges */}
      <div className={styles.badges}>
        <span className={styles.badge} style={{ background: stat.color }}>{stat.icon} {stat.label}</span>
        <span className={styles.badge} style={{ background: '#e8e8e8', color: '#333' }}>{cat.emoji} {cat.label}</span>
      </div>

      {/* Title + Address */}
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{issue.title}</h1>
        <p className={styles.address}>📍 {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}</p>
      </div>

      {/* Reporter */}
      {profile && (
        <div className={styles.reporter}>
          <div className={styles.avatar}>{profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} /> : '👤'}</div>
          <div className={styles.reporterInfo}>
            <div className={styles.reporterName}>{profile.display_name || profile.username || 'Anonymous'}</div>
            <div className={styles.reporterDate}>{new Date(issue.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      )}

      {/* Description */}
      {issue.description && (
        <div className={styles.section}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>{issue.description}</p>
        </div>
      )}

      {/* Photos */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Photos</h2>
        {hasAfterPhoto ? (
          <BeforeAfterSlider before={issue.images[0]} after={issue.images[issue.images.length - 1]} />
        ) : issue.images && issue.images.length > 0 ? (
          <div className={styles.gallery}>
            {issue.images.slice(0, 5).map((url, i) => (
              <img key={i} src={url} alt={`Issue photo ${i + 1}`} className={styles.galleryImg} />
            ))}
          </div>
        ) : (
          <div className={styles.noPhotos}>No photos provided</div>
        )}
      </div>

      {/* Timeline */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Status Timeline</h2>
        <IssueStatusTimeline issue={issue} />
        
        {/* Staff Action Panel */}
        {(user?.role === 'staff' || user?.role === 'admin') && (
          <div className={styles.staffPanel}>
            <div className={styles.staffPanelTitle}>🛠️ Staff Actions</div>
            {issue.status === 'open' && !showNoteInput && (
              <div className={styles.staffActions}>
                <button 
                  className={`${styles.staffBtn} ${styles.acceptBtn}`}
                  onClick={() => { setActionType('accept'); setShowNoteInput(true) }}
                >
                  Accept Issue
                </button>
              </div>
            )}
            {issue.status === 'in_progress' && !showNoteInput && (
              <div className={styles.staffActions}>
                <button 
                  className={`${styles.staffBtn} ${styles.resolveBtn}`}
                  onClick={() => { setActionType('resolve'); setShowNoteInput(true) }}
                >
                  Mark as Resolved
                </button>
                <button 
                  className={`${styles.staffBtn} ${styles.rejectBtn}`}
                  onClick={() => setShowRejectModal(true)}
                >
                  Reject Issue
                </button>
              </div>
            )}
            {(issue.status === 'resolved' || issue.status === 'rejected') && (
              <p className={styles.closedText}>This issue is closed.</p>
            )}
            
            {showNoteInput && (
              <div className={styles.noteInputWrapper}>
                <textarea
                  className={styles.noteInput}
                  placeholder="Add a public note for the citizen (optional)..."
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  disabled={actionLoading}
                />
                <div className={styles.noteSubmitRow}>
                  <button 
                    className={styles.cancelNoteBtn} 
                    onClick={() => { setShowNoteInput(false); setStaffNote(''); setActionType(null) }}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className={`${styles.staffBtn} ${actionType === 'accept' ? styles.acceptBtn : styles.resolveBtn}`}
                    onClick={() => handleStatusUpdate(actionType === 'accept' ? 'in_progress' : 'resolved')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Updating...' : `Confirm ${actionType === 'accept' ? 'Accept' : 'Resolve'}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Department */}
      {issue.department && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Assigned Department</h2>
          <div className={styles.deptInfo}>
            <div className={styles.deptLabel}>🏢 {issue.department}</div>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Comments ({comments.length})</h2>
        <div className={styles.commentList}>
          {comments.map((c) => (
            <div key={c.id} className={styles.commentItem}>
              <div className={styles.avatar} style={{width:32,height:32,fontSize:14}}>👤</div>
              <div className={styles.commentContent}>
                <div className={styles.commentUser}>{c.profiles?.display_name || c.profiles?.username || 'User'}</div>
                <div className={styles.commentTime}>{new Date(c.created_at).toLocaleString()}</div>
                <div className={styles.commentText}>{c.content}</div>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p style={{fontSize:'var(--text-sm)',color:'var(--color-text-tertiary)'}}>No comments yet.</p>}
        </div>
        {user ? (
          <div className={styles.commentForm}>
            <input
              className={styles.commentInput}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
            />
            <button className={styles.commentBtn} onClick={submitComment} disabled={submittingComment || !commentText.trim()}>
              {submittingComment ? '…' : 'Send'}
            </button>
          </div>
        ) : (
          <p style={{fontSize:'var(--text-sm)',color:'var(--color-text-tertiary)'}}>Log in to comment.</p>
        )}
      </div>

      {/* Review */}
      {issue.status === 'resolved' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Review</h2>
          {review ? (
            <div className={styles.existingReview}>
              <div className={styles.stars}>{'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
              {review.comment && <p style={{fontSize:'var(--text-sm)'}}>{review.comment}</p>}
              <p style={{fontSize:'var(--text-xs)',color:'var(--color-text-tertiary)',marginTop:8}}>Reviewed by {review.profiles?.display_name || 'User'}</p>
            </div>
          ) : user && user.id === issue.user_id ? (
            <div className={styles.reviewBox}>
              <p style={{fontSize:'var(--text-sm)',marginBottom:8}}>Rate the resolution:</p>
              <div className={styles.stars}>
                {[1,2,3,4,5].map((n) => (
                  <span key={n} className={styles.star} onClick={() => setRating(n)} style={{opacity: n <= rating ? 1 : 0.3}}>⭐</span>
                ))}
              </div>
              <textarea className={styles.reviewInput} value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="How was the resolution? (optional)" />
              <button className={styles.commentBtn} onClick={submitReview} disabled={submittingReview || !rating}>
                {submittingReview ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          ) : (
            <p style={{fontSize:'var(--text-sm)',color:'var(--color-text-tertiary)'}}>No review yet.</p>
          )}
        </div>
      )}

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => !actionLoading && setShowRejectModal(false)} title="Reject Issue">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Please provide a reason for rejecting this issue. This will be recorded and visible to the user.
          </p>
          <textarea
            className={styles.reviewInput}
            placeholder="Rejection reason (required)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            disabled={actionLoading}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button 
              className={styles.commentBtn} 
              style={{ background: 'transparent', color: 'var(--color-text-secondary)' }}
              onClick={() => setShowRejectModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button 
              className={styles.commentBtn}
              style={{ background: 'var(--color-error)' }}
              onClick={() => handleStatusUpdate('rejected', rejectReason)}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
