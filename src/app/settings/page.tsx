'use client'

import { useState } from 'react'
import { AuthGuard } from '@/core/auth/AuthGuard'
import { useAuth } from '@/core/auth/useAuth'
import { useTranslation } from '@/core/i18n/useTranslation'
import { Button } from '@/core/components/Button'
import { useToast } from '@/app/providers'
import { supabase } from '@/core/supabase/client'
import styles from './page.module.css'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { t, locale, setLocale } = useTranslation()
  const addToast = useToast()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPwd, setUpdatingPwd] = useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error')
      return
    }
    
    if (password.length < 6) {
      addToast('Password must be at least 6 characters', 'error')
      return
    }

    setUpdatingPwd(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
      addToast('Password updated successfully', 'success')
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to update password', 'error')
    } finally {
      setUpdatingPwd(false)
    }
  }

  return (
    <AuthGuard>
      <div className="page-container">
        <h1 className={styles.title}>{t('nav.settings') || 'Settings'}</h1>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Account Details</h2>
          {user && (
            <div className={styles.accountInfo}>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Username:</strong> @{user.username}</p>
              <p><strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>{user.role}</span></p>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Change Password</h2>
          <form className={styles.form} onSubmit={handleUpdatePassword}>
            <div className={styles.field}>
              <label htmlFor="new-pwd" className={styles.label}>New Password</label>
              <input
                id="new-pwd"
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="confirm-pwd" className={styles.label}>Confirm Password</label>
              <input
                id="confirm-pwd"
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" loading={updatingPwd} className={styles.actionBtn}>
              Update Password
            </Button>
          </form>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Preferences</h2>
          <div className={styles.prefsRow}>
            <span className={styles.label}>Language</span>
            <div className={styles.langToggles}>
              <Button 
                size="sm" 
                variant={locale === 'en' ? 'primary' : 'secondary'}
                onClick={() => setLocale('en')}
              >
                English
              </Button>
              <Button 
                size="sm" 
                variant={locale === 'th' ? 'primary' : 'secondary'}
                onClick={() => setLocale('th')}
              >
                ภาษาไทย
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.dangerZone}>
          <h2 className={styles.sectionTitle} style={{ color: 'var(--color-danger)' }}>Danger Zone</h2>
          <Button variant="danger" onClick={() => logout()} className={styles.actionBtn}>
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </AuthGuard>
  )
}
