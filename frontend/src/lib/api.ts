// ==========================================
// Bus Tracking System — API Client
// ==========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5044';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized session. Please log out and log in again to refresh your security token.');
        }
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (err: any) {
      if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch'))) {
        throw new Error(`Unable to connect to backend server at ${API_BASE_URL}. Please ensure the backend server is running.`);
      }
      throw err;
    }
  }

  // --- Auth ---
  async login(email: string, password: string) {
    return this.request<{ token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request<{ token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  // --- Vehicles ---
  async getVehicles() {
    return this.request<import('@/types').Vehicle[]>('/api/vehicles');
  }

  async getVehicle(id: number) {
    return this.request<import('@/types').Vehicle>(`/api/vehicles/${id}`);
  }

  async createVehicle(vehicle: import('@/types').VehicleFormData) {
    return this.request<import('@/types').Vehicle>('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  }

  async updateVehicle(id: number, vehicle: import('@/types').VehicleFormData) {
    return this.request<import('@/types').Vehicle>(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicle),
    });
  }

  async deleteVehicle(id: number) {
    return this.request<{ message: string }>(`/api/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Locations ---
  async getAllLocations() {
    return this.request<import('@/types').LocationData[]>('/api/location');
  }

  async getVehicleLocation(vehicleId: number) {
    return this.request<import('@/types').LocationData>(`/api/location/${vehicleId}`);
  }

  // --- Bookings ---
  async createBooking(booking: import('@/types').CreateBookingRequest) {
    return this.request<import('@/types').Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  async getMyBookings() {
    return this.request<import('@/types').Booking[]>('/api/bookings');
  }

  async validateTrackingAccess(vehicleId: number) {
    return this.request<import('@/types').TrackingAccessResult>(`/api/tracking/${vehicleId}/validate`);
  }
}

export const api = new ApiClient();

