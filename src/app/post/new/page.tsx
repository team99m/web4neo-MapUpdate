'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/core/auth/useAuth'
import { AuthGuard } from '@/core/auth/AuthGuard'
import { useToast } from '@/app/providers'
import { supabase } from '@/core/supabase/client'
import { Avatar } from '@/core/components/Avatar'
import { CategoryChip } from '@/core/components/CategoryChip'
import { ImageUpload } from '@/core/components/ImageUpload'
import { cn } from '@/core/utils/cn'
import styles from './page.module.css'

const CATEGORIES = ['road', 'flood', 'transit', 'community', 'other']
const MAX_CHARS = 2000
const MAX_IMAGES = 4

export default function NewPostPage() {
  const { user } = useAuth()
  const router = useRouter()
  const addToast = useToast()
  
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [visibility, setVisibility] = useState('public')
  const [loading, setLoading] = useState(false)
  const [showIssuePicker, setShowIssuePicker] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<{ id: string, title: string } | null>(null)
  const [userIssues, setUserIssues] = useState<{ id: string, title: string }[]>([])
  const [loadingIssues, setLoadingIssues] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-expand textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [content])

  const handleImageUpload = (url: string) => {
    if (images.length < MAX_IMAGES) {
      setImages(prev => [...prev, url])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const fetchUserIssues = async () => {
    if (!user) return
    setLoadingIssues(true)
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUserIssues(data || [])
    } catch (err) {
      console.error('Error fetching user issues:', err)
    } finally {
      setLoadingIssues(false)
    }
  }

  useEffect(() => {
    if (showIssuePicker && userIssues.length === 0) {
      fetchUserIssues()
    }
  }, [showIssuePicker])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!user) {
      addToast('You must be logged in to post', 'error')
      return
    }
    if (content.trim().length === 0) return

    setLoading(true)
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        category: category || 'other',
        images,
        visibility,
        issue_id: selectedIssue?.id || null
      })

      if (error) throw error

      addToast('Post published!', 'success')
      router.push('/feed')
    } catch (err: any) {
      console.error('Post error:', err)
      addToast(err.message || 'Failed to publish post', 'error')
      setLoading(false)
    }
  }

  const charsLeft = MAX_CHARS - content.length
  const isOverLimit = charsLeft < 0
  const isNearLimit = charsLeft <= 50 && !isOverLimit

  return (
    <AuthGuard>
      <div className={styles.container}>
        <header className={styles.header}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
            Cancel
          </button>
          <div className={styles.title}>Create Post</div>
          <button 
            type="button" 
            className={styles.postBtn}
            onClick={() => handleSubmit()}
            disabled={loading || content.trim().length === 0 || isOverLimit}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.authorRow}>
            <Avatar src={user?.avatar_url ?? undefined} fallback={user?.username || 'U'} size="sm" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className={styles.authorName}>{user?.display_name || user?.username}</span>
              <select 
                className={styles.visibilitySelect}
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="public">🌍 Public</option>
                <option value="followers">👥 Followers</option>
              </select>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder="What's happening in your community?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />

          <div className={cn(
            styles.charCount, 
            isNearLimit && styles.nearLimit,
            isOverLimit && styles.overLimit
          )}>
            {charsLeft}
          </div>

          <div className={styles.toolsSection}>
            <div className={styles.sectionGroup}>
              <div className={styles.sectionTitle}>Topic Tag</div>
              <div className={styles.categorySelect}>
                {CATEGORIES.map(cat => (
                  <CategoryChip 
                    key={cat}
                    label={cat}
                    active={category === cat}
                    onClick={() => setCategory(category === cat ? null : cat)}
                  />
                ))}
              </div>
            </div>

            <div className={styles.sectionGroup}>
              <div className={styles.sectionTitle}>Link Issue (Optional)</div>
              {selectedIssue ? (
                <div className={styles.selectedIssue}>
                  <span className={styles.issueTitle}>📌 {selectedIssue.title}</span>
                  <button type="button" className={styles.removeIssue} onClick={() => setSelectedIssue(null)}>✕</button>
                </div>
              ) : (
                <button type="button" className={styles.linkIssueBtn} onClick={() => setShowIssuePicker(true)}>
                  🔗 Link an existing report
                </button>
              )}
            </div>

            <div className={styles.sectionGroup}>
              <div className={styles.sectionTitle}>
                Photos ({images.length}/{MAX_IMAGES})
              </div>
              <div className={styles.imageGrid}>
                {images.map((url, i) => (
                  <div key={i} className={styles.imageWrapper}>
                    <img 
                      src={url} 
                      alt="Upload" 
                      className={styles.previewImage}
                    />
                    <button
                      type="button"
                      className={styles.removeImageBtn}
                      onClick={() => removeImage(i)}
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                {images.length < MAX_IMAGES && (
                  <ImageUpload 
                    onUploadSuccess={handleImageUpload}
                    folder={`posts/${user?.id}`}
                  />
                )}
              </div>
            </div>
          </div>
        </form>

        {showIssuePicker && (
          <div className={styles.modalOverlay} onClick={() => setShowIssuePicker(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Select an Issue</h3>
                <button type="button" onClick={() => setShowIssuePicker(false)}>✕</button>
              </div>
              <div className={styles.modalContent}>
                {loadingIssues ? (
                  <div className={styles.modalLoading}>Loading your reports...</div>
                ) : userIssues.length === 0 ? (
                  <div className={styles.modalEmpty}>You haven&apos;t reported any issues yet.</div>
                ) : (
                  <div className={styles.issueList}>
                    {userIssues.map(issue => (
                      <button
                        key={issue.id}
                        type="button"
                        className={styles.issueItem}
                        onClick={() => {
                          setSelectedIssue(issue)
                          setShowIssuePicker(false)
                        }}
                      >
                        {issue.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
