'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/core/i18n/useTranslation'
import { useFeed } from '@/core/hooks/useFeed'
import { PostCard } from '@/core/components/PostCard'
import { CategoryChip } from '@/core/components/CategoryChip'
import { Button } from '@/core/components/Button'
import { Spinner } from '@/core/components/Spinner'
import { BottomNav } from '@/core/components/BottomNav'
import { cn } from '@/core/utils/cn'
import { useToast } from '@/app/providers'
import styles from './page.module.css'

const CATEGORIES = ['all', 'road', 'flood', 'transit', 'community', 'other']

export default function FeedPage() {
  const { t } = useTranslation()
  const addToast = useToast()
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { 
    posts, loading, loadingMore, hasMore, newPostsCount, 
    loadMore, refreshFeed, deletePost, updatePost, toggleReaction 
  } = useFeed(activeCategory, searchQuery)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  const handleRefresh = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    refreshFeed()
  }

  const handleDeletePost = async (id: string) => {
    try {
      await deletePost(id)
      addToast('Post deleted', 'success')
    } catch (err) {
      addToast('Failed to delete post', 'error')
    }
  }

  const handleUpdatePost = async (id: string, content: string) => {
    try {
      await updatePost(id, content)
      addToast('Post updated', 'success')
    } catch (err) {
      addToast('Failed to update post', 'error')
    }
  }

  const handleHashtagClick = (tag: string) => {
    setSearchInput(tag)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }


  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <h1 className={styles.title}>{t('nav.feed')}</h1>
          <div className={styles.topActions}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input 
                type="text" 
                className={styles.searchInput}
                placeholder="Search posts or #hashtags..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button className={styles.clearSearch} onClick={() => setSearchInput('')}>
                  ✕
                </button>
              )}
            </div>
            <Link href="/post/new" className={styles.composeBtn} aria-label="Create new post">
              +
            </Link>
          </div>
        </div>
        
        <div className={styles.filters}>
          {CATEGORIES.map(cat => (
            <CategoryChip 
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={styles.filterChip}
            />
          ))}
        </div>

        {newPostsCount > 0 && (
          <button className={styles.newPostsToast} onClick={handleRefresh}>
            ↑ {newPostsCount} new post{newPostsCount > 1 ? 's' : ''}
          </button>
        )}
      </header>

      <main className={styles.feedList}>
        {loading ? (
          <div className={styles.loadingCenter}>
            <Spinner size="lg" />
            <p className={styles.loadingText}>Connecting to community...</p>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => refreshFeed()}
              className={styles.retryBtn}
            >
              Still loading? Try again
            </Button>
          </div>
        ) : posts.length > 0 ? (
          <>
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onReact={toggleReaction} 
                onCommentClick={(id) => window.location.href = `/post/${id}`}
                onDelete={handleDeletePost}
                onUpdate={handleUpdatePost}
                onHashtagClick={handleHashtagClick}
              />
            ))}
            
            {hasMore ? (
              <Button 
                variant="ghost" 
                onClick={loadMore} 
                loading={loadingMore}
                className={styles.loadMoreBtn}
              >
                Load More
              </Button>
            ) : (
              <p className={styles.endMessage}>You&apos;ve caught up on all posts!</p>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <h2>No posts yet</h2>
            <p>Be the first to share something with the community!</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
