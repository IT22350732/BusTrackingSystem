# 🚌 Bus Tracking System — System Overview & Architecture Guide

A comprehensive guide explaining **how the Bus Tracking System works**, its **API endpoints**, how **maps (Google Maps / Leaflet)** are connected, and **how buses are tracked in real time**.

---

## 📋 Executive Summary (Basic Idea of the System)

The **Bus Tracking System (BTS)** is a real-time web application designed to track public transport buses across Sri Lanka. It serves three main categories of users:

1. **Riders (Public Users):** Can view an interactive map to trace active buses, check live speeds, view estimated positions, and book bus tickets without complex login steps.
2. **Bus Operators (Admins):** Log into a secure dashboard to manage bus fleets (add/edit/deactivate buses), monitor real-time telemetry, and oversee active routes.
3. **GPS Trackers / Simulator:** Physical GPS devices on buses (or an automated backend simulator) periodically stream location telemetry (Latitude, Longitude, Speed) to the backend.

---

## 🏗️ 1. How the System Works (High-Level Architecture)

The system follows a modern **decoupled Client-Server & Event-Driven Architecture**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      FRONTEND LAYER                         │
 │           Next.js 15 (React 19) + TypeScript               │
 │                                                             │
 │   ┌─────────────┐    ┌──────────────┐    ┌──────────────┐   │
 │   │ Rider Map   │    │  Operator    │    │ Ticket       │   │
 │   │  (/track)   │    │ Dashboard    │    │ Booking      │   │
 │   └──────┬──────┘    └──────┬───────┘    └──────┬───────┘   │
 │          │                  │                   │           │
 │          └──────────────────┼───────────────────┘           │
 │                             │                               │
 │                  ┌──────────┴──────────┐                    │
 │                  │ Map Component       │                    │
 │                  │ (Leaflet / Google)  │                    │
 │                  └──────────┬──────────┘                    │
 └─────────────────────────────┼───────────────────────────────┘
                               │ HTTP REST & SignalR WebSocket
 ┌─────────────────────────────┼───────────────────────────────┐
 │                      BACKEND LAYER                          │
 │                   .NET 8 Minimal API                        │
 │                                                             │
 │   ┌──────────────┐   ┌─────────────┐   ┌────────────────┐   │
 │   │ Auth Service │   │ Vehicle API │   │ Location API   │   │
 │   │ (JWT Auth)   │   │ (Fleet CRUD)│   │ (Telemetry)    │   │
 │   └──────────────┘   └─────────────┘   └───────┬────────┘   │
 │                                                │            │
 │   ┌──────────────┐                   ┌─────────┴────────┐   │
 │   │ Simulator    │ ─── (5s Updates) ─►│ SignalR Hub     │   │
 │   │ Service      │                   │ (WebSockets)     │   │
 │   └──────────────┘                   └─────────┬────────┘   │
 └────────────────────────────────────────────────┼────────────┘
                                                  │
                                        ┌─────────┴────────┐
                                        │ Database Layer   │
                                        │ SQLite DB        │
                                        └──────────────────┘
