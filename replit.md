# EventFlow - Entertainment Center Management System

## Overview
A full-stack entertainment center management application with real-time ticket validation using QR codes, interactive venue maps with routing, parking capacity management, push notifications for all user roles, and AI-powered crowd flow optimization using OpenAI GPT-5. Supports three distinct user roles (spectators, staff, and organizers) with role-specific multi-page dashboards and navigation menus. Multi-language support (English, Romanian, Russian) with instant switching.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js with REST API + WebSocket for real-time updates
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect)
- **AI**: OpenAI GPT-5 for crowd management recommendations
- **RBAC**: Role-based access control middleware on sensitive API endpoints
- **i18n**: Client-side multi-language support (EN/RO/RU) with I18nProvider
- **Real-time**: WebSocket for instant sync of ticket upgrades, zone updates, parking, notifications

## Database Schema
11 tables: users, sessions (auth), events, venues, user_roles, ticket_categories, tickets, venue_zones, parking_lots, notifications, ai_recommendations

### Key Schema Additions
- `venues` - Event locations with name, address, city, country, lat/lng coordinates
- `ticket_categories` - Per-event pricing/capacity (Main/Tribuna/VIP with price, capacity, sold count)
- `tickets` now include `category` (Main/Tribuna/VIP) and `price` fields
- `events` now include optional `venueId` foreign key

## User Roles & Multi-Page Routing
- **Spectator** (`/spectator/*`):
  - My Tickets (`/spectator/tickets`) - View tickets with QR codes, demo ticket lifecycle mode, ticket availability with pricing, upgrade flow
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
- `GET /api/venues` - List venues
- `POST /api/venues` - Create venue (organizer RBAC)
- `GET /api/events/:eventId/ticket-categories` - Ticket categories with pricing
- `POST /api/events/:eventId/ticket-categories` - Create ticket category (organizer RBAC)
- `GET /api/events/:eventId/ticket-availability` - Live availability per category
- `POST /api/events/:eventId/tickets` - Create ticket
- `POST /api/tickets/:id/upgrade` - Upgrade ticket category (spectator, broadcasts WS)
- `POST /api/tickets/scan` - Scan ticket by code (staff/organizer RBAC)
- `GET /api/events/:eventId/zones` - Venue zones
- `GET /api/events/:eventId/parking` - Parking lots
- `POST /api/events/:eventId/recommendations/generate` - AI recommendations (organizer RBAC)
- `POST /api/seed` - Create demo data (with venue, categories, ticket)
- WebSocket at `/ws` for real-time updates

## Project Structure
- `shared/schema.ts` - Drizzle schema + Zod insert schemas + types (venues, ticketCategories, tickets with category/price)
- `server/routes.ts` - API routes + WebSocket + OpenAI + RBAC middleware (requireRole)
- `server/storage.ts` - DatabaseStorage class (CRUD operations including venue, ticketCategory, upgradeTicket)
- `client/src/App.tsx` - Auth flow + role selection + multi-page routing with lazy loading + I18nProvider
- `client/src/lib/i18n.tsx` - I18n provider with EN/RO/RU dictionaries
- `client/src/hooks/use-websocket.ts` - WebSocket hook for real-time cache invalidation
- `client/src/components/LanguageSelector.tsx` - Language switcher (EN/RO/RU)
- `client/src/pages/spectator/` - SpectatorTickets (with availability + upgrade), SpectatorMap, SpectatorDirections, SpectatorParking
- `client/src/pages/staff/` - StaffScanner, StaffMonitoring, StaffMap
- `client/src/pages/organizer/` - OrganizerOverview, OrganizerMap, OrganizerParking, OrganizerAnalytics, OrganizerAI
- `client/src/pages/RoleSelector.tsx` - Role selection screen with i18n
- `client/src/components/` - AppSidebar (i18n menus), VenueMap (minimalist SVG), TicketCard, ParkingMonitor, CapacityMeter, StatusBadge, NotificationCard, ThemeProvider, ThemeToggle

## Key Features
- **Real ticket purchase flow**: Spectators browse events, buy tickets (Main/Tribuna/VIP) via "Buy Ticket" button → confirmation dialog → POST API → instant QR code in "My Tickets"
- **Real ticket upgrade**: Spectators upgrade Main→Tribuna→VIP with price difference; WS broadcast to staff/organizers
- **Organizer event creation**: Full multi-step "Create Event" form (name, venue, date, time, capacity, ticket categories with prices). No demo/seed buttons in UI
- **Real-time ticket price editing**: Organizers can edit ticket category prices inline; change broadcasts instantly via WebSocket to all users
- **Multi-language**: English, Romanian, Russian with instant switching via LanguageSelector
- **Real QR code generation**: Each ticket shows a scannable SVG QR code. Fullscreen QR view for easy phone scanning
- **Camera QR scanning**: Staff scanner uses native BarcodeDetector API (Chrome/Edge). Graceful fallback for unsupported browsers. No demo mode
- **Real Google Maps Directions**: User enters starting location → "Get Directions" opens Google Maps with real turn-by-turn directions. Transport mode selection (car/walk/transit). Uses venue coordinates from DB
- **Venue management**: Venues with coordinates, linked to events via venueId foreign key
- Live simulation: Parking updates every 5s, analytics charts every 5s, stats refresh every 10s
- Minimalist venue map: Clean flat SVG design with zone occupancy color coding
- AI recommendations: Based on live event data, confidence scores, apply/pending status
- **WebSocket real-time sync**: ticket_purchased, ticket_scanned, ticket_upgraded, ticket_category_update, zone_update, parking_update, notification events

## Color Scheme
- Primary purple: 260 80% 50%
- Semantic: green (142 70% 45%), warning (38 90% 55%), error (0 80% 55%)
