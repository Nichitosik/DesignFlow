# EventFlow - Entertainment Center Management System

## Overview
A full-stack entertainment center management application with real-time ticket validation using QR codes, interactive venue maps with routing, parking capacity management, push notifications for all user roles, and AI-powered crowd flow optimization using OpenAI GPT-5. Supports three distinct user roles (spectators, staff, and organizers) with role-specific multi-page dashboards and navigation menus.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js with REST API + WebSocket for real-time updates
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect)
- **AI**: OpenAI GPT-5 for crowd management recommendations
- **RBAC**: Role-based access control middleware on sensitive API endpoints

## Database Schema
9 tables: users, sessions (auth), events, user_roles, tickets, venue_zones, parking_lots, notifications, ai_recommendations

## User Roles & Multi-Page Routing
- **Spectator** (`/spectator/*`):
  - My Tickets (`/spectator/tickets`) - View tickets with QR codes, demo ticket lifecycle mode
  - Venue Map (`/spectator/map`) - Interactive minimalist venue map
  - Directions (`/spectator/directions`) - Transport mode selection (car/walk/transit), location search, route steps
  - Parking (`/spectator/parking`) - Live parking availability with simulation
- **Staff** (`/staff/*`):
  - Scanner (`/staff/scanner`) - Ticket scanning with demo mode, scan history
  - Monitoring (`/staff/monitoring`) - Live entry/exit feed, entrance capacity, alerts
  - Venue Map (`/staff/map`) - Real-time zone occupancy
- **Organizer** (`/organizer/*`):
  - Overview (`/organizer/overview`) - KPI cards, zone capacity, notifications
  - Venue Map (`/organizer/map`) - Interactive zone management with capacity details
  - Parking (`/organizer/parking`) - Live parking management with simulation
  - Analytics (`/organizer/analytics`) - Entry/exit flow charts, zone/parking utilization, ticket distribution
  - AI Insights (`/organizer/ai`) - GPT-5 powered crowd flow recommendations based on live data

## Key API Endpoints
- `GET /api/events` - List all events
- `GET /api/events/:id/stats` - Event statistics
- `POST /api/events/:eventId/tickets` - Create ticket
- `POST /api/tickets/scan` - Scan ticket by code (staff/organizer RBAC)
- `GET /api/events/:eventId/zones` - Venue zones
- `GET /api/events/:eventId/parking` - Parking lots
- `POST /api/events/:eventId/recommendations/generate` - AI recommendations (organizer RBAC)
- `POST /api/seed` - Create demo data
- WebSocket at `/ws` for real-time updates

## Project Structure
- `shared/schema.ts` - Drizzle schema + Zod insert schemas + types
- `server/routes.ts` - API routes + WebSocket + OpenAI + RBAC middleware (requireRole)
- `server/storage.ts` - DatabaseStorage class (CRUD operations)
- `client/src/App.tsx` - Auth flow + role selection + multi-page routing with lazy loading
- `client/src/pages/spectator/` - SpectatorTickets, SpectatorMap, SpectatorDirections, SpectatorParking
- `client/src/pages/staff/` - StaffScanner, StaffMonitoring, StaffMap
- `client/src/pages/organizer/` - OrganizerOverview, OrganizerMap, OrganizerParking, OrganizerAnalytics, OrganizerAI
- `client/src/pages/RoleSelector.tsx` - Role selection screen
- `client/src/components/` - AppSidebar (role-based menus), VenueMap (minimalist SVG), TicketCard, ParkingMonitor, CapacityMeter, StatusBadge, NotificationCard, ThemeProvider, ThemeToggle

## Key Features
- Demo ticket mode: Simulates ticket lifecycle (pending -> valid -> used -> invalid) with interactive transitions
- Live simulation: Parking updates every 5s, analytics charts every 5s, stats refresh every 10s
- Transport mode selection: Car, walking, public transport with step-by-step routes
- Minimalist venue map: Clean flat SVG design with zone occupancy color coding
- AI recommendations: Based on live event data (zones, parking, tickets), confidence scores, apply/pending status

## Color Scheme
- Primary purple: 260 80% 50%
- Semantic: green (142 70% 45%), warning (38 90% 55%), error (0 80% 55%)
