import Link from 'next/link';
import styles from './page.module.css';
import '../components/ui/ui.css';

export default function Home() {
  return (
    <div className={styles.landing}>
      {/* Navigation */}
      <nav className={styles['landing-nav']}>
        <div className={styles['landing-logo']}>
          <span className={styles['logo-icon']}>🚌</span>
          BusTracker
        </div>
        <div className={styles['landing-nav-links']}>
          <Link href="/track" className="btn btn-ghost">
            Track a Bus
          </Link>
          <Link href="/login" className="btn btn-primary btn-sm">
            Operator Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles['landing-hero']}>
        <div className={styles['hero-content']}>
          <div className={styles['hero-badge']}>
            <span className={styles['pulse-dot']} />
            Live Tracking Active
          </div>
          <h1 className={styles['hero-title']}>
            Know Where Your{' '}
            <span className={styles.highlight}>Bus Is</span>
            {' '}Right Now
          </h1>
          <p className={styles['hero-subtitle']}>
            Real-time GPS tracking for public transit. See live bus locations,
            routes, and arrival updates — all from your phone or desktop.
          </p>
          <div className={styles['hero-actions']}>
            <Link href="/track" className="btn btn-primary btn-lg">
              🗺️ Track a Bus Now
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">
              🔐 Operator Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles['landing-features']}>
        <div className={styles['features-grid']}>
          <div className={`${styles['feature-card']} glass-card`}>
            <div className={styles['feature-icon']}>📍</div>
            <h3>Live Location</h3>
            <p>
              See your bus moving on the map in real-time with updates every 5
              seconds. Never miss your bus again.
            </p>
          </div>
          <div className={`${styles['feature-card']} glass-card`}>
            <div className={styles['feature-icon']}>🛣️</div>
            <h3>Route Information</h3>
            <p>
              View route details, bus numbers, and current status. Select any
              bus to track it on the interactive map.
            </p>
          </div>
          <div className={`${styles['feature-card']} glass-card`}>
            <div className={styles['feature-icon']}>📊</div>
            <h3>Fleet Dashboard</h3>
            <p>
              Operators can manage vehicles, monitor fleet status, and view all
              buses on a single dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles['landing-footer']}>
        <p>© 2024 Bus Tracking System — Sample Demo Application</p>
      </footer>
    </div>
  );
}
