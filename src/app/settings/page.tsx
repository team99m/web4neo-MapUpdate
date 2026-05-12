'use client'

import { useState, useEffect, useCallback } from 'react'
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

  const [googleLinked, setGoogleLinked] = useState(false)
  const [googleEmail, setGoogleEmail] = useState<string | null>(null)
  const [checkingLinked, setCheckingLinked] = useState(true)

  const checkLinkedAccounts = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getUserIdentities()
      if (error) throw error

      const identities = data?.identities || []
      const googleId = identities.find(i => i.provider === 'google')
      
      setGoogleLinked(!!googleId)
      setGoogleEmail(googleId?.identity_data?.email ?? null)
    } catch (err) {
      console.error('Error checking identities:', err)
    } finally {
      setCheckingLinked(false)
    }
  }, [])

  useEffect(() => {
    checkLinkedAccounts()
  }, [checkLinkedAccounts])

  const linkGoogle = async () => {
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      addToast(error.message, 'error')
    }
  }

  const unlinkGoogle = async () => {
    try {
      const { data, error: idError } = await supabase.auth.getUserIdentities()
      if (idError) throw idError

      const identities = data?.identities || []
      
      // Check if there's at least one other login method
      if (identities.length <= 1) {
        addToast('กรุณาตั้งรหัสผ่านก่อนยกเลิกการเชื่อมต่อ', 'error')
        return
      }

      const googleIdentity = identities.find(i => i.provider === 'google')
      if (googleIdentity) {
        const { error } = await supabase.auth.unlinkIdentity(googleIdentity)
        if (error) throw error
        
        addToast('ยกเลิกการเชื่อมต่อ Google แล้ว', 'success')
        checkLinkedAccounts()
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Unlink error', 'error')
    }
  }

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
          <h2 className={styles.sectionTitle}>บัญชีที่เชื่อมต่อ</h2>
          <div className={styles.connectedAccounts}>
            <div className={styles.accountItem}>
              <div className={styles.accountLabel}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div className={styles.accountInfoText}>
                  <span className={styles.providerName}>Google</span>
                  <span className={styles.providerStatus}>
                    {googleLinked ? googleEmail : 'ยังไม่ได้เชื่อมต่อ'}
                  </span>
                </div>
              </div>
              <Button 
                size="sm" 
                variant={googleLinked ? 'ghost' : 'secondary'}
                onClick={googleLinked ? unlinkGoogle : linkGoogle}
                loading={checkingLinked}
              >
                {googleLinked ? 'ยกเลิกการเชื่อม' : 'เชื่อมต่อ'}
              </Button>
            </div>
          </div>
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
