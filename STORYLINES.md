# 🚌 Bus Tracking System — System Storylines & User Journeys

A comprehensive guide documenting all end-to-end storylines, user journeys, operational narratives, and system event flows for the **Bus Tracking System (BTS)**.

---

## 🎭 1. Overview of System Actors & Personas

| Actor / Persona | Role & Description | System Access Level | Key Objectives |
| :--- | :--- | :--- | :--- |
| **Sanath (Public Rider)** | Commuter traveling between Sri Lankan cities (e.g., Colombo to Kandy). | Public / Unauthenticated | View live bus locations, check arrival times, search routes, book tickets. |
| **Anura (Fleet Operator)** | Bus depot manager supervising Sri Lanka bus fleets. | Authenticated (JWT Admin) | Monitor live fleet operations, add/edit vehicles, manage maintenance & soft deletes. |
| **IoT GPS Device (Hardware)** | On-board physical tracking hardware mounted on buses. | Telemetry Endpoint API | Send location (Lat/Lng), speed, and timestamp every 5 seconds. |
| **GPS Simulator Service** | Automated backend service generating Sri Lankan route coordinates. | Internal Background Service | Provide live motion data for testing across major routes without hardware. |
| **SignalR Broadcast Engine** | Real-time WebSocket hub in the .NET 8 backend. | WebSocket Server (`/hubs/location`) | Instantly push telemetry updates to all open web client sessions. |

---

## 📖 2. Rider & Public User Storylines

```
┌───────────────────────────────────────────────────────────────────────────┐
│                      RIDER USER JOURNEY (SANATH)                          │
│                                                                           │
│  [1. Open Site] ──► [2. Search Route] ──► [3. Live Map Tracking]         │
│    (No Auth)         "Colombo - Kandy"      Watch pulsing marker move     │
│                                                   │                       │
│  [5. Ticket Confirmation] ◄── [4. Book Ticket] ◄──┘                       │
│    Get Booking Code            Select Bus & Seat                          │
└───────────────────────────────────────────────────────────────────────────┘
```

### 💬 Storyline 1.1: Live Bus Discovery & Commute Tracking
> **Actor:** Sanath (Public Rider)  
> **Goal:** Track an incoming bus on the map to avoid waiting long at the bus stop.

1. **Entry & Map Loading:** Sanath opens the Bus Tracking System website on his smartphone while standing at the Pettah Bus Stop. He lands on the Public Tracking Page (`/track`).
2. **Interactive Map Initialization:** The application loads a Leaflet dark-mode map centered on Sri Lanka (`[7.8731, 80.7718]`). Dark CartoDB vector tiles render smoothly.
3. **Live Marker Appearance:** Pulsing green bus markers populate the map in real time. Sanath notices bus `NB-2547` moving along Route 1 (Colombo – Kandy).
4. **Selecting a Bus:** Sanath taps the marker for `NB-2547`. The map smoothly pans and zooms (`flyTo`) onto the bus position.
5. **Telemetry Inspection:** A dark-themed popup opens displaying:
   - **Bus Number:** `NB-2547`
   - **Route:** Colombo – Kandy (Route 1)
   - **Speed:** 52 km/h
   - **Status:** `LIVE` (Pulsing Green Badge)
   - **Last Update:** Just now (2 seconds ago)
6. **Real-Time Tracking:** As Sanath watches, the bus marker smoothly glides forward every 5 seconds along the A1 highway without refreshing the page, driven by WebSockets.

---

### 💬 Storyline 1.2: Searching Routes & Filtering Active Fleets
> **Actor:** Sanath (Public Rider)  
> **Goal:** Quickly locate a bus travelling specifically to Galle.

1. **Sidebar Navigation:** Sanath opens the sidebar search drawer on the left side of the screen.
2. **Keyword Filtering:** He types `"Galle"` into the search input.
3. **Dynamic Results:** The sidebar instantly filters the vehicle list to show `NC-3891` (Colombo – Galle, Route 2).
4. **Focus & Center:** Sanath clicks on `NC-3891` in the list. The map automatically re-centers to Southern Expressway coordinates where `NC-3891` is currently traveling at 75 km/h.

---

### 💬 Storyline 1.3: Booking a Seat on an Active Route
> **Actor:** Sanath (Public Rider)  
> **Goal:** Reserve a bus ticket for an upcoming trip.

