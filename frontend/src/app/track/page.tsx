'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DynamicMap from '@/components/Map/DynamicMap';
import { api } from '@/lib/api';
import { startConnection, onLocationUpdate, stopConnection } from '@/lib/signalr';
import { LocationData } from '@/types';
import styles from './track.module.css';
import '../../components/ui/ui.css';

export default function TrackPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);

  // Fetch initial locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await api.getAllLocations();
        setLocations(data);
      } catch (err) {
        console.error('Failed to fetch locations:', err);
      }
    };

    fetchLocations();

    // Also poll every 10 seconds as fallback
    const interval = setInterval(fetchLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Connect to SignalR for real-time updates
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const connect = async () => {
      try {
        await startConnection();
        cleanup = onLocationUpdate((update: LocationData) => {
          setLocations((prev) => {
            const idx = prev.findIndex((l) => l.vehicleId === update.vehicleId);
            if (idx >= 0) {
              const newLocations = [...prev];
              newLocations[idx] = update;
              return newLocations;
            }
            return [...prev, update];
          });
        });
      } catch (err) {
        console.error('SignalR connection failed:', err);
      }
    };

    connect();

    return () => {
      cleanup?.();
      stopConnection();
    };
  }, []);

  // Filter buses by search
  const filteredLocations = locations.filter(
    (loc) =>
      loc.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.routeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineCount = locations.filter((l) => l.isOnline).length;
  const offlineCount = locations.filter((l) => !l.isOnline).length;

  const handleBusSelect = useCallback((vehicleId: number) => {
    setSelectedVehicleId((prev) => (prev === vehicleId ? null : vehicleId));
  }, []);

  return (
    <div className={styles['track-page']}>
      {/* Header */}
      <header className={styles['track-header']}>
        <Link href="/" className={styles['track-logo']}>
          <span className={styles['logo-icon']}>🚌</span>
          BusTracker
        </Link>
        <div className={styles['track-stats']}>
          <div className={styles['track-stat']}>
            <span className="status-badge online" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
              <span className="dot" />
              Online
            </span>
            <span className="count">{onlineCount}</span>
          </div>
          <div className={styles['track-stat']}>
            <span className="status-badge offline" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
              <span className="dot" />
              Offline
            </span>
            <span className="count">{offlineCount}</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className={styles['track-body']}>
        {/* Map */}
        <div className={styles['track-map']}>
          <DynamicMap
            locations={locations}
            selectedVehicleId={selectedVehicleId}
            onMarkerClick={(loc) => handleBusSelect(loc.vehicleId)}
            height="100%"
          />
        </div>

        {/* Bus Selector Panel */}
        {panelOpen && (
          <div className={`${styles['bus-panel']} glass-card`}>
            <div className={styles['bus-panel-header']}>
              <h2>🚌 Select a Bus</h2>
              <input
                type="text"
                className={styles['bus-search']}
                placeholder="Search by bus number or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles['bus-panel-list']}>
              {filteredLocations.length === 0 ? (
                <div className={styles['bus-empty']}>
                  {searchQuery ? 'No buses match your search' : 'Waiting for bus data...'}
                </div>
              ) : (
                filteredLocations.map((loc) => (
                  <div
                    key={loc.vehicleId}
                    className={`${styles['bus-item']} ${
                      selectedVehicleId === loc.vehicleId ? styles.selected : ''
                    }`}
                    onClick={() => handleBusSelect(loc.vehicleId)}
                  >
                    <div
                      className={`${styles['bus-item-icon']} ${
                        loc.isOnline ? styles.online : styles.offline
                      }`}
                    >
                      🚌
                    </div>
                    <div className={styles['bus-item-info']}>
                      <div className={styles['bus-number']}>{loc.busNumber}</div>
                      <div className={styles['bus-route']}>{loc.routeName}</div>
                    </div>
                    <div className={styles['bus-item-status']}>
                      <span
                        className={`status-badge ${loc.isOnline ? 'online' : 'offline'}`}
                        style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}
                      >
                        <span className="dot" />
                        {loc.isOnline ? 'Live' : 'Off'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Mobile toggle */}
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
