'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePost } from '@/core/hooks/usePost'
import { PostCard } from '@/core/components/PostCard'
import { CommentCard } from '@/core/components/CommentCard'
import { CommentInput } from '@/core/components/CommentInput'
import { Spinner } from '@/core/components/Spinner'
import { useToast } from '@/app/providers'
import styles from './page.module.css'

/**
 * Post Detail Page — single post with comments and reactions.
 * Route: /post/[id]
 */
export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const addToast = useToast()
  
  const { post, comments, loading, submitting, addComment } = usePost(postId)
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null)

  const handleSendComment = async (content: string, parentId: string | null) => {
    try {
      await addComment(content, parentId)
      addToast('Reply sent!', 'success')
    } catch (err) {
      addToast('Failed to send reply', 'error')
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className={styles.errorWrapper}>
        <h2>Post not found</h2>
        <button onClick={() => router.push('/feed')}>Back to Feed</button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ← Post
        </button>
      </header>

      <main className={styles.main}>
        <PostCard 
          post={post} 
          fullMode={true} 
          className={styles.postView}
        />

        <div className={styles.commentsSection}>
          {comments.length > 0 ? (
            comments.map(comment => (
              <CommentCard 
                key={comment.id} 
                comment={comment} 
                onReplyClick={(id) => setReplyingTo({ id, name: comment.profiles.username })}
              />
            ))
          ) : (
            <div className={styles.noComments}>
              No replies yet. Be the first to reply!
            </div>
          )}
        </div>
      </main>

      <CommentInput 
        onSend={handleSendComment}
        replyingToId={replyingTo?.id || null}
        replyingToName={replyingTo?.name || null}
        onCancelReply={() => setReplyingTo(null)}
        submitting={submitting}
      />
    </div>
  )
}
