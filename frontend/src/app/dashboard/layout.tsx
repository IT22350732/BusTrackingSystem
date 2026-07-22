'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './dashboard.module.css';
import '../../components/ui/ui.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    } else {
      setAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  if (!authenticated) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Checking authentication...</p>
      </div>
    );
  }

  const navLinks = [
    { href: '/dashboard', label: 'Live Map', icon: '🗺️' },
    { href: '/dashboard/vehicles', label: 'Vehicles', icon: '🚌' },
  ];

  return (
    <div className={styles['dashboard-layout']}>
      {/* Mobile menu button */}
      <button
        className={styles['mobile-menu-btn']}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar overlay (mobile) */}
      <div
        className={`${styles['sidebar-overlay']} ${sidebarOpen ? styles.open : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles['sidebar-header']}>
          <div className={styles['sidebar-logo']}>🚌</div>
          <div>
            <div className={styles['sidebar-title']}>BusTracker</div>
            <div className={styles['sidebar-subtitle']}>Operator Panel</div>
          </div>
        </div>

        <nav className={styles['sidebar-nav']}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles['sidebar-link']} ${
                pathname === link.href ? styles.active : ''
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles['link-icon']}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles['sidebar-footer']}>
          <div className={styles['sidebar-user']}>
            <div className={styles['sidebar-avatar']}>A</div>
            <div className={styles['sidebar-user-info']}>
              <div className={styles['sidebar-user-name']}>Admin Operator</div>
              <div className={styles['sidebar-user-role']}>Fleet Manager</div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles['dashboard-main']}>
        {children}
      </main>
    </div>
  );
}
