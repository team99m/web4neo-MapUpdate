'use client'

import { useState } from 'react'
import { useAuth } from '@/core/auth/useAuth'
import { Avatar } from '@/core/components/Avatar'
import styles from './CommentInput.module.css'

interface CommentInputProps {
  onSend: (content: string, parentId: string | null) => Promise<void>
  replyingToId: string | null
  replyingToName: string | null
  onCancelReply: () => void
  submitting?: boolean
}

export function CommentInput({ 
  onSend, 
  replyingToId, 
  replyingToName, 
  onCancelReply,
  submitting = false 
}: CommentInputProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')

  const handleSend = async () => {
    if (!content.trim() || submitting) return
    try {
      await onSend(content, replyingToId)
      setContent('')
      onCancelReply()
    } catch (err) {
      // Error handled by parent toast
    }
  }

  if (!user) return null

  return (
    <div className={styles.wrapper}>
      {replyingToId && (
        <div className={styles.replyingTo}>
          <span>Replying to <strong>@{replyingToName || ''}</strong></span>
          <button className={styles.cancelReply} onClick={onCancelReply}>✕</button>
        </div>
      )}
      <div className={styles.container}>
        <Avatar src={user.avatar_url ?? undefined} fallback={user.username || ''} size="sm" />
        <div className={styles.inputWrap}>
          <input 
            className={styles.input}
            placeholder={replyingToId ? "Write a reply..." : "Post your reply"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
        </div>
        <button 
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!content.trim() || submitting}
        >
          {submitting ? '...' : 'Reply'}
        </button>
      </div>
    </div>
  )
}