1. **Initiate Booking:** While tracking bus `NB-2547`, Sanath clicks the **"Book Ticket"** button inside the info panel.
2. **Navigation:** He is redirected to the ticket booking view (`/book?vehicleId=1`).
3. **Seat Selection:** Sanath inputs his name, selects departure (Colombo Fort), destination (Kandy), and chooses Seat 14.
4. **API Submission:** The frontend sends a `POST /api/bookings` request to the backend.
5. **Confirmation:** The system returns a booking confirmation receipt with a unique Ticket Code (`TCK-88214`), allowing Sanath to show it to the conductor upon boarding.

---

## 🔒 3. Fleet Operator & Admin Storylines

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    OPERATOR DASHBOARD JOURNEY (ANURA)                     │
│                                                                           │
│  [1. Login] ──────► [2. Operator Dashboard] ──► [3. Fleet Oversight]      │
│    JWT Auth           Live Map & Metrics         Online / Offline Count   │
│                                                        │                  │
│  [5. Telemetry Saved] ◄── [4. Add New Bus] ◄───────────┘                  │
│    Join Live Stream         Register Device & Route                       │
└───────────────────────────────────────────────────────────────────────────┘
```

### 💬 Storyline 2.1: Secure Operator Authentication
> **Actor:** Anura (Fleet Operator)  
> **Goal:** Securely log into the management console to supervise daily depot operations.

1. **Login Request:** Anura navigates to `/login` and enters his admin credentials (`admin@bustracker.lk`).
2. **Backend Authentication:** The frontend submits a `POST /api/auth/login` payload to the backend. The server verifies the password hash using BCrypt.
3. **Token Issuance:** The backend responds with a signed JWT Bearer Token (valid for 8 hours).
4. **Secure Redirect:** The frontend stores the token in secure storage and redirects Anura to the Operator Dashboard (`/dashboard`).
5. **Protected Route Enforcer:** If Anura tries to access `/dashboard` without a token in the future, the route guard redirects him back to `/login`.

---

### 💬 Storyline 2.2: Master Fleet Monitoring & Live Telemetry
> **Actor:** Anura (Fleet Operator)  
> **Goal:** Overview all active fleet vehicles across Sri Lanka from a central command dashboard.

1. **Dashboard Metrics:** Upon landing on `/dashboard`, Anura views high-level KPI summary cards:
   - **Total Registered Fleet:** 5 Buses
   - **Online & Operational:** 4 Buses
   - **Offline / Disconnected:** 0 Buses
   - **Under Maintenance:** 1 Bus
2. **Live Command Map:** Below the metrics, an interactive map displays all 4 active buses continuously streaming location data via SignalR.
3. **Speed & Threshold Alerts:** Anura monitors `NC-3891` traveling along the expressway. The UI indicates a speed of 78 km/h, remaining within safe operational limits.

---

### 💬 Storyline 2.3: Registering a New Fleet Bus (Vehicle Onboarding)
> **Actor:** Anura (Fleet Operator)  
> **Goal:** Register a newly acquired bus and connect its physical GPS tracking device.

1. **Accessing Fleet Management:** Anura clicks on **"Vehicles"** in the dashboard sidebar (`/dashboard/vehicles`).
2. **Opening Registration Modal:** He clicks the **"+ Add Vehicle"** button. A glassmorphism modal form appears.
3. **Form Submission:** Anura enters the new bus parameters:
   - **Bus Plate Number:** `ND-9988`
   - **Route Name:** Colombo – Matara (Route 6)
   - **GPS Device ID:** `TRK-006-HW`
   - **Device Model:** Teltonika FMB920
   - **Initial Status:** `Active`
4. **Backend Validation & Storage:** The frontend submits a `POST /api/vehicles` request with the JWT Bearer token attached in the `Authorization` header. The backend verifies that `ND-9988` and `TRK-006-HW` are unique, then writes the vehicle record to SQLite database.
5. **Instant Table Update:** The modal closes automatically, and `ND-9988` appears instantly in the fleet table with an `Active` status badge.

---

### 💬 Storyline 2.4: Managing Vehicle Maintenance & Status Updates
> **Actor:** Anura (Fleet Operator)  
> **Goal:** Flag a bus for scheduled maintenance so it does not falsely appear operational on public maps.

1. **Identify Maintenance Vehicle:** Bus `EP-7890` (Colombo – Batticaloa) is scheduled for gearbox repair at the central depot.
2. **Edit Action:** Anura locates `EP-7890` in the vehicle management table and clicks **"Edit"**.
3. **Status Change:** In the edit modal, he changes the status dropdown from `Active` to `Maintenance`.
4. **Persisting Change:** Anura clicks **"Save Changes"** (`PUT /api/vehicles/{id}`).
5. **System Response:** The database updates. The GPS Simulator Service automatically skips broadcasting telemetry for `EP-7890`, and its map badge changes to warning yellow (`Maintenance`).

---

### 💬 Storyline 2.5: Soft-Deactivating Retired Fleet Vehicles
> **Actor:** Anura (Fleet Operator)  
> **Goal:** Remove an old bus from active rotation without deleting historical telemetry logs.

1. **Deactivation Request:** Anura clicks the **"Deactivate"** button next to a decommissioned bus row.
2. **Confirmation Safeguard:** A confirmation dialog appears asking: *"Are you sure you want to deactivate bus NC-3891?"*
3. **Soft Delete Execution:** Upon confirmation, a `DELETE /api/vehicles/{id}` request is sent.
4. **Database State:** The backend sets `Status = "Inactive"` in the database. The bus disappears from the public rider map while retaining full audit records in the database.

---

## 🛰️ 4. GPS Device & Telemetry Data Pipeline Storylines

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    TELEMETRY DATA PIPELINE STORYLINE                      │
│                                                                           │
│  [Physical GPS / Simulator]                                               │
│       │                                                                   │
│       │ 1. HTTP POST /api/location (DeviceID, Lat, Lng, Speed)            │
│       ▼                                                                   │
│  [.NET 8 Location Controller]                                             │
│       │                                                                   │
│       │ 2. Validate Device ID & Vehicle Status                            │
│       │ 3. Persist Snapshot to SQLite Database                            │
│       ▼                                                                   │
│  [SignalR Real-Time Hub (/hubs/location)]                                 │
│       │                                                                   │
│       │ 4. WebSocket Broadcast "ReceiveLocationUpdate" (<100ms)           │
│       ▼                                                                   │
│  [React Frontend MapView.tsx] ──► Smooth Marker Relocation (setLatLng)    │
└───────────────────────────────────────────────────────────────────────────┘
```

