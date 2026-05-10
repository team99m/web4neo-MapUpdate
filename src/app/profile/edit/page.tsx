'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/core/auth/AuthGuard'
import { useAuth } from '@/core/auth/useAuth'
import { useTranslation } from '@/core/i18n/useTranslation'
import { Button } from '@/core/components/Button'
import { Avatar } from '@/core/components/Avatar'
import { useToast } from '@/app/providers'
import { compressAvatar } from '@/core/utils/imageCompress'
import { supabase } from '@/core/supabase/client'
import styles from './page.module.css'

export default function EditProfilePage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const addToast = useToast()
  
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '')
      setBio(user.bio || '')
      setAvatarUrl(user.avatar_url)
    }
  }, [user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file || !user) return

      setUploading(true)
      
      // Compress to 256x256 WebP
      const compressed = await compressAvatar(file)
      
      // Upload to Supabase Storage (assuming 'avatars' bucket)
      const filePath = `${user.id}/${Date.now()}.webp`
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressed.blob, {
          contentType: 'image/webp',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      addToast('Avatar uploaded successfully', 'success')
      
    } catch (error) {
      console.error('Upload error:', error)
      addToast(error instanceof Error ? error.message : 'Failed to upload avatar', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id)

      if (error) throw error

      addToast('Profile updated', 'success')
      router.push(`/profile/${user.username}`)
      
      // Note: Ideally we force a session refresh here so the context updates, 
      // but reloading the profile page will fetch fresh data if needed.
    } catch (error) {
      console.error('Update error:', error)
      addToast(error instanceof Error ? error.message : 'Failed to update profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="page-container">
        <h1 className={styles.title}>Edit Profile</h1>
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.avatarSection}>
            <Avatar size="lg" src={avatarUrl} fallback={user?.username || ''} />
            <div className={styles.avatarActions}>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Change Avatar
              </Button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="sr-only" 
                accept="image/*"
                onChange={handleAvatarUpload}
              />
              <p className={styles.avatarHint}>JPG, PNG or GIF. Max 5MB.</p>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="displayName" className={styles.label}>Display Name</label>
            <input
              id="displayName"
              type="text"
              className={styles.input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="bio" className={styles.label}>Bio</label>
            <textarea
              id="bio"
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              maxLength={160}
              rows={4}
            />
            <span className={styles.charCount}>{bio.length}/160</span>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </AuthGuard>
  )
}
