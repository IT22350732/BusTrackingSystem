'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Vehicle, Booking } from '@/types';
import styles from './book.module.css';
import '../../components/ui/ui.css';

export default function BookTicketPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
  const [travelDate, setTravelDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [departureTime, setDepartureTime] = useState<string>('08:00');
  const [arrivalTime, setArrivalTime] = useState<string>('12:00');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      router.push('/login?redirect=/book');
      return;
    }

    const fetchData = async () => {
      try {
        const [vList, bList] = await Promise.all([
          api.getVehicles(),
          api.getMyBookings().catch(() => []),
        ]);
        setVehicles(vList.filter((v) => v.status === 'Active'));
        setMyBookings(bList);
        if (vList.length > 0) {
          setSelectedVehicleId(vList[0].id);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data from server');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return;
    
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const newBooking = await api.createBooking({
        vehicleId: Number(selectedVehicleId),
        travelDate,
        departureTime,
        arrivalTime,
      });

      setSuccess(`Ticket successfully booked for Bus ${newBooking.busNumber} on ${newBooking.travelDate}!`);
      setMyBookings((prev) => [newBooking, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading booking dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles['book-page']}>
      {/* Header */}
      <header className={styles['book-header']}>
        <Link href="/" className={styles['book-logo']}>
          <span className={styles['logo-icon']}>🎟️</span>
          BusTracker Bookings
        </Link>
        <div className={styles['book-nav-links']}>
          <Link href="/track" className="btn btn-secondary btn-sm">
            🗺️ Track a Bus
          </Link>
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            Dashboard
          </Link>
        </div>
      </header>

      <div className={styles['book-container']}>
        <div className={styles['book-grid']}>
          {/* Booking Form Card */}
          <div className={`${styles['book-card']} glass-card`}>
            <h2>🎫 Book a Bus Ticket</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)', fontSize: '0.9rem' }}>
              Select your bus route and travel date to reserve tracking access for your trip.
            </p>

            <form onSubmit={handleSubmit} className={styles['book-form']}>
              {error && <div className="alert alert-error">⚠️ {error}</div>}
              {success && <div className="alert alert-success">✅ {success}</div>}

              <div className="form-group">
                <label className="form-label" htmlFor="vehicleSelect">Select Bus / Route</label>
                <select
                  id="vehicleSelect"
                  className="form-select"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                  required
                >
                  <option value="" disabled>-- Choose a Bus --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.busNumber} — {v.routeName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="travelDate">Travel Date</label>
                <input
                  id="travelDate"
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
                  <label className="form-label" htmlFor="departureTime">Departure Time</label>
                  <input
                    id="departureTime"
                    type="time"
                    className="form-input"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="arrivalTime">Arrival Time</label>
                  <input
                    id="arrivalTime"
                    type="time"
                    className="form-input"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting}
                style={{ marginTop: 'var(--space-md)' }}
              >
                {submitting ? 'Booking Ticket...' : 'Confirm & Book Ticket'}
              </button>
            </form>
          </div>

          {/* User's Bookings List */}
          <div className={`${styles['book-card']} glass-card`}>
            <h2>📋 Your Bookings</h2>
            {myBookings.length === 0 ? (
              <div className={styles['empty-bookings']}>
                <p>You have no active bookings yet.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Book a ticket using the form to unlock real-time tracking on your travel date.</p>
              </div>
            ) : (
              <div>
                {myBookings.map((b) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isToday = b.travelDate === todayStr;
                  return (
                    <div key={b.id} className={styles['booking-item']}>
                      <div className={styles['booking-item-header']}>
                        <span className={styles['booking-bus']}>🚌 {b.busNumber}</span>
                        <span
                          className={`status-badge ${isToday ? 'online' : 'inactive'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {isToday ? 'Active Today' : b.travelDate}
                        </span>
                      </div>
                      <div className={styles['booking-route']}>{b.routeName}</div>
                      <div className={styles['booking-details']}>
                        <span>📅 Date: {b.travelDate}</span>
                        <span>🕒 {b.departureTime} - {b.arrivalTime}</span>
                      </div>
                      <div className={styles['booking-actions']}>
                        <Link
                          href={`/track?busId=${b.vehicleId}`}
                          className={`btn ${isToday ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        >
                          🗺️ Track Bus
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
