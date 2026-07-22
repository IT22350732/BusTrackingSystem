'use client';

import dynamic from 'next/dynamic';
import { LocationData } from '@/types';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      background: 'var(--color-bg-primary)',
      borderRadius: 'var(--radius-lg)',
      color: 'var(--color-text-secondary)',
      gap: '0.75rem',
    }}>
      <span className="spinner" />
      Loading map...
    </div>
  ),
});

interface DynamicMapProps {
  locations: LocationData[];
  selectedVehicleId?: number | null;
  onMarkerClick?: (location: LocationData) => void;
  height?: string;
}

export default function DynamicMap(props: DynamicMapProps) {
  return <MapView {...props} />;
}
