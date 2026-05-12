'use client'

import { useState } from 'react'
import { supabase } from '@/core/supabase/client'
import styles from './page.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        username: data.user.email?.split('@')[0] ?? 'user',
        display_name: data.user.email?.split('@')[0] ?? 'User',
        role: 'citizen'
      }, { onConflict: 'id' })

      window.location.href = '/map'
    }
  }

  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://web4neo-map-update.vercel.app/auth/callback'
      }
    })

    if (error) {
      setError(error.message)
      return
    }

    if (data.url) {
      window.location.href = data.url
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setError('')
    const randomId = crypto.randomUUID().split('-')[0]
    const demoEmail = `demo-${randomId}@web4neo.local`
    const demoPassword = crypto.randomUUID()

    const { error } = await supabase.auth.signUp({
      email: demoEmail,
      password: demoPassword,
      options: { data: { username: `DemoUser_${randomId}` } }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/map'
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

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleEmailLogin}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
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
            <label htmlFor="password" className={styles.label}>Password</label>
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

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'Sign In'}
          </button>

          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogleLogin}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>เข้าสู่ระบบด้วย Google</span>
          </button>
        </form>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <button
          type="button"
          className={styles.demoBtn}
          disabled={loading}
          onClick={handleDemoLogin}
        >
          Try Demo Version
        </button>

        <p className={styles.switchText}>
          Don&apos;t have an account?{' '}
          <a href="/register" className={styles.switchLink}>Register</a>
        </p>
      </div>
    </div>
  )
}
