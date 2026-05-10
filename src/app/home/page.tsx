'use client'

import Link from 'next/link'
import { useTranslation } from '@/core/i18n/useTranslation'
import { useAuth } from '@/core/auth/useAuth'
import { cn } from '@/core/utils/cn'
import styles from './page.module.css'

/**
 * Home Page — main dashboard for the user.
 */
export default function HomePage() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()

  return (
    <div className="page-container">
      {/* Personalized Greeting */}
      <header className={styles.header}>
        <div className={styles.greeting}>
          <h1 className={styles.title}>
            {loading ? 'Hello!' : `Hi, ${user?.display_name || user?.username || 'Citizen'}!`}
          </h1>
          <p className={styles.subtitle}>Explore your city and report issues today.</p>
        </div>
      </header>

      {/* Quick Action Grid */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>City Services</h2>
        <div className={styles.grid}>
          <Link href="/map" className={cn(styles.card, styles.mapCard)}>
            <div className={styles.cardOverlay} />
            <span className={styles.cardIcon}>🗺️</span>
            <div className={styles.cardContent}>
              <span className={styles.cardTitle}>{t('nav.map')}</span>
              <span className={styles.cardDesc}>Nearby reports</span>
            </div>
          </Link>

          <Link href="/report" className={cn(styles.card, styles.reportCard)}>
            <div className={styles.cardOverlay} />
            <span className={styles.cardIcon}>📢</span>
            <div className={styles.cardContent}>
              <span className={styles.cardTitle}>{t('nav.report')}</span>
              <span className={styles.cardDesc}>New issue</span>
            </div>
          </Link>

          <Link href="/feed" className={cn(styles.card, styles.feedCard)}>
            <div className={styles.cardOverlay} />
            <span className={styles.cardIcon}>💬</span>
            <div className={styles.cardContent}>
              <span className={styles.cardTitle}>{t('nav.feed')}</span>
              <span className={styles.cardDesc}>Community feed</span>
            </div>
          </Link>

          <Link href="/transit" className={cn(styles.card, styles.transitCard)}>
            <div className={styles.cardOverlay} />
            <span className={styles.cardIcon}>🚌</span>
            <div className={styles.cardContent}>
              <span className={styles.cardTitle}>{t('nav.transit')}</span>
              <span className={styles.cardDesc}>Live schedules</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Community Update Section */}
      <section className={styles.section}>
        <div className={styles.updateCard}>
          <div className={styles.updateIcon}>🌟</div>
          <div className={styles.updateText}>
            <h3>Neighborhood Spotlight</h3>
            <p>Join the town hall discussion on new bike lanes in your area.</p>
          </div>
          <Link href="/feed" className={styles.updateLink}>View</Link>
        </div>
      </section>
    </div>
  )
}
