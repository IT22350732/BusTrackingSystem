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
          <Link href="/book" className="btn btn-ghost">
            🎟️ Book Ticket
          </Link>
          <Link href="/track" className="btn btn-ghost">
            🗺️ Track Bus
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
            Ticket-Based Real-Time Tracking
          </div>
          <h1 className={styles['hero-title']}>
            Know Where Your{' '}
            <span className={styles.highlight}>Bus Is</span>
            {' '}Right Now
          </h1>
          <p className={styles['hero-subtitle']}>
            Book a bus ticket and access live GPS tracking on your travel date. Real-time updates, route details, and instant bus locations.
          </p>
          <div className={styles['hero-actions']}>
            <Link href="/book" className="btn btn-primary btn-lg">
              🎟️ Book a Ticket
            </Link>
            <Link href="/track" className="btn btn-secondary btn-lg">
              🗺️ Track My Bus
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles['landing-features']}>
        <div className={styles['features-grid']}>
          <div className={`${styles['feature-card']} glass-card`}>
            <div className={styles['feature-icon']}>🎟️</div>
            <h3>Ticket Restricted</h3>
            <p>
              Secure live tracking restricted strictly to riders with a valid booking for today's travel date.
            </p>
          </div>
          <div className={`${styles['feature-card']} glass-card`}>
            <div className={styles['feature-icon']}>📍</div>
            <h3>Live Location</h3>
            <p>
              See your bus moving on the interactive Leaflet map in real-time with automatic 5-second SignalR updates.
            </p>
          </div>
          <div className={`${styles['feature-card']} glass-card`}>
            <div className={styles['feature-icon']}>📊</div>
            <h3>Fleet Dashboard</h3>
            <p>
              Operators can manage vehicles, monitor live fleet status, and track active buses across Sri Lanka.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles['landing-footer']}>
        <p>© 2024 Bus Tracking System — Ticket-Based Fleet Monitoring</p>
      </footer>
    </div>
  );
}
