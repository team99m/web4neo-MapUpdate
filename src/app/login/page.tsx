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
  const { user, login, demoLogin, lineLogin, loading: authLoading } = useAuth()
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

        {lineLogin && (
          <>
            <div className={styles.divider}>
              <span>--- หรือ ---</span>
            </div>

            <Button 
              type="button" 
              size="lg" 
              style={{ backgroundColor: '#06C755', color: 'white', width: '100%' }}
              onClick={async () => {
                setLoading(true)
                try {
                  await lineLogin()
                } catch (err) {
                  setError('LINE login failed')
                  setLoading(false)
                }
              }}
            >
              <span style={{ marginRight: '8px' }}>💬</span>
              เข้าสู่ระบบด้วย LINE
            </Button>
          </>
        )}

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
