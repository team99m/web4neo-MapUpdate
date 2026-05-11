'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from '../utils/date'
import { cn } from '@/core/utils/cn'
import { useAuth } from '@/core/auth/useAuth'
import { Avatar } from '@/core/components/Avatar'
import { CategoryChip } from '@/core/components/CategoryChip'
import { ImageLightbox } from '@/core/components/ImageLightbox'
import { ReactionGroup, type ReactionCounts, type ReactionType } from '@/core/components/ReactionGroup'
import { ReportModal } from '@/core/components/ReportModal'
import { useToast } from '@/app/providers'
import styles from './PostCard.module.css'

export interface PostAuthor {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
}

export interface Post {
  id: string
  content: string
  images: string[]
  category: string | null
  created_at: string
  author: PostAuthor
  reactionCounts: ReactionCounts
  userReaction: ReactionType | null
  commentCount: number
  issue_id?: string | null
  issue_title?: string | null
}

interface PostCardProps {
  post: Post
  onReact?: (postId: string, type: ReactionType) => void
  onCommentClick?: (postId: string) => void
  onImageClick?: (images: string[], index: number) => void
  onDelete?: (postId: string) => void
  onUpdate?: (postId: string, content: string, category?: string) => Promise<void>
  onHashtagClick?: (tag: string) => void
  className?: string
  fullMode?: boolean
}


const MAX_CONTENT_LENGTH = 280