### 💬 Storyline 3.1: Hardware GPS Unit Telemetry Submission
> **Actor:** On-Board IoT GPS Hardware (Teltonika Tracker)  
> **Goal:** Transmit satellite coordinates to the cloud backend while the bus is in transit.

1. **Satellite Acquisition:** The onboard GPS receiver fixes satellite signals at coordinates `Latitude: 7.2906, Longitude: 80.6337` with a speed of `45.5 km/h`.
2. **HTTP Payload Construction:** The tracker formats a lightweight JSON packet:
   ```json
   {
     "deviceId": "TRK-001-SIM",
     "latitude": 7.2906,
     "longitude": 80.6337,
     "speed": 45.5,
     "timestamp": "2026-07-23T16:20:00Z"
   }
   ```
3. **Transmission:** The hardware device issues an `HTTP POST` request to `https://api.bustracking.lk/api/location`.
4. **Backend Processing:**
   - Location Endpoint validates `deviceId` against `Vehicles` table.
   - Saves record to `LocationUpdates` DB table.
   - Invokes `SignalR Hub` to broadcast the location packet immediately.

---

### 💬 Storyline 3.2: Automated GPS Route Simulator Flow
> **Actor:** C# Background `SimulatorService`  
> **Goal:** Provide seamless, realistic location testing data across Sri Lankan routes when physical buses are offline.

1. **Background Initialization:** As soon as the .NET 8 backend starts, `SimulatorService` boots as a hosted `IHostedService`.
2. **Waypoint Interpolation:** The service loads predefined route waypoints:
   - **Route 1:** Colombo Fort ↔ Kandy Central (along A1 Highway)
   - **Route 2:** Colombo Fort ↔ Galle Fort (along Southern Expressway)
   - **Route 3:** Kandy ↔ Nuwara Eliya
   - **Route 4:** Colombo ↔ Jaffna
3. **Tick Loop (Every 5 Seconds):**
   - Calculates step movement along the coordinate array.
   - Applies realistic speed variations (30 km/h in urban areas, up to 80 km/h on highways).
   - Injects micro GPS position jitter for realism.
   - Handles route reversal: when a bus reaches Kandy, it automatically turns around back toward Colombo.