```

### Core Components Explained:
- **Frontend (Next.js 15):** User interface rendering the interactive dark-themed map, live vehicle sidebar, booking system, and operator management views.
- **Backend (.NET 8):** Lightweight, high-performance C# Minimal API handling data persistence, security validation, JWT authentication, and business logic.
- **SignalR Hub (Real-Time Engine):** Maintains open WebSocket connections with all connected web browsers. When a location update arrives, SignalR broadcasts it instantly without requiring page refreshes.
- **GPS Simulator Service:** Runs inside the backend process to generate realistic Sri Lankan route coordinates (e.g., Colombo–Kandy, Colombo–Galle) every 5 seconds for testing and demonstration.
- **Database (SQLite / MongoDB):** Stores user credentials, vehicle metadata, booking records, and historical GPS logs.

---

## 🔌 2. API Reference (What APIs are Used?)

The system provides RESTful HTTP APIs and WebSocket endpoints categorized into 5 main groups:

### 🔑 Authentication APIs (`/api/auth`)
- `POST /api/auth/login` — Authenticates operators/users with email & password, returning a signed JWT Bearer Token.
- `POST /api/auth/register` — Registers new users with hashed passwords (BCrypt).

### 🚌 Vehicle Management APIs (`/api/vehicles`)
- `GET /api/vehicles` — Returns a list of all buses in the fleet (Public).
- `GET /api/vehicles/{id}` — Gets details of a specific bus by ID (Public).
- `POST /api/vehicles` — Adds a new vehicle to the fleet (Operator Auth Required).
- `PUT /api/vehicles/{id}` — Updates bus details or maintenance status (Operator Auth Required).
- `DELETE /api/vehicles/{id}` — Deactivates/soft-deletes a bus (Operator Auth Required).

### 📍 Location & Telemetry APIs (`/api/location`)
- `POST /api/location` — Endpoint where GPS hardware units (or simulator) submit live coordinates:
  ```json
  {
    "deviceId": "TRK-001-SIM",
    "latitude": 7.2906,
    "longitude": 80.6337,
    "speed": 45.5,
    "timestamp": "2026-07-23T12:00:00Z"
  }
  ```
- `GET /api/location` — Fetches the latest known location for all active buses.
- `GET /api/location/{vehicleId}` — Fetches the latest coordinates for a single bus.

### 🎟️ Booking APIs (`/api/bookings`)
- `POST /api/bookings` — Creates a seat booking for a user (Auth Required).
- `GET /api/bookings` — Lists bookings for the logged-in user (Auth Required).
- `GET /api/tracking/{vehicleId}/validate` — Validates if a user has active booking access for a specific bus.

### ⚡ SignalR Live WebSocket Hub (`/hubs/location`)
- **Transport:** WebSockets / Server-Sent Events (SSE).
- **Event Name:** `ReceiveLocationUpdate`
- **Payload:** Pushes real-time bus location, speed, online/offline status, and timestamp to all subscribed frontend clients.

---

## 🗺️ 3. How the Map (Google Maps / Leaflet) is Connected

The map is the central visual centerpiece of the Bus Tracking System. Here is how map integration works and how Google Maps connects to the system:

```
┌───────────────────────────┐        ┌───────────────────────────┐
│     Backend / SignalR     │        │   Frontend Map Component  │
│  Latitude:  7.2906        ├───────►│      (MapView.tsx)        │
│  Longitude: 80.6337       │        │   Translates coordinates  │
└───────────────────────────┘        │   to visual screen point  │
                                     └─────────────┬─────────────┘
                                                   │
                                     ┌─────────────▼─────────────┐
                                     │    Interactive Map Layer  │
                                     │  (Leaflet / Google Maps)  │
                                     │                           │
                                     │    🚌 Bus Marker [Pulse]  │
                                     │  Popup: Route, Speed, Status│
                                     └───────────────────────────┘
```

### Current Implementation (Leaflet.js + CartoDB Tile Provider)
1. **Interactive Rendering:** The component [MapView.tsx](file:///Users/menda/Desktop/BTS/BusTrackingSystem/frontend/src/components/Map/MapView.tsx) initializes an interactive HTML5 Canvas/SVG map targeted at Sri Lanka coordinates `[7.8731, 80.7718]`.
2. **Tile Layer:** Map imagery is loaded dynamically using dark CartoDB vector tiles (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`).
3. **Custom Marker Creation:** Custom HTML bus icons (`createBusIcon`) with CSS animations (e.g., pulsing green dot for online, red dot for offline, yellow dot for maintenance) are created.
4. **Dynamic Updates:** As new coordinates arrive via SignalR, the marker's latitude and longitude are updated programmatically via `marker.setLatLng([lat, lng])`.
5. **Auto-Pan & Fly-To:** When a user selects a bus from the sidebar, the map smoothly animates to center on the bus using `map.flyTo([lat, lng], zoomLevel)`.

