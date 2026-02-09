# EventFlow - Entertainment Center Management System

## Overview
A full-stack entertainment center management application with real-time ticket validation using QR codes, interactive venue maps, parking capacity management, push notifications for all user roles, and AI-powered crowd flow optimization recommendations.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js with REST API + WebSocket for real-time updates
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect)
- **AI**: OpenAI GPT-5 for crowd management recommendations

## Database Schema
9 tables: users, sessions (auth), events, user_roles, tickets, venue_zones, parking_lots, notifications, ai_recommendations

## User Roles
- **Spectator**: View tickets with QR codes, venue maps, event updates
- **Staff**: Scan/validate tickets, monitor entrances, view alerts
- **Organizer**: Full dashboard with analytics, AI recommendations, parking management

## Key API Endpoints
- `GET /api/events` - List all events
- `GET /api/events/:id/stats` - Event statistics
- `POST /api/events/:eventId/tickets` - Create ticket
- `POST /api/tickets/scan` - Scan ticket by code
- `GET /api/events/:eventId/zones` - Venue zones
- `GET /api/events/:eventId/parking` - Parking lots
- `POST /api/events/:eventId/recommendations/generate` - AI recommendations
- `POST /api/seed` - Create demo data
- WebSocket at `/ws` for real-time updates

## Project Structure
- `shared/schema.ts` - Drizzle schema + Zod insert schemas + types
- `server/routes.ts` - API routes + WebSocket + OpenAI integration
- `server/storage.ts` - DatabaseStorage class (CRUD operations)
- `client/src/App.tsx` - Auth flow + role selection + routing
- `client/src/pages/` - SpectatorDashboard, StaffDashboard, OrganizerDashboard, RoleSelector
- `client/src/components/` - VenueMap, TicketCard, ParkingMonitor, CapacityMeter, StatusBadge, NotificationCard

## Color Scheme
- Primary purple: 260 80% 50%
- Semantic: green (142 70% 45%), warning (38 90% 55%), error (0 80% 55%)
