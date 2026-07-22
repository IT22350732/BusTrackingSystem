'use client';

import { useState, useEffect } from 'react';
import DynamicMap from '@/components/Map/DynamicMap';
import { api } from '@/lib/api';
import { startConnection, onLocationUpdate, stopConnection } from '@/lib/signalr';
import { LocationData } from '@/types';
import styles from './page.module.css';

export default function DashboardPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

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
    const interval = setInterval(fetchLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  // SignalR real-time updates
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

  const onlineCount = locations.filter((l) => l.isOnline).length;
  const offlineCount = locations.filter((l) => !l.isOnline).length;

  return (
    <div className={styles['dashboard-page']}>
      {/* Page Header */}
      <div className={styles['page-header']}>
        <div>
          <h1>Live Fleet Map</h1>
          <p className={styles.subtitle}>Real-time GPS tracking of all vehicles</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={styles['stats-bar']}>
        <div className={`${styles['stat-card']} glass-card`}>
          <div className={`${styles['stat-icon']} ${styles.total}`}>🚌</div>
          <div className={styles['stat-info']}>
            <div className={styles['stat-value']}>{locations.length}</div>
            <div className={styles['stat-label']}>Total Vehicles</div>
          </div>
        </div>
        <div className={`${styles['stat-card']} glass-card`}>
          <div className={`${styles['stat-icon']} ${styles.online}`}>📡</div>
          <div className={styles['stat-info']}>
            <div className={styles['stat-value']} style={{ color: 'var(--color-online)' }}>
              {onlineCount}
            </div>
            <div className={styles['stat-label']}>Online</div>
          </div>
        </div>
        <div className={`${styles['stat-card']} glass-card`}>
          <div className={`${styles['stat-icon']} ${styles.offline}`}>⚠️</div>
          <div className={styles['stat-info']}>
            <div className={styles['stat-value']} style={{ color: 'var(--color-offline)' }}>
              {offlineCount}
            </div>
            <div className={styles['stat-label']}>Offline</div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className={styles['dashboard-map']}>
        <DynamicMap
          locations={locations}
          selectedVehicleId={selectedVehicleId}
          onMarkerClick={(loc) =>
            setSelectedVehicleId((prev) =>
              prev === loc.vehicleId ? null : loc.vehicleId
            )
          }
          height="100%"
        />
      </div>
    </div>
  );
}
