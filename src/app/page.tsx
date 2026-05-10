'use client'

import Link from 'next/link'
import { useTranslation } from '@/core/i18n/useTranslation'
import { useAuth } from '@/core/auth/useAuth'
import { cn } from '@/core/utils/cn'
import styles from './page.module.css'

export default function LandingPage() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()

  return (
    <div className={styles.landing}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={cn(styles.badge, 'animate-fade-in')}>Modern Civic Solutions</div>
          <h1 className={cn(styles.heroTitle, 'animate-slide-up')}>
            Building a Smarter, <br />
            <span>More Connected City.</span>
          </h1>
          <p className={cn(styles.heroSubtitle, 'animate-slide-up')}>
            Web4neo is the next-generation civic platform designed to bridge the gap 
            between citizens and local infrastructure management.
          </p>
          
          <div className={styles.heroActions}>
            <Link href={user ? "/home" : "/register"} className={styles.primaryBtn}>
              {user ? "Go to Home" : "Get Started Now"}
            </Link>
            <Link href="/map" className={styles.secondaryBtn}>
              Explore Map
            </Link>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.floatingCard}>
            <div className={styles.floatingIcon}>📢</div>
            <div className={styles.floatingText}>
              <strong>32 New Issues</strong>
              <span>Reported today in your area</span>
            </div>
          </div>
          <div className={cn(styles.floatingCard, styles.cardTwo)}>
            <div className={styles.floatingIcon}>🚌</div>
            <div className={styles.floatingText}>
              <strong>Transit Alert</strong>
              <span>Line 45 - 5 min delay</span>
            </div>
          </div>
          <div className={styles.heroCircle} />
        </div>
      </section>

      {/* Features Grid */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Web4neo?</h2>
          <p className={styles.sectionDesc}>Everything you need to improve your city, all in one place.</p>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📢</div>
            <h3>Direct Reporting</h3>
            <p>Report infrastructure issues directly to city staff with photos and GPS locations.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🗺️</div>
            <h3>Real-time Map</h3>
            <p>Stay informed with a real-time cluster map of civic issues and improvements.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🚌</div>
            <h3>Smart Transit</h3>
            <p>Access real-time public transport information and nearby stop schedules.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💬</div>
            <h3>Community Hub</h3>
            <p>Engage with your neighbors and join discussions about local developments.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      {!user && !loading && (
        <section className={styles.cta}>
          <div className={styles.ctaContent}>
            <h2>Ready to make a difference?</h2>
            <p>Join thousands of citizens already improving their neighborhoods.</p>
            <div className={styles.ctaActions}>
              <Link href="/register" className={styles.primaryBtn}>Create Account</Link>
              <Link href="/login" className={styles.secondaryBtn}>Login</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
