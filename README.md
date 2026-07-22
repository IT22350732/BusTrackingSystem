# 🚌 Bus Tracking System

Real-time GPS bus tracking system with operator dashboard and public rider view.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Leaflet.js |
| Backend | .NET 8 Minimal API, EF Core |
| Database | SQLite |
| Real-time | SignalR (WebSocket) |
| Auth | JWT Bearer Tokens |

## Quick Start

### Prerequisites
- .NET SDK 8.0+
- Node.js 20.9+
- npm 10+

### 1. Run Backend

```bash
cd backend/BusTrackingApi
dotnet restore
dotnet run
```
Backend starts at: **http://localhost:5044**  
Swagger docs: **http://localhost:5044/swagger**

### 2. Run Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend starts at: **http://localhost:3000**

### 3. Access the App

| Page | URL |
|------|-----|
| 🏠 Home | http://localhost:3000 |
| 🚌 Track a Bus | http://localhost:3000/track |
| 🔐 Login | http://localhost:3000/login |
| 📊 Dashboard | http://localhost:3000/dashboard |
| 🚗 Vehicles | http://localhost:3000/dashboard/vehicles |

### Login Credentials
```
Email:    admin@bustracker.lk
Password: Admin@123
```

## Features

- ✅ Operator login with JWT authentication
- ✅ Vehicle CRUD (add, edit, deactivate)
- ✅ Real-time map with live bus markers
- ✅ Public bus tracking (no login needed)
- ✅ SignalR WebSocket for instant updates
- ✅ GPS simulator with Sri Lankan routes
- ✅ Online/offline detection (60s threshold)
- ✅ Dark theme with glassmorphism design
- ✅ Fully mobile responsive

## Documentation

See [docs/SYSTEM_DOCUMENTATION.md](docs/SYSTEM_DOCUMENTATION.md) for:
- Architecture diagrams
- API reference
- Database schema
- User storylines
- Configuration guide
