# Bus Tracking System — System Documentation

## 1. System Overview

The Bus Tracking System is a full-stack web application that enables:
- **Operators** to manage a fleet of buses and monitor their real-time GPS locations
- **Riders** (public users) to track any bus on an interactive map without authentication
- **GPS Devices** to push location telemetry via REST API

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                     │
│                    Port: 3000                             │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐            │
│  │ Landing  │  │  Rider   │  │  Operator  │            │
│  │  Page    │  │ Tracking │  │ Dashboard  │            │
│  │   (/)    │  │ (/track) │  │(/dashboard)│            │
│  └──────────┘  └──────────┘  └────────────┘            │
│        │              │              │                   │
│        └──────────────┴──────────────┘                   │
│                       │                                  │
│              ┌────────┴────────┐                         │
│              │  API Client     │                         │
│              │  SignalR Client │                         │
│              └────────┬────────┘                         │
└───────────────────────┼──────────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────┼──────────────────────────────────┐
│                    BACKEND (.NET 8)                       │
│                    Port: 5044                             │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐      │
│  │ Auth API   │  │Vehicle API │  │ Location API │      │
│  │ (JWT)      │  │ (CRUD)     │  │ (GPS Data)   │      │
│  └────────────┘  └────────────┘  └──────────────┘      │
│                                         │                │
│  ┌──────────────┐  ┌────────────────────┴─────┐        │
│  │  GPS         │  │  SignalR Hub              │        │
│  │  Simulator   │  │  (Real-time broadcast)    │        │
│  └──────────────┘  └─────────────────────────┘        │
│                           │                              │
│              ┌────────────┴────────────┐                │
│              │  SQLite Database        │                │
│              │  (bustracking.db)       │                │
│              └─────────────────────────┘                │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | Next.js (App Router) | 15.x |
| Frontend Language | TypeScript | 5.x |
| Styling | Vanilla CSS (Custom Properties) | CSS3 |
| Maps | Leaflet.js | 1.9.x |
| Map Tiles | CartoDB Dark (OpenStreetMap) | — |
| Backend | .NET Minimal API | 8.0 |
| Database | SQLite via EF Core | 8.0.x |
| Authentication | JWT Bearer Tokens | — |
| Real-time | SignalR (WebSocket) | — |
| Password Hashing | BCrypt | 4.x |

---

## 3. Database Schema

### Users Table
| Column | Type | Constraints |
|--------|------|-------------|
| Id | INTEGER | PK, Auto-increment |
| Name | TEXT(100) | NOT NULL |
| Email | TEXT(200) | NOT NULL, UNIQUE |
| PasswordHash | TEXT | NOT NULL |
| CreatedAt | DATETIME | NOT NULL |

### Vehicles Table
| Column | Type | Constraints |
|--------|------|-------------|
| Id | INTEGER | PK, Auto-increment |
| BusNumber | TEXT(50) | NOT NULL, UNIQUE |
| RouteName | TEXT(200) | NOT NULL |
| GpsDeviceId | TEXT(100) | NOT NULL, UNIQUE |
| DeviceModel | TEXT(100) | NULLABLE |
| Status | TEXT | NOT NULL (Active/Inactive/Maintenance) |
| CreatedAt | DATETIME | NOT NULL |
| UpdatedAt | DATETIME | NOT NULL |

### LocationUpdates Table
| Column | Type | Constraints |
|--------|------|-------------|
| Id | INTEGER | PK, Auto-increment |
| VehicleId | INTEGER | FK → Vehicles.Id |
| Latitude | REAL | NOT NULL |
| Longitude | REAL | NOT NULL |
| Speed | REAL | — |
| DeviceTimestamp | DATETIME | — |
| ServerTimestamp | DATETIME | NOT NULL |
| IsOnline | BOOLEAN | NOT NULL |

---

## 4. API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login with email/password, returns JWT |

**Request Body:**
```json
{
  "email": "admin@bustracker.lk",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Login successful"
}
```

### Vehicles
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/vehicles` | No | List all vehicles |
| GET | `/api/vehicles/{id}` | No | Get single vehicle |
| POST | `/api/vehicles` | Yes | Create new vehicle |
| PUT | `/api/vehicles/{id}` | Yes | Update vehicle |
| DELETE | `/api/vehicles/{id}` | Yes | Deactivate vehicle (soft delete) |

### Location
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/location` | No | Submit GPS update (from device) |
| GET | `/api/location` | No | Get all latest locations |
| GET | `/api/location/{vehicleId}` | No | Get location for specific vehicle |

