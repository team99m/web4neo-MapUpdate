'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/core/supabase/client'
import type { Profile } from '@/core/supabase/types'
import { Avatar } from '@/core/components/Avatar'
import { Button } from '@/core/components/Button'
import { Spinner } from '@/core/components/Spinner'
import { useAuth } from '@/core/auth/useAuth'
import { useFollow } from '@/core/hooks/useFollow'
import { PostCard, type Post } from '@/core/components/PostCard'
import { CategoryChip } from '@/core/components/CategoryChip'
import { cn } from '@/core/utils/cn'
import { useReaction } from '@/core/hooks/useReaction'
import styles from './page.module.css'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const { user: currentUser } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const { isFollowing, followerCount, followingCount, toggleFollow, loading: followLoading } = useFollow(profile?.id)
  const { getReactionsForParents } = useReaction()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'issues' | 'posts'>('posts') // Default to posts for social feel
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [userIssues, setUserIssues] = useState<any[]>([])
  const [loadingContent, setLoadingContent] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single()

        if (fetchError) throw fetchError
        setProfile(data as Profile)
      } catch (err) {
        console.error(err)
        setError('Profile not found')
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchProfile()
    }
  }, [username])

  useEffect(() => {
    const fetchContent = async () => {
      if (!profile) return
      setLoadingContent(true)
      try {
        if (activeTab === 'posts') {
          const { data, error: postsError } = await (supabase
            .from('posts')
            .select('*, profiles:user_id(username, display_name, avatar_url)') as any)
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })

          if (postsError) throw postsError

          const postIds = (data || []).map((p: any) => p.id)
          const reactionData = await getReactionsForParents(postIds, 'post')

          // Fetch comment counts
          const { data: commentCounts } = await supabase
            .from('comments')
            .select('post_id')
            .in('post_id', postIds)
          
          const countMap: Record<string, number> = {}
          commentCounts?.forEach((c: any) => {
            countMap[c.post_id] = (countMap[c.post_id] || 0) + 1
          })
          
          const formatted: Post[] = (data || []).map((p: any) => ({
            id: p.id,
            content: p.content,
            images: p.images || [],
            category: p.category,
            created_at: p.created_at,
            author: {
              id: p.user_id,
              username: p.profiles?.username || '',
              display_name: p.profiles?.display_name || '',
              avatar_url: p.profiles?.avatar_url || null
            },
            reactionCounts: reactionData[p.id]?.counts || { like: 0, love: 0, angry: 0, fix_it: 0 },
            userReaction: reactionData[p.id]?.userReaction || null,
            commentCount: countMap[p.id] || 0
          }))
          setUserPosts(formatted)
        } else {
          const { data, error: issuesError } = await supabase
            .from('issues')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })

          if (issuesError) throw issuesError
          setUserIssues(data || [])
        }
      } catch (err) {
        console.error('Error fetching profile content:', err)
      } finally {
        setLoadingContent(false)
      }
    }

    fetchContent()
  }, [profile, activeTab])

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: 'var(--space-12)' }}>
        <h2>User not found</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>The user @{username} does not exist.</p>
        <Button onClick={() => router.push('/')} style={{ marginTop: 'var(--space-4)' }}>Go Home</Button>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="page-container">
      <div className={styles.header}>
        <Avatar size="lg" src={profile.avatar_url} fallback={profile.username || ''} />
        <div className={styles.info}>
          <h1 className={styles.displayName}>{profile.display_name || profile.username}</h1>
          <p className={styles.username}>@{profile.username}</p>
          <div className={styles.badges}>
            <span className={styles.roleBadge}>{profile.role}</span>
            {profile.department && <span className={styles.deptBadge}>{profile.department}</span>}
          </div>
          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
          <div className={styles.stats}>
            <span><strong>{followingCount}</strong> Following</span>
            <span><strong>{followerCount}</strong> Followers</span>
          </div>
        </div>
        
        {isOwnProfile ? (
          <Button variant="secondary" size="sm" onClick={() => router.push('/profile/edit')} className={styles.editBtn}>
            Edit Profile
          </Button>
        ) : (
          <Button 
            variant={isFollowing ? "secondary" : "primary"} 
            size="sm" 
            className={styles.editBtn}
            onClick={toggleFollow}
            loading={followLoading}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Button>
        )}
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'issues' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          Reported Issues
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'posts' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Community Posts
        </button>
      </div>

      <div className={styles.content}>
        {loadingContent ? (
          <div className={styles.loadingTab}>
            <Spinner size="md" />
          </div>
        ) : activeTab === 'issues' ? (
          userIssues.length > 0 ? (
            <div className={styles.issuesList}>
              {userIssues.map(issue => (
                <div key={issue.id} className={styles.issueItem} onClick={() => router.push(`/report/${issue.id}`)}>
                  <div className={styles.issueHeader}>
                    <span className={styles.issueTitle}>{issue.title}</span>
                    <span className={cn(styles.statusBadge, styles[issue.status])}>{issue.status}</span>
                  </div>
                  <div className={styles.issueMeta}>
                    <CategoryChip label={issue.category} className={styles.issueCategory} />
                    <span>·</span>
                    <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📢</span>
              <p>No issues reported yet.</p>
              {isOwnProfile && (
                <Button size="sm" onClick={() => router.push('/report')} style={{ marginTop: 'var(--space-2)' }}>
                  Report an Issue
                </Button>
              )}
            </div>
          )
        ) : (
          userPosts.length > 0 ? (
            <div className={styles.postsList}>
              {userPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>💬</span>
              <p>No posts yet.</p>
              {isOwnProfile && (
                <Button size="sm" onClick={() => router.push('/post/new')} style={{ marginTop: 'var(--space-2)' }}>
                  Create Post
                </Button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