---

## ⚡ 5. Real-Time Broadcast & Signal Loss Storylines

### 💬 Storyline 4.1: Instant WebSocket Broadcast & Marker Animation
> **Actor:** SignalR Hub & Frontend Map Engine  
> **Goal:** Deliver sub-second visual movement updates on maps across hundreds of active rider screens.

1. **WebSocket Packet Arrival:** The browser's active SignalR connection receives the `ReceiveLocationUpdate` event payload.
2. **State Update:** The Next.js React state receives the updated coordinates for `vehicleId: 1`.
3. **Smooth Marker Movement:** The `MapView` component identifies the active Leaflet marker instance for `NB-2547` and executes:
   ```typescript
   marker.setLatLng([newLat, newLng]);
   ```
4. **Visual Feedback:** The custom HTML marker seamlessly moves to the new coordinate position. The popup speed reading updates dynamically from `50 km/h` to `52 km/h`.

---

### 💬 Storyline 4.2: Automated Signal Loss & Offline Detection
> **Actor:** Backend Status Calculator Engine  
> **Goal:** Detect when a bus loses cellular coverage or stops transmitting GPS data.

1. **Signal Interruption:** Bus `NC-3891` enters Kadugannawa tunnel area; cellular connection drops. No GPS updates arrive at `/api/location`.
2. **Threshold Calculation:** When users query location data or inspect status, the system evaluates:
   $$\text{Time Elapsed} = \text{Current Time} - \text{Last Update Timestamp}$$
3. **Offline Trigger:** After **60 seconds** without a new update (`Time Elapsed > 60s`), the system recalculates `IsOnline = false`.
4. **Visual Alert Push:** SignalR broadcasts the updated offline status to all clients.
5. **UI Transition:** On all rider and operator maps, the marker for `NC-3891` changes from a pulsing green badge to a solid red **"OFFLINE"** indicator.

---

### 💬 Storyline 4.3: Network Reconnection & State Resynchronization
> **Actor:** Frontend SignalR Reconnection Client  
> **Goal:** Restore live tracking smoothly when a rider regains mobile data signal.

1. **Signal Loss:** Rider Sanath enters an underground passage; his phone loses internet access.
2. **Client Retry Policy:** The SignalR JS client detects socket closure and triggers automatic reconnect attempts (`withUrl().withAutomaticReconnect()`).
3. **Re-connection Established:** Sanath exits the passage; internet connects. SignalR reconnects to `/hubs/location`.
4. **Snapshot Sync:** The app immediately issues a fallback REST call `GET /api/location` to retrieve the latest authoritative positions for all buses, snapping all map markers back to current positions cleanly.

---

## 📋 6. Complete User Story & Acceptance Criteria Matrix

| Story ID | Epic | Title | User Story Summary | Points |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | Auth | Operator Login | As an operator, I want to log in so I can access the dashboard. | 3 |
| **US-02** | Auth | Auth Guards | As the system, I want to protect `/dashboard` from unauthorized access. | 2 |
| **US-03** | Fleet | Add Vehicle | As an operator, I want to register a new bus and device ID. | 5 |
| **US-04** | Fleet | Edit Vehicle | As an operator, I want to update bus details or maintenance status. | 3 |
| **US-05** | Fleet | Deactivate Vehicle | As an operator, I want to soft-delete retired buses from tracking. | 2 |
| **US-06** | Fleet | View Fleet List | As an operator, I want to view a searchable list of registered vehicles. | 3 |
| **US-07** | Tracking | Operator Live Map | As an operator, I want a full master map of all active buses. | 8 |
| **US-08** | Tracking | Rider Map Tracking | As a rider, I want to search and track live buses without logging in. | 8 |
| **US-09** | Tracking | Bus Details Popup | As a user, I want to click a map marker to view speed and route info. | 2 |
| **US-10** | Telemetry | Receive GPS Data | As an IoT device, I want to post coordinates to `/api/location`. | 5 |
| **US-11** | System | Offline Detection | As the system, I want to flag buses offline if silent > 60 seconds. | 3 |

---

## 🚀 Summary

The **Bus Tracking System** unifies riders, fleet operators, physical GPS units, and automated services into a cohesive, real-time ecosystem. Through event-driven SignalR WebSockets and modern REST endpoints, storylines flow seamlessly from telemetry ingestion to interactive dark-mode map animations.
