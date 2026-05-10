'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/core/auth/useAuth'
import { useTranslation } from '@/core/i18n/useTranslation'
import { Button } from '@/core/components/Button'
import { Spinner } from '@/core/components/Spinner'
import Link from 'next/link'
import styles from '../login/page.module.css'

export default function RegisterPage() {
  const { user, register, demoLogin, loading: authLoading } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const [username, setUsername] = useState('')
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
      await register(email, password, username)
      // The useEffect will handle the redirect once user state updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      setLoading(false)
    }
  }

  // Show nothing while checking initial auth
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
          <h1 className={styles.title}>{t('auth.register')}</h1>
          <p className={styles.subtitle}>Join your local community platform</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>{t('auth.username')}</label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              minLength={3}
              maxLength={30}
              placeholder="johndoe"
            />
          </div>

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
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <Button type="submit" loading={loading} size="lg" className={styles.submitBtn}>
            {t('auth.register')}
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
          {t('auth.have_account')}{' '}
          <Link href="/login" className={styles.switchLink}>
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