**GPS Update Request Body:**
```json
{
  "deviceId": "TRK-001-SIM",
  "latitude": 7.2906,
  "longitude": 80.6337,
  "speed": 45.5,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### SignalR Hub
| Hub URL | `/hubs/location` |
|---------|-------------------|
| Event: `ReceiveLocationUpdate` | Broadcasts real-time location data to all connected clients |
| Method: `SubscribeToVehicle(vehicleId)` | Subscribe to specific vehicle updates |
| Method: `UnsubscribeFromVehicle(vehicleId)` | Unsubscribe from vehicle updates |

---

## 5. Seed Data

### Default Admin User
| Field | Value |
|-------|-------|
| Name | Admin Operator |
| Email | admin@bustracker.lk |
| Password | Admin@123 |

### Sample Vehicles
| Bus Number | Route | Device ID | Status |
|-----------|-------|-----------|--------|
| NB-2547 | Colombo – Kandy (Route 1) | TRK-001-SIM | Active |
| NC-3891 | Colombo – Galle (Route 2) | TRK-002-SIM | Active |
| NW-1234 | Kandy – Nuwara Eliya (Route 3) | TRK-003-SIM | Active |
| SP-4567 | Colombo – Jaffna (Route 4) | TRK-004-SIM | Active |
| EP-7890 | Colombo – Batticaloa (Route 5) | TRK-005-SIM | Maintenance |

---

## 6. GPS Simulator

A built-in background service (`SimulatorService`) simulates GPS devices by:
- Moving 4 active buses along predefined waypoints on real Sri Lankan routes
- Sending location updates every **5 seconds**
- Bouncing buses back and forth between route endpoints
- Adding realistic speed variation (30–80 km/h) and position jitter
- Auto-starting when the backend server launches

The 5th bus (EP-7890) is set to "Maintenance" status and will not receive simulated updates.

---

## 7. User Storylines (Agile User Stories)

### Epic 1: Authentication & Access Control

#### US-1: Operator Login
> **As an** operator, **I want to** log in with my email and password **so that** I can access the fleet management dashboard.

**Acceptance Criteria:**
- [ ] Login page with email and password fields
- [ ] Form validation (required fields, email format)
- [ ] On success: JWT token stored, redirect to `/dashboard`
- [ ] On failure: Error message displayed
- [ ] Demo credentials shown on login page
- [ ] JWT expires after 8 hours of inactivity

**Story Points:** 3

---

#### US-2: Auth-Protected Routes
> **As the** system, **I want to** protect dashboard routes **so that** only authenticated operators can manage vehicles.

**Acceptance Criteria:**
- [ ] Unauthenticated users redirected to `/login` from dashboard
- [ ] JWT sent as Bearer token on all authenticated API calls
- [ ] Sign out button clears token and redirects to login
- [ ] Public routes (`/`, `/track`) accessible without login

**Story Points:** 2

---

### Epic 2: Vehicle Management

#### US-3: Add New Vehicle
> **As an** operator, **I want to** register a new bus with its GPS device details **so that** it appears on the tracking map.

**Acceptance Criteria:**
- [ ] Modal form with fields: Bus Number, Route, GPS Device ID, Device Model (optional), Status
- [ ] Validation: unique Bus Number and GPS Device ID
- [ ] On success: vehicle appears in table, modal closes
- [ ] On error: descriptive error message shown

**Story Points:** 5

---

#### US-4: Edit Vehicle Details
> **As an** operator, **I want to** update a vehicle's information **so that** the records stay accurate.

**Acceptance Criteria:**
- [ ] Edit button on each vehicle row opens pre-filled modal
- [ ] All fields editable
- [ ] Uniqueness validation on save
- [ ] Table updates immediately after save

**Story Points:** 3

---

#### US-5: Deactivate Vehicle
> **As an** operator, **I want to** deactivate a bus **so that** it no longer appears as an active vehicle.

**Acceptance Criteria:**
- [ ] Confirmation dialog before deactivation
- [ ] Vehicle status set to "Inactive" (soft delete)
- [ ] Status badge updates in table
- [ ] Inactive vehicles still visible in the list

**Story Points:** 2

---

#### US-6: View Vehicle List
> **As an** operator, **I want to** see a table of all registered vehicles **so that** I can manage my fleet.

**Acceptance Criteria:**
- [ ] Table with columns: Bus Number, Route, GPS Device ID, Device Model, Status, Last Updated, Actions
- [ ] Search/filter by bus number, route, or device ID
- [ ] Status badges (Active = green, Inactive = gray, Maintenance = yellow)
- [ ] Responsive: hides less important columns on mobile

**Story Points:** 3

---

### Epic 3: Live Tracking

#### US-7: Operator Live Map
> **As an** operator, **I want to** see all active buses on a real-time map **so that** I can monitor my fleet.

**Acceptance Criteria:**
- [ ] Full-screen dark-themed map showing Sri Lanka
- [ ] Bus markers with custom icons (green = online, red = offline)
- [ ] Online markers have pulse animation
- [ ] Stats bar: Total Vehicles, Online count, Offline count
- [ ] Click marker → popup with bus details
- [ ] Map updates automatically via SignalR

**Story Points:** 8

---

#### US-8: Rider Bus Tracking
> **As a** rider, **I want to** select a bus and see its live location **so that** I know when it will arrive.

**Acceptance Criteria:**
- [ ] No login required
- [ ] Searchable bus list panel on the left
- [ ] Click a bus → map centers and zooms to that bus
- [ ] Bus status indicators (Live/Off badges)
- [ ] Real-time position updates via SignalR
- [ ] Mobile responsive: panel slides up from bottom

**Story Points:** 8

---

#### US-9: Bus Info Popup
> **As a** user (rider or operator), **I want to** click a bus marker and see its details **so that** I know its status.

**Acceptance Criteria:**
- [ ] Popup shows: Bus number, Route, Online/Offline status, Speed, Last update time, GPS coordinates
- [ ] Dark themed popup matching app design
- [ ] Close on click outside

**Story Points:** 2

---

### Epic 4: GPS Integration

#### US-10: Receive GPS Updates
> **As a** GPS device, **I want to** send location data to the system **so that** the bus position is updated.

**Acceptance Criteria:**
- [ ] POST `/api/location` endpoint accepts: deviceId, latitude, longitude, speed, timestamp
- [ ] Matches device ID to registered vehicle
- [ ] Rejects updates for inactive vehicles
- [ ] Stores latest position (overwrites previous)
- [ ] Broadcasts update via SignalR to all clients

**Story Points:** 5

---

#### US-11: Offline Detection
> **As the** system, **I want to** mark a bus as offline if no GPS update is received for 60 seconds **so that** users see accurate status.

**Acceptance Criteria:**
- [ ] Configurable threshold (default 60 seconds)
- [ ] Online status calculated on each location query
- [ ] Marker changes from green to red when offline
- [ ] Status text changes from "Live" to "Off"

**Story Points:** 3

---

### Story Point Summary

| Epic | Stories | Total Points |
|------|---------|-------------|
| Authentication | US-1, US-2 | 5 |
| Vehicle Management | US-3, US-4, US-5, US-6 | 13 |
| Live Tracking | US-7, US-8, US-9 | 18 |
| GPS Integration | US-10, US-11 | 8 |
| **Total** | **11 stories** | **44 points** |

---

## 8. Configuration

### Backend (`appsettings.json`)
```json
{
  "Jwt": {
    "Key": "your-secret-key-min-32-chars",
    "Issuer": "BusTrackingApi",
    "Audience": "BusTrackingApp",
    "ExpiryMinutes": "480"
  },
  "Location": {
    "OfflineThresholdSeconds": "60"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=bustracking.db"
  }
}
```

### Frontend Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5044` | Backend API base URL |

