'use client'

import { useState } from 'react'
import { formatDistanceToNow } from '@/core/utils/date'
import { cn } from '@/core/utils/cn'
import { Avatar } from '@/core/components/Avatar'
import { useAuth } from '@/core/auth/useAuth'
import { type PostComment } from '@/core/hooks/usePost'
import { ReportModal } from '@/core/components/ReportModal'
import styles from './CommentCard.module.css'

interface CommentCardProps {
  comment: PostComment
  isReply?: boolean
  onReplyClick?: (commentId: string) => void
  onDelete?: (commentId: string) => void
  onUpdate?: (commentId: string, content: string) => Promise<void>
  onReact?: (commentId: string, type: 'like' | 'love') => void
}



export function CommentCard({ comment, isReply = false, onReplyClick, onDelete, onUpdate, onReact }: CommentCardProps) {
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isSaving, setIsSaving] = useState(false)
  const [isReportOpen, setReportOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const timeAgo = formatDistanceToNow(new Date(comment.created_at))
  const isOwner = user?.id === comment.user_id
  const isModerator = user?.role === 'admin' || user?.role === 'staff'

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('CommentCard: handleDelete called for comment', comment.id)
    setShowMenu(false)
    onDelete?.(comment.id)
  }

  const handleSave = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false)
      return
    }
    setIsSaving(true)
    try {
      await onUpdate?.(comment.id, editContent)
      setIsEditing(false)
    } catch (err) {
      alert('Failed to update comment')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={cn(styles.wrapper, isReply && styles.nestedWrapper)}>
      <div className={cn(styles.comment, isReply && styles.nested)}>
        <div className={styles.leftCol}>
          <div className={styles.avatarWrapper}>
            <Avatar 
              src={comment.profiles.avatar_url ?? undefined} 
              fallback={comment.profiles.username} 
              size="sm" 
            />
          </div>
        </div>
        <div className={styles.rightCol}>
          <div className={styles.header}>
            <div className={styles.authorGroup}>
              <button 
                className={styles.collapseToggle} 
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? '[+]' : '[-]'}
              </button>
              <span className={styles.authorName}>{comment.profiles.display_name || comment.profiles.username}</span>
              <span className={styles.meta}>@{comment.profiles.username} · {timeAgo}</span>
            </div>
            
            {!isEditing && (
              <div className={styles.moreMenuWrapper}>
                <button 
                  className={styles.moreBtn}
                  onClick={() => setShowMenu(!showMenu)}
                  title="Options"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>

                {showMenu && (
                  <div className={styles.dropdown}>
                    {isOwner || isModerator ? (
                      <>
                        {isOwner && (
                          <button className={styles.dropdownItem} onClick={() => { setShowMenu(false); setIsEditing(true); }}>
                            <span>✏️</span> Edit
                          </button>
                        )}
                        <button className={cn(styles.dropdownItem, styles.delete)} onClick={handleDelete}>
                          <span>🗑️</span> Delete {isModerator && !isOwner && '(Admin)'}
                        </button>
                      </>
                    ) : (
                      <button className={styles.dropdownItem} onClick={() => { setShowMenu(false); setReportOpen(true); }}>
                        <span>🚩</span> Report
                      </button>
                    )}
                  </div>
                )}
                {showMenu && <div className={styles.dropdownBackdrop} onClick={() => setShowMenu(false)} />}
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className={styles.editWrapper}>
              <textarea 
                className={styles.editTextarea}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
              />
              <div className={styles.editActions}>
                <button 
                  className={styles.cancelBtn} 
                  onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  className={styles.saveBtn} 
                  onClick={handleSave}
                  disabled={isSaving || !editContent.trim()}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className={cn(styles.content, isCollapsed && styles.contentCollapsed)}>
              {comment.content}
            </div>
          )}


          <div className={styles.actions}>
            <button 
              className={styles.actionBtn}
              onClick={() => onReplyClick?.(comment.id)}
            >
              <span className={styles.actionIcon}>💬</span>
              {isReply ? '' : 'Reply'}
            </button>

            <button 
              className={cn(styles.actionBtn, comment.userReaction === 'love' && styles.active)}
              onClick={() => onReact?.(comment.id, 'love')}
            >
              <span className={styles.actionIcon}>{comment.userReaction === 'love' ? '❤️' : '🤍'}</span>
              {(comment.reactionCounts.love > 0) && <span className={styles.count}>{comment.reactionCounts.love}</span>}
            </button>
          </div>
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className={cn(styles.replies, isCollapsed && styles.repliesCollapsed)}>
          {isCollapsed ? (
            <button className={styles.expandBtn} onClick={() => setIsCollapsed(false)}>
              Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          ) : (
            comment.replies.map(reply => (
              <CommentCard 
                key={reply.id} 
                comment={reply} 
                isReply={true} 
                onReplyClick={onReplyClick}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onReact={onReact}
              />
            ))
          )}
        </div>
      )}

      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setReportOpen(false)} 
        targetType="comment" 
        targetId={comment.id} 
      />
    </div>
  )
}


