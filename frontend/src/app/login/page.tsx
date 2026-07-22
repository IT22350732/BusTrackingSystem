'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './login.module.css';
import '../../components/ui/ui.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(email, password);
      localStorage.setItem('auth_token', response.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles['login-page']}>
      <div className={`${styles['login-card']} glass-card`} style={{ padding: 'var(--space-2xl)' }}>
        {/* Header */}
        <div className={styles['login-header']}>
          <div className={styles['login-logo']}>🚌</div>
          <h1>Operator Login</h1>
          <p>Sign in to manage your fleet</p>
        </div>

        {/* Login Form */}
        <form className={styles['login-form']} onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="admin@bustracker.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg ${styles['login-submit']}`}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Info */}
        <div className={styles['login-demo-info']}>
          <strong>Demo Credentials:</strong><br />
          Email: <code>admin@bustracker.lk</code><br />
          Password: <code>Admin@123</code>
        </div>

        {/* Footer */}
        <div className={styles['login-footer']}>
          <Link href="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
