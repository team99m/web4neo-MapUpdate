'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/core/supabase/client'
import { useAuth } from '@/core/auth/useAuth'
import { IssueStatusTimeline } from '@/core/components/IssueStatusTimeline'
import { BeforeAfterSlider } from '@/core/components/BeforeAfterSlider'
import { Modal } from '@/core/components/Modal'
import { useReaction } from '@/core/hooks/useReaction'
import { ReactionGroup, type ReactionType, type ReactionCounts } from '@/core/components/ReactionGroup'
import { STATUS_CONFIG, CATEGORY_CONFIG } from '@/core/types/issue'
import type { IssueStatus } from '@/core/types/issue'
import styles from './page.module.css'

export default function IssueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params.id as string

  const [issue, setIssue] = useState<any | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])
  const [review, setReview] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const { getReactionsForParents, toggleReaction: toggleReactionHook } = useReaction()
  const [reactionData, setReactionData] = useState<{ counts: ReactionCounts; userReaction: ReactionType | null }>({
    counts: { like: 0, love: 0, angry: 0, fix_it: 0 },
    userReaction: null
  })
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
    try {
      setLoading(true)
      const { data: issueData, error: issueError } = await supabase
        .from('issues')
        .select('*, profiles:user_id(id,username,display_name,avatar_url,role,department)')
        .eq('id', id)
        .single()

      if (issueError) throw issueError
      setIssue(issueData)

      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, profiles:user_id(id,username,display_name,avatar_url)')
        .eq('parent_type', 'issue')
        .eq('parent_id', id)
        .order('created_at', { ascending: true })

      setComments(commentsData || [])

      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*, profiles:user_id(id,username,display_name,avatar_url)')
        .eq('issue_id', id)
        .maybeSingle()

      if (reviewData) setReview(reviewData)

      const { data: timelineData } = await supabase
        .from('issue_timeline')
        .select('*')
        .eq('issue_id', id)
        .order('changed_at', { ascending: false })
      
      setTimeline(timelineData || [])

      // Fetch reactions
      const reactions = await getReactionsForParents([id], 'issue')
      if (reactions[id]) {
        setReactionData(reactions[id])
      }
    } catch (err) {
      console.error('Error fetching issue detail:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`issue-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'issues', filter: `id=eq.${id}` },
        (payload) => setIssue((prev: any) => prev ? { ...prev, ...payload.new } : prev))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `parent_id=eq.${id}` },
        async (payload) => {
          // Fetch the full comment with profile
          const { data } = await supabase
            .from('comments')
            .select('*, profiles:user_id(id,username,display_name,avatar_url)')
            .eq('id', payload.new.id)
            .single()
          if (data) setComments(prev => [...prev, data])
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions', filter: `parent_id=eq.${id}` },
        async () => {
          const reactions = await getReactionsForParents([id], 'issue')
          if (reactions[id]) setReactionData(reactions[id])
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issue_timeline', filter: `issue_id=eq.${id}` },
        () => fetchData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  const submitComment = async () => {
    if (!commentText.trim() || !user) return
    setSubmittingComment(true)
    try {
      const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        parent_type: 'issue',
        parent_id: id,
        content: commentText.trim()
      })
      if (error) throw error
      setCommentText('')
    } catch (err) {
      console.error('Comment error:', err)
      alert('Failed to send comment.')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleReact = async (type: ReactionType) => {
    if (!user) return
    try {
      await toggleReactionHook(id, type, 'issue')
      // Local update for snappiness
      const reactions = await getReactionsForParents([id], 'issue')
      if (reactions[id]) setReactionData(reactions[id])
    } catch (err) {
      console.error('Reaction error:', err)
    }
  }

  const submitReview = async () => {
    if (!rating || !user || !issue) return
    setSubmittingReview(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        issue_id: issue.id,
        user_id: user.id,
        rating,
        comment: reviewText.trim() || null
      })
      if (error) throw error
      await fetchData()
    } catch (err: any) {
      console.error('Review error details:', JSON.stringify(err, null, 2))
      const msg = err?.message || (typeof err === 'string' ? err : 'Unknown error')
      alert(`Failed to submit review: ${msg}`)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleStatusUpdate = async (newStatus: IssueStatus, reason?: string) => {
    if (!user || !issue) return
    setActionLoading(true)

    try {
      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() }
      if (reason) updateData.reject_reason = reason
      
      const { error: updateError } = await supabase.from('issues').update(updateData).eq('id', issue.id)
      
      console.log('Status update result — error:', updateError?.message, 'code:', updateError?.code)
      if (updateError) throw updateError

      // Timeline entry
      await supabase.from('issue_timeline').insert({
        issue_id: issue.id,
        status: newStatus,
        changed_by: user.id,
        note: staffNote.trim() || null
      })

      // Add as public comment if note exists
      if (staffNote.trim()) {
        await supabase.from('comments').insert({
          user_id: user.id,
          parent_type: 'issue',
          parent_id: issue.id,
          content: `Staff Note: ${staffNote.trim()}`
        })
      }

      await fetchData()
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update status.')
    } finally {
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

  const stat = STATUS_CONFIG[issue.status as IssueStatus] || STATUS_CONFIG.open
  const cat = CATEGORY_CONFIG[issue.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other
  const profile = issue.profiles
  const hasAfterPhoto = issue.status === 'resolved' && issue.images && issue.images.length >= 2

  return (
    <div className={styles.detailPage} id="issue-detail">
      <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>

      <div className={styles.badges}>
        <span className={styles.badge} style={{ background: stat.color }}>{stat.icon} {stat.label}</span>
        <span className={styles.badge} style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>{cat.emoji} {cat.label}</span>
      </div>

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{issue.title}</h1>
        <p className={styles.address}>📍 {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}</p>
      </div>

      {profile && (
        <div className={styles.reporter}>
          <div className={styles.avatar}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
            ) : '👤'}
          </div>
          <div className={styles.reporterInfo}>
            <div className={styles.reporterName}>{profile.display_name || profile.username || 'Anonymous'}</div>
            <div className={styles.reporterDate}>{new Date(issue.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      )}

      {issue.description && (
        <div className={styles.section}>
          <p className={styles.descriptionText}>{issue.description}</p>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Photos</h2>
        {hasAfterPhoto ? (
          <BeforeAfterSlider before={issue.images[0]} after={issue.images[issue.images.length - 1]} />
        ) : issue.images && issue.images.length > 0 ? (
          <div className={styles.gallery}>
            {issue.images.map((url: string, i: number) => (
              <img key={i} src={url} alt={`Issue photo ${i + 1}`} className={styles.galleryImg} />
            ))}
          </div>
        ) : (
          <div className={styles.noPhotos}>No photos provided</div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Status Timeline</h2>
        {issue.status === 'rejected' && issue.reject_reason && (
          <div className={styles.rejectCallout}>
            <span className={styles.rejectLabel}>Rejection Reason:</span>
            <p className={styles.rejectText}>{issue.reject_reason}</p>
          </div>
        )}
        <IssueStatusTimeline issue={issue} history={timeline} />
        
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
                <button 
                  className={`${styles.staffBtn} ${styles.rejectBtn}`}
                  onClick={() => setShowRejectModal(true)}
                >
                  Reject
                </button>
              </div>
            )}
            {issue.status === 'in_progress' && !showNoteInput && (
              <div className={styles.staffActions}>
                <button 
                  className={`${styles.staffBtn} ${styles.resolveBtn}`}
                  onClick={() => { setActionType('resolve'); setShowNoteInput(true) }}
                >
                  Mark Resolved
                </button>
                <button 
                  className={`${styles.staffBtn} ${styles.rejectBtn}`}
                  onClick={() => setShowRejectModal(true)}
                >
                  Reject
                </button>
              </div>
            )}
            
            {showNoteInput && (
              <div className={styles.noteInputWrapper}>
                <textarea
                  className={styles.noteInput}
                  placeholder="Add a public note (optional)..."
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

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>What do you think?</h2>
        <ReactionGroup 
          counts={reactionData.counts}
          userReaction={reactionData.userReaction}
          onReact={handleReact}
          disabled={!user}
        />
        {!user && <p className={styles.loginToComment} style={{textAlign:'left',padding:0,marginTop:8}}>Log in to react to this issue.</p>}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Comments ({comments.length})</h2>
        <div className={styles.commentList}>
          {comments.map((c) => (
            <div key={c.id} className={styles.commentItem}>
              <div className={styles.avatar} style={{width:32,height:32,fontSize:14}}>
                {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} alt="" style={{width:'100%',height:'100%',borderRadius:'50%'}} /> : '👤'}
              </div>
              <div className={styles.commentContent}>
                <div className={styles.commentUser}>{c.profiles?.display_name || c.profiles?.username || 'User'}</div>
                <div className={styles.commentTime}>{new Date(c.created_at).toLocaleString()}</div>
                <div className={styles.commentText}>{c.content}</div>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className={styles.noComments}>No comments yet.</p>}
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
          <p className={styles.loginToComment}>Log in to join the discussion.</p>
        )}
      </div>

      {issue.status === 'resolved' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Review</h2>
          {review ? (
            <div className={styles.existingReview}>
              <div className={styles.stars}>{'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
              {review.comment && <p style={{fontSize:'var(--text-sm)'}}>{review.comment}</p>}
              <p className={styles.reviewBy}>Reviewed by {review.profiles?.display_name || 'User'}</p>
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
            <p className={styles.noComments}>No review yet.</p>
          )}
        </div>
      )}

      <Modal isOpen={showRejectModal} onClose={() => !actionLoading && setShowRejectModal(false)} title="Reject Issue">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Provide a reason for rejection. This will be visible to the citizen.
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
              className={styles.cancelNoteBtn}
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
