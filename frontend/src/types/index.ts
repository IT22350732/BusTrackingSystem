// ==========================================
// Bus Tracking System — TypeScript Types
// ==========================================

// --- Vehicle ---
export type VehicleStatus = 'Active' | 'Inactive' | 'Maintenance';

export interface Vehicle {
  id: number;
  busNumber: string;
  routeName: string;
  gpsDeviceId: string;
  deviceModel?: string;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFormData {
  busNumber: string;
  routeName: string;
  gpsDeviceId: string;
  deviceModel?: string;
  status: VehicleStatus;
}

// --- Location ---
export interface LocationData {
  vehicleId: number;
  busNumber: string;
  routeName: string;
  latitude: number;
  longitude: number;
  speed: number;
  lastUpdate: string;
  isOnline: boolean;
  status: string;
}

// --- Auth ---
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  message: string;
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// --- API ---
export interface ApiError {
  error: string;
}
