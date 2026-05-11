'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePost, type PostComment } from '@/core/hooks/usePost'
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
  
  const { 
    post, 
    comments, 
    loading, 
    submitting, 
    addComment, 
    deleteComment, 
    deletePost, 
    updateComment, 
    updatePost,
    toggleReaction,
    toggleCommentReaction
  } = usePost(postId)
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null)

  const handleSendComment = async (content: string, parentId: string | null) => {
    try {
      await addComment(content, parentId)
      addToast('Reply sent!', 'success')
    } catch (err) {
      addToast('Failed to send reply', 'error')
    }
  }

  const handleCommentDelete = async (id: string) => {
    try {
      await deleteComment(id)
      addToast('Comment deleted', 'success')
    } catch (err) {
      addToast('Failed to delete comment', 'error')
    }
  }

  const handlePostDelete = async (id: string) => {
    try {
      await deletePost(id)
      addToast('Post deleted', 'success')
      router.push('/feed')
    } catch (err) {
      addToast('Failed to delete post', 'error')
    }
  }

  const handlePostUpdate = async (id: string, content: string) => {
    try {
      await updatePost(id, content)
      addToast('Post updated', 'success')
    } catch (err) {
      addToast('Failed to update post', 'error')
    }
  }

  const handleCommentUpdate = async (id: string, content: string) => {
    try {
      await updateComment(id, content)
      addToast('Comment updated', 'success')
    } catch (err) {
      addToast('Failed to update comment', 'error')
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
          onDelete={handlePostDelete}
          onUpdate={handlePostUpdate}
          onReact={(id, type) => toggleReaction(type)}
        />

        <div className={styles.commentsSection}>
          {comments.length > 0 ? (
            comments.map((comment: PostComment) => (
              <CommentCard 
                key={comment.id} 
                comment={comment} 
                onReplyClick={(id) => setReplyingTo({ id, name: comment.profiles.username })}
                onDelete={handleCommentDelete}
                onUpdate={handleCommentUpdate}
                onReact={(id, type) => toggleCommentReaction(id, type)}
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
