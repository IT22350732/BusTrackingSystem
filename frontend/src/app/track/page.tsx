'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DynamicMap from '@/components/Map/DynamicMap';
import { api } from '@/lib/api';
import { startConnection, onLocationUpdate, stopConnection } from '@/lib/signalr';
import { LocationData, Vehicle, TrackingAccessResult } from '@/types';
import styles from './track.module.css';
import '../../components/ui/ui.css';

function TrackContent() {
  const searchParams = useSearchParams();
  const busIdParam = searchParams.get('busId');

  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form states for login/register inline
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');

  // Bus & Tracking states
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    busIdParam ? parseInt(busIdParam, 10) : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);

  // Validation State
  const [validating, setValidating] = useState(false);
  const [accessResult, setAccessResult] = useState<TrackingAccessResult | null>(null);

  // Inline Booking Form
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState('08:00');
  const [arrivalTime, setArrivalTime] = useState('12:00');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<{ error?: string; success?: string }>({});

  // 1. Check Auth on mount
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    setToken(stored);
    setAuthLoading(false);
  }, []);

  // 2. Fetch all available buses if logged in
  useEffect(() => {
    if (!token) return;

    const loadVehicles = async () => {
      try {
        const list = await api.getVehicles();
        setVehicles(list);
        if (!selectedVehicleId && list.length > 0) {
          setSelectedVehicleId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load buses:', err);
      }
    };

    loadVehicles();
  }, [token]);

  // 3. Validate tracking access when selectedVehicleId or token changes
  const validateAccess = useCallback(async (vehicleId: number) => {
    if (!token) return;
    setValidating(true);
    try {
      const res = await api.validateTrackingAccess(vehicleId);
      setAccessResult(res);
    } catch (err) {
      setAccessResult({
        allowed: false,
        message: err instanceof Error ? err.message : 'Failed to validate tracking permission.',
      });
    } finally {
      setValidating(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedVehicleId && token) {
      validateAccess(selectedVehicleId);
    }
  }, [selectedVehicleId, token, validateAccess]);

  // 4. Fetch locations & SignalR subscription only if allowed
  useEffect(() => {
    if (!token || !accessResult?.allowed || !selectedVehicleId) {
      setLocations([]);
      return;
    }

    const fetchLocation = async () => {
      try {
        const loc = await api.getVehicleLocation(selectedVehicleId);
        if (loc) {
          setLocations([loc]);
        }
      } catch (err) {
        console.error('Failed to fetch vehicle location:', err);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 10000);

    // Connect to SignalR
    let cleanup: (() => void) | undefined;
    const connectSignalR = async () => {
      try {
        const conn = await startConnection();
        await conn.invoke('SubscribeToVehicle', selectedVehicleId).catch((err: Error) => {
          console.warn('Subscription error:', err.message);
        });

        cleanup = onLocationUpdate((update: LocationData) => {
          if (update.vehicleId === selectedVehicleId) {
            setLocations([update]);
          }
        });
      } catch (err) {
        console.error('SignalR error:', err);
      }
    };

    connectSignalR();

    return () => {
      clearInterval(interval);
      cleanup?.();
      stopConnection();
    };
  }, [selectedVehicleId, accessResult?.allowed, token]);

  // Handle Login/Register
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        const res = await api.login(email, password);
        localStorage.setItem('auth_token', res.token);
        setToken(res.token);
      } else {
        const res = await api.register(name, email, password);
        localStorage.setItem('auth_token', res.token);
        setToken(res.token);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    }
  };

  // Handle Inline Booking
  const handleInlineBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return;
    setBookingMsg({});
    setBookingSubmitting(true);

    try {
      await api.createBooking({
        vehicleId: selectedVehicleId,
        travelDate,
        departureTime,
        arrivalTime,
      });

      setBookingMsg({ success: 'Ticket booked successfully!' });
      setShowBookingForm(false);
      // Re-validate tracking access
      validateAccess(selectedVehicleId);
    } catch (err) {
      setBookingMsg({ error: err instanceof Error ? err.message : 'Booking failed' });
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleBusSelect = (id: number) => {
    setSelectedVehicleId(id);
    setShowBookingForm(false);
    setBookingMsg({});
  };

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.routeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading tracking system...</p>
      </div>
    );
  }

  // REQUIRE LOGIN VIEW
  if (!token) {
    return (
      <div className={styles['track-page']}>
        <header className={styles['track-header']}>
          <Link href="/" className={styles['track-logo']}>
            <span className={styles['logo-icon']}>🚌</span>
            BusTracker
          </Link>
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <Link href="/login" className="btn btn-secondary btn-sm">
              Operator Login
            </Link>
          </div>
        </header>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 'var(--space-xl)' }}>
          <div className="glass-card" style={{ maxWidth: 450, width: '100%', padding: 'var(--space-2xl)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>🔐</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Authentication Required</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Please log in or register to access ticket-restricted bus tracking.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              <button
                className={`btn ${authMode === 'login' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1 }}
                onClick={() => setAuthMode('login')}
              >
                Sign In
              </button>
              <button
                className={`btn ${authMode === 'register' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1 }}
                onClick={() => setAuthMode('register')}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {authError && <div className="alert alert-error">⚠️ {authError}</div>}

              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="regName">Full Name</label>
                  <input
                    id="regName"
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="authEmail">Email</label>
                <input
                  id="authEmail"
                  type="email"
                  className="form-input"
                  placeholder="rider@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="authPassword">Password</label>
                <input
                  id="authPassword"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-sm)' }}>
                {authMode === 'login' ? 'Sign In & Track' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // MAIN LOGGED-IN TRACKING VIEW
  return (
    <div className={styles['track-page']}>
      {/* Header */}
      <header className={styles['track-header']}>
        <Link href="/" className={styles['track-logo']}>
          <span className={styles['logo-icon']}>🚌</span>
          BusTracker
        </Link>

        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <Link href="/book" className="btn btn-primary btn-sm">
            🎟️ Book Tickets
          </Link>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              localStorage.removeItem('auth_token');
              setToken(null);
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Body */}
      <div className={styles['track-body']}>
        {/* Map / Restricted Message Container */}
        <div className={styles['track-map']}>
          {validating ? (
            <div className="loading-screen">
              <div className="spinner" />
              <p>Validating ticket & tracking authorization...</p>
            </div>
          ) : accessResult?.allowed ? (
            /* MAP IS RENDERED ONLY WHEN ACCESS IS GRANTED */
            <DynamicMap
              locations={locations}
              selectedVehicleId={selectedVehicleId}
              height="100%"
            />
          ) : (
            /* MAP IS HIDDEN WHEN DENIED */
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'var(--space-xl)', background: 'var(--color-bg-primary)' }}>
              <div className="glass-card" style={{ maxWidth: 500, width: '100%', padding: 'var(--space-2xl)', textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-md)' }}>
                  {accessResult?.message.includes('completed')
                    ? '🏁'
                    : accessResult?.message.includes('available on your travel date')
                    ? '📅'
                    : '🚫'}
                </div>

                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                  Tracking Restricted
                </h2>

                <div
                  className="alert alert-error"
                  style={{ justifyContent: 'center', marginBottom: 'var(--space-xl)', fontSize: '0.95rem', fontWeight: 500 }}
                >
                  {accessResult?.message || 'Access to live tracking is restricted.'}
                </div>

                {selectedVehicle && (
                  <div style={{ background: 'var(--color-bg-tertiary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)', textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>🚌 Bus: {selectedVehicle.busNumber}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{selectedVehicle.routeName}</div>
                  </div>
                )}

                {showBookingForm ? (
                  <form onSubmit={handleInlineBooking} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Book a Ticket for this Bus</h3>
                    
                    {bookingMsg.error && <div className="alert alert-error">⚠️ {bookingMsg.error}</div>}
                    
                    <div className="form-group">
                      <label className="form-label">Travel Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                      <div className="form-group">
                        <label className="form-label">Departure Time</label>
                        <input
                          type="time"
                          className="form-input"
                          value={departureTime}
                          onChange={(e) => setDepartureTime(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Arrival Time</label>
                        <input
                          type="time"
                          className="form-input"
                          value={arrivalTime}
                          onChange={(e) => setArrivalTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                      <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowBookingForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={bookingSubmitting}>
                        {bookingSubmitting ? 'Booking...' : 'Book Ticket'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={() => setShowBookingForm(true)}>
                      🎟️ Book Ticket Now
                    </button>
                    <Link href="/book" className="btn btn-secondary">
                      View My Bookings
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bus Selector Sidebar Panel */}
        {panelOpen && (
          <div className={`${styles['bus-panel']} glass-card`}>
            <div className={styles['bus-panel-header']}>
              <h2>🚌 Select Bus to Track</h2>
              <input
                type="text"
                className={styles['bus-search']}
                placeholder="Search bus number or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles['bus-panel-list']}>
              {filteredVehicles.length === 0 ? (
                <div className={styles['bus-empty']}>
                  {searchQuery ? 'No matching buses found' : 'Loading buses...'}
                </div>
              ) : (
                filteredVehicles.map((v) => (
                  <div
                    key={v.id}
                    className={`${styles['bus-item']} ${
                      selectedVehicleId === v.id ? styles.selected : ''
                    }`}
                    onClick={() => handleBusSelect(v.id)}
                  >
                    <div className={`${styles['bus-item-icon']} ${styles.online}`}>
                      🚌
                    </div>
                    <div className={styles['bus-item-info']}>
                      <div className={styles['bus-number']}>{v.busNumber}</div>
                      <div className={styles['bus-route']}>{v.routeName}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Mobile panel toggle */}
        <button
          className={styles['panel-toggle']}
          onClick={() => setPanelOpen(!panelOpen)}
          aria-label="Toggle bus list"
        >
          {panelOpen ? '✕' : '☰'}
        </button>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading tracking page...</p>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
