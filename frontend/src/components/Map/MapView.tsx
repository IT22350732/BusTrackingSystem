'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import { LocationData } from '@/types';

interface MapViewProps {
  locations: LocationData[];
  selectedVehicleId?: number | null;
  onMarkerClick?: (location: LocationData) => void;
  height?: string;
}

// Create custom bus icon
function createBusIcon(isOnline: boolean, status: string): L.DivIcon {
  const statusClass = status === 'Maintenance' ? 'maintenance' : isOnline ? 'online' : 'offline';

  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div class="bus-icon-wrapper ${statusClass}">
        🚌
        <div class="marker-pulse"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// Format timestamp for display
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function MapView({ locations, selectedVehicleId, onMarkerClick, height = '100%' }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [7.8731, 80.7718], // Sri Lanka center
      zoom: 8,
      zoomControl: true,
      attributionControl: true,
    });

    // Dark map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Update markers when locations change
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;

    locations.forEach((loc) => {
      const existingMarker = currentMarkers.get(loc.vehicleId);
      const icon = createBusIcon(loc.isOnline, loc.status);

      const popupContent = `
        <div class="bus-popup">
          <h3>${loc.busNumber}</h3>
          <div class="route">${loc.routeName}</div>
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="${loc.isOnline ? 'status-online' : 'status-offline'}">
                ${loc.isOnline ? '● Online' : '● Offline'}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Speed</span>
              <span class="detail-value">${loc.speed.toFixed(1)} km/h</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Last Update</span>
              <span class="detail-value">${formatTime(loc.lastUpdate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Position</span>
              <span class="detail-value">${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}</span>
            </div>
          </div>
        </div>
      `;

      if (existingMarker) {
        // Update existing marker position smoothly
        existingMarker.setLatLng([loc.latitude, loc.longitude]);
        existingMarker.setIcon(icon);
        existingMarker.getPopup()?.setContent(popupContent);
      } else {
        // Create new marker
        const marker = L.marker([loc.latitude, loc.longitude], { icon })
          .addTo(map)
          .bindPopup(popupContent, {
            maxWidth: 250,
            className: 'bus-marker-popup',
          });

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(loc));
        }

        currentMarkers.set(loc.vehicleId, marker);
      }
    });

    // Remove markers for vehicles no longer in the list
    currentMarkers.forEach((marker, vehicleId) => {
      if (!locations.find((l) => l.vehicleId === vehicleId)) {
        marker.remove();
        currentMarkers.delete(vehicleId);
      }
    });
  }, [locations, onMarkerClick]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Center on selected vehicle
  useEffect(() => {
    if (!selectedVehicleId || !mapRef.current) return;

    const loc = locations.find((l) => l.vehicleId === selectedVehicleId);
    if (loc) {
      mapRef.current.flyTo([loc.latitude, loc.longitude], 13, {
        duration: 1.5,
      });

      // Open popup for selected marker
      const marker = markersRef.current.get(selectedVehicleId);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedVehicleId, locations]);

  return (
    <div className="map-wrapper" style={{ height }}>
      <div ref={containerRef} className="map-container" />
    </div>
  );
}
