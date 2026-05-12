'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/core/auth/useAuth'
import { useTranslation } from '@/core/i18n/useTranslation'
import { Button } from '@/core/components/Button'
import { Spinner } from '@/core/components/Spinner'
import Link from 'next/link'
import styles from './page.module.css'

export default function LoginPage() {
  const { user, login, googleLogin, demoLogin, loading: authLoading } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === 'admin' || user.role === 'staff') {
        router.replace('/dashboard')
      } else {
        router.replace('/home')
      }
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // The useEffect will handle the redirect once user state updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  // Show nothing while checking initial auth to prevent flash of login form
  if (authLoading || user) {
    return (
      <div className={styles.authWrapper}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authBackground}></div>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <span className={styles.brandLogo}>🏙️</span>
          <h1 className={styles.title}>Web4neo</h1>
          <p className={styles.subtitle}>Welcome back to your civic platform</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={6}
            />
          </div>

          <Button type="submit" loading={loading} size="lg" className={styles.submitBtn}>
            {t('auth.login')}
          </Button>

          <Button 
            type="button" 
            variant="secondary" 
            size="lg" 
            className={styles.googleBtn}
            onClick={() => googleLogin()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>เข้าสู่ระบบด้วย Google</span>
          </Button>
        </form>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <Button 
          type="button" 
          variant="secondary" 
          size="lg" 
          className={styles.demoBtn}
          loading={loading}
          onClick={async () => {
            setLoading(true)
            try {
              await demoLogin()
            } catch (err) {
              setError('Demo login failed')
              setLoading(false)
            }
          }}
        >
          Try Demo Version
        </Button>

        <p className={styles.switchText}>
          {t('auth.no_account')}{' '}
          <Link href="/register" className={styles.switchLink}>
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