### Connecting Google Maps API (Alternative / Enterprise Setup)
To switch or connect **Google Maps JavaScript API**, the integration works as follows:

1. **Load Google Maps Script:** Inject the Google Maps API script with your API key into Next.js (`layout.tsx` or `Script` component):
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY"></script>
   ```
2. **Initialize Google Map Container:**
   ```typescript
   const map = new google.maps.Map(containerRef.current, {
     center: { lat: 7.8731, lng: 80.7718 },
     zoom: 8,
     styles: darkModeStyles // Custom Google Maps Dark Theme
   });
   ```
3. **Update Bus Markers:**
   ```typescript
   // Create or update marker position
   marker.setPosition(new google.maps.LatLng(lat, lng));
   ```

---

## 📡 4. How the Buses are Tracked (Step-by-Step Telemetry Flow)

Bus tracking operates in a 5-step continuous loop:

```
[1. GPS Sensor / Simulator]
           │
           │ (HTTP POST with Lat, Lng, Speed, DeviceId)
           ▼
[2. Location API Endpoint (/api/location)]
           │
           │ (Verify DeviceId & Save to DB)
           ▼
[3. Status & Telemetry Engine]
           │ Calculates: IsOnline? (Last update < 60 seconds ago)
           │
           ▼
[4. SignalR WebSocket Broadcast (ReceiveLocationUpdate)]
           │
           │ (Push to connected browsers in < 100ms)
           ▼
[5. Frontend UI & Map Marker Smooth Movement]
```

### Step 1: Telemetry Data Generation
- A physical GPS device mounted inside the bus reads satellite coordinates.
- Alternatively, the built-in C# `SimulatorService` computes movement along predefined Sri Lankan route waypoints (e.g., Colombo to Kandy along Route 1).

### Step 2: Ingestion
- Every 5 seconds, a payload containing `deviceId`, `latitude`, `longitude`, `speed`, and `timestamp` is posted to `/api/location`.

### Step 3: Device Validation & Online Detection
- The backend matches `deviceId` to the corresponding `VehicleId` in the database.
- It computes whether the bus is **Online** (if a location update was received within the last **60 seconds**) or **Offline**.

### Step 4: Instant WebSocket Push
- The backend triggers `HubContext.Clients.All.SendAsync("ReceiveLocationUpdate", locationDto)`.
- All open web pages (rider map, operator dashboard) receive the raw JSON message immediately over WebSockets.

### Step 5: Map Marker Rendering
- The React frontend receives the WebSocket packet.
- The `MapView` component updates the position of the marker on the map smoothly without reloading the web page.

---

## 📁 5. Directory Structure Overview

```
BusTrackingSystem/
├── backend/                  # .NET 8 Web API
│   └── BusTrackingApi/
│       ├── Endpoints/        # Minimal API endpoints (Auth, Vehicles, Location, Bookings)
│       ├── Models/           # C# Data models & DTOs
│       ├── Services/         # Business logic & GPS SimulatorService
│       ├── Hubs/             # SignalR WebSocket Hub (LocationHub.cs)
│       └── Data/             # Database Context (SQLite / Mongo)
├── frontend/                 # Next.js 15 React Web Application
│   └── src/
│       ├── app/              # App router pages (/, /track, /login, /dashboard, /book)
│       ├── components/       # UI Components & MapView.tsx
│       └── types/            # TypeScript interfaces & types
└── docs/                     # System & API documentation
```

---

## 🚀 Summary

- **Frontend:** Built with **Next.js 15 & Leaflet.js / CartoDB** (or Google Maps SDK) for dark-mode interactive maps.
- **Backend:** Powered by **.NET 8 Minimal APIs & SignalR** for high-throughput live tracking.
- **Tracking:** Operates via **5-second telemetry pushes** broadcasted over WebSockets to update bus markers dynamically.
