'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/core/supabase/client'
import type { Profile } from '@/core/supabase/types'
import { Avatar } from '@/core/components/Avatar'
import { Button } from '@/core/components/Button'
import { Spinner } from '@/core/components/Spinner'
import { useAuth } from '@/core/auth/useAuth'
import styles from './page.module.css'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const { user: currentUser } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'issues' | 'posts'>('issues')

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
        </div>
        
        {isOwnProfile && (
          <Button variant="secondary" size="sm" onClick={() => router.push('/profile/edit')} className={styles.editBtn}>
            Edit Profile
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
        {activeTab === 'issues' && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📢</span>
            <p>No issues reported yet.</p>
            {isOwnProfile && (
              <Button size="sm" onClick={() => router.push('/report')} style={{ marginTop: 'var(--space-2)' }}>
                Report an Issue
              </Button>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>💬</span>
            <p>No posts yet.</p>
            {isOwnProfile && (
              <Button size="sm" onClick={() => router.push('/post/new')} style={{ marginTop: 'var(--space-2)' }}>
                Create Post
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