export function PostCard({
  post,
  onReact,
  onCommentClick,
  onImageClick,
  onDelete,
  onUpdate,
  onHashtagClick,
  className,
  fullMode = false,
}: PostCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const addToast = useToast()
  const [expanded, setExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editCategory, setEditCategory] = useState(post.category || 'other')
  const [isSaving, setIsSaving] = useState(false)
  const [isReportOpen, setReportOpen] = useState(false)

  // Lightbox state
  const [isLightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const isOwner = user?.id === post.author.id
  const isModerator = user?.role === 'admin' || user?.role === 'staff'

  const handleImageClickInternal = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
    onImageClick?.(post.images, index)
  }

  const isLong = post.content.length > MAX_CONTENT_LENGTH
  const displayContent = !fullMode && !expanded && isLong 
    ? post.content.slice(0, MAX_CONTENT_LENGTH) + '...' 
    : post.content

  const timeAgo = formatDistanceToNow(new Date(post.created_at))

  const numImages = post.images?.length || 0
  const gridClass = numImages === 1 ? styles.grid1 
                  : numImages === 2 ? styles.grid2 
                  : numImages === 3 ? styles.grid3 
                  : numImages >= 4 ? styles.grid4 
                  : ''

  const displayImages = post.images?.slice(0, 4) || []
  const extraImages = numImages - 4

  const handleCardClick = () => {
    if (!fullMode) {
      router.push(`/post/${post.id}`)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    console.log('PostCard: handleDelete called for post', post.id)
    setShowMenu(false)
    onDelete?.(post.id)
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const url = `${window.location.origin}/post/${post.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Web4neo Community Post',
          text: post.content.slice(0, 100),
          url: url
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        addToast('Link copied to clipboard!', 'info')
      } catch (err) {
        console.error('Failed to copy link:', err)
      }
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setShowMenu(false)
    setIsEditing(true)
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editContent.trim()) return
    
    // Check if anything actually changed
    if (editContent === post.content && editCategory === post.category) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onUpdate?.(post.id, editContent, editCategory || undefined)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update post:', err)
      alert('Failed to update post')
    } finally {
      setIsSaving(false)
    }
  }

  const renderContent = (text: string) => {
    if (!text) return null
    
    // Regular expression to match hashtags (e.g., #traffic, #flood2024)
    const hashtagRegex = /#(\w+)/g
    const parts = text.split(hashtagRegex)
    
    if (parts.length === 1) return text

    const result: (string | React.ReactNode)[] = []
    let lastIndex = 0
    let match

    // Reset regex index
    hashtagRegex.lastIndex = 0

    while ((match = hashtagRegex.exec(text)) !== null) {
      // Push text before match
      result.push(text.slice(lastIndex, match.index))
      
      // Push hashtag as link
      const tag = match[0]
      result.push(
        <span 
          key={match.index} 
          className={styles.hashtag}
          onClick={(e) => {
            e.stopPropagation()
            onHashtagClick?.(tag)
          }}
        >
          {tag}
        </span>
      )
      
      lastIndex = hashtagRegex.lastIndex
    }

    // Push remaining text
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex))
    }

    return result
  }

  return (
    <article 
      className={cn(styles.card, fullMode && styles.fullMode, className)}
      onClick={handleCardClick}
    >
      {/* LEFT COLUMN: Avatar */}
      <div className={styles.leftCol}>
        <Link href={`/profile/${post.author.username}`} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
          <Avatar 
            src={post.author.avatar_url} 
            fallback={post.author.username} 
            size="md" 
          />
        </Link>
      </div>

      {/* RIGHT COLUMN: Content */}
      <div className={styles.rightCol}>
        <header className={styles.header}>
          <Link href={`/profile/${post.author.username}`} className={styles.authorInfo} onClick={(e) => e.stopPropagation()}>
            <span className={styles.authorName}>
              {post.author.display_name || post.author.username}
            </span>
            <div className={styles.meta}>
              <span>@{post.author.username}</span>
              <span>·</span>
              <time dateTime={post.created_at}>{timeAgo}</time>
            </div>
          </Link>
          
          {!isEditing && (
            <div className={styles.moreMenuWrapper}>
              <button 
                className={styles.moreBtn} 
                aria-label="More options" 
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowMenu(!showMenu); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>

              {showMenu && (
                <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                  {isOwner || isModerator ? (
                    <>
                      {isOwner && (
                        <button className={styles.dropdownItem} onClick={handleEdit}>
                          <span>✏️</span> Edit
                        </button>
                      )}
                      <button className={cn(styles.dropdownItem, styles.delete)} onClick={handleDelete}>
                        <span>🗑️</span> Delete {isModerator && !isOwner && '(Admin)'}
                      </button>
                    </>
                  ) : (
                    <button className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); setShowMenu(false); setReportOpen(true); }}>
                      <span>🚩</span> Report
                    </button>
                  )}
                </div>
              )}
              
              {showMenu && <div className={styles.dropdownBackdrop} onClick={() => setShowMenu(false)} />}
            </div>
          )}
        </header>

        <div className={styles.content}>
          {isEditing ? (
            <div className={styles.editWrapper} onClick={(e) => e.stopPropagation()}>
              <textarea 
                className={styles.editTextarea}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
              />
              
              <div className={styles.editCategoryRow}>
                <label>Category:</label>
                <select 
                  className={styles.categorySelect}
                  value={editCategory || 'other'}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  <option value="road">Road</option>
                  <option value="flood">Flood</option>
                  <option value="transit">Transit</option>
                  <option value="community">Community</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.editActions}>
                <button 
                  className={styles.cancelBtn} 
                  onClick={() => { setIsEditing(false); setEditContent(post.content); setEditCategory(post.category || 'other'); }}
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
            <>
              {renderContent(displayContent)}
              {isLong && !expanded && !fullMode && (
                <button className={styles.readMore} onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>
                  Read more
                </button>
              )}
            </>
          )}
        </div>


        {post.category && (
          <div className={styles.tags} onClick={(e) => e.stopPropagation()}>
            <CategoryChip label={post.category} />
            {post.issue_id && post.issue_title && (
              <Link 
                href={`/issues/${post.issue_id}`} 
                className={styles.issueLink}
                onClick={(e) => e.stopPropagation()}
              >
                📌 Linked Report: {post.issue_title}
              </Link>
            )}
          </div>
        )}

        {numImages > 0 && (
          <div className={cn(styles.imageGrid, gridClass)}>
            {displayImages.map((url, i) => (
              <div 
                key={i} 
                className={styles.imgWrap}
                onClick={(e) => { e.stopPropagation(); handleImageClickInternal(i); }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Post image ${i + 1}`} className={styles.img} loading="lazy" />
                {i === 3 && extraImages > 0 && (
                  <div className={styles.moreOverlay}>
                    +{extraImages}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <footer className={styles.footer} onClick={(e) => e.stopPropagation()}>
          <button 
            className={cn(styles.actionBtn, styles.comment)} 
            onClick={() => onCommentClick?.(post.id)}
            aria-label="Reply"
          >
            <div className={styles.actionIconWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </div>
            {post.commentCount > 0 && <span>{post.commentCount}</span>}
          </button>

          <ReactionGroup 
            counts={post.reactionCounts} 
            userReaction={post.userReaction}
            onReact={(type) => onReact?.(post.id, type)}
          />

          <button className={cn(styles.actionBtn, styles.share)} aria-label="Share" onClick={handleShare}>
            <div className={styles.actionIconWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
          </button>
        </footer>
      </div>

      <ImageLightbox 
        images={post.images} 
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setReportOpen(false)} 
        targetType="post" 
        targetId={post.id} 
      />
    </article>
  )
}