---

## 9. Project Structure

```
BusTrackingSystem/
├── backend/
│   ├── BusTrackingApi/
│   │   ├── Program.cs              # Entry point, DI, middleware
│   │   ├── Data/                   # DbContext, seed data
│   │   ├── Models/                 # User, Vehicle, LocationUpdate
│   │   ├── Services/               # Auth, Vehicle, Location, Simulator
│   │   ├── Hubs/                   # SignalR LocationHub
│   │   ├── Endpoints/              # Auth, Vehicle, Location endpoints
│   │   └── appsettings.json        # Configuration
│   └── BusTrackingApi.sln
│
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js pages (App Router)
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── login/              # Operator login
│   │   │   ├── track/              # Public rider tracking
│   │   │   └── dashboard/          # Operator dashboard
│   │   │       ├── page.tsx        # Live map
│   │   │       └── vehicles/       # Vehicle CRUD
│   │   ├── components/             # Reusable components
│   │   │   ├── Map/                # Leaflet map
│   │   │   └── ui/                 # Design system
│   │   ├── lib/                    # API client, auth, SignalR
│   │   └── types/                  # TypeScript interfaces
│   └── package.json
│
└── docs/
    └── SYSTEM_DOCUMENTATION.md     # This file
```

---

## 10. Deployment Notes

This is a sample/demo application designed to run on a single machine.

- **Backend**: `dotnet run` (or `dotnet publish` for production)
- **Frontend**: `npm run dev` (or `npm run build && npm start` for production)
- **Database**: Auto-created SQLite file, no server needed
- **Scale**: Designed for ~50 vehicles, low concurrent users
- **Security**: JWT auth for operators, read-only public access
