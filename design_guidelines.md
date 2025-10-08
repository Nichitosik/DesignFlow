# Design Guidelines: Entertainment Center Management Application

## Design Approach: Material Design System (Information-Dense Utility)

**Rationale**: This application requires real-time data visualization, complex navigation flows, and multi-role interfaces. Material Design's elevation system, clear iconography, and proven patterns for data-heavy applications make it ideal for spectator flow management, parking monitoring, and live status updates.

**Key Design Principles**:
- Clarity over decoration - every element serves a functional purpose
- Instant readability - critical information (ticket status, parking capacity, alerts) must be immediately visible
- Progressive disclosure - show essential data first, details on demand
- Role-based UI adaptation - different interfaces for spectators, staff, organizers

---

## Core Design Elements

### A. Color Palette

**Light Mode**:
- Primary: 260 80% 50% (Deep purple - authority and premium events)
- Primary Variant: 260 70% 40% (Darker for contrast)
- Secondary: 340 75% 55% (Vibrant coral - alerts and CTAs)
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Success: 142 70% 45% (Capacity available, verified tickets)
- Warning: 38 90% 55% (Approaching capacity)
- Error: 0 80% 55% (Full capacity, invalid tickets)

**Dark Mode**:
- Primary: 260 65% 65%
- Primary Variant: 260 55% 75%
- Secondary: 340 65% 65%
- Background: 240 10% 10%
- Surface: 240 8% 15%
- Success: 142 60% 50%
- Warning: 38 85% 60%
- Error: 0 75% 60%

### B. Typography

**Font Family**: Inter (primary), SF Pro Display (headings on iOS)

**Scale & Usage**:
- Display Large (32px/800): Event titles, main dashboard headers
- Headline (24px/700): Section headers, card titles
- Title (20px/600): Modal headers, subsection titles
- Body Large (16px/500): Primary content, descriptions
- Body (14px/400): Secondary text, metadata
- Label (12px/600): Input labels, badges, status indicators
- Caption (11px/400): Timestamps, helper text

### C. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Micro spacing (p-2, gap-2): Between related icons and labels
- Component padding (p-4, p-6): Card interiors, form fields
- Section spacing (p-8, p-12): Between major UI sections
- Page margins (p-16, p-24): Outer containers, hero sections

**Grid System**:
- Mobile: Single column, full-width cards
- Tablet: 2-column for dashboards, single for detail views
- Desktop: 12-column grid, 3-4 columns for status cards, side navigation

### D. Component Library

**Navigation**:
- Top App Bar: Sticky header with role indicator (Spectator/Staff/Organizer), notification bell, profile
- Bottom Navigation (Mobile): Max 4 items - Home, My Ticket, Map, Notifications
- Side Navigation (Desktop): Collapsible drawer with role-specific menu items

**Data Display**:
- Status Cards: Elevated cards with large status indicator (color-coded circle), primary metric (e.g., "1,247 / 2,000"), secondary info, trend arrow
- Live Capacity Meters: Horizontal progress bars with gradient fills (green→yellow→red), percentage labels, last updated timestamp
- Map Component: Full-bleed interactive map with custom markers (parking zones, entrances, stages), floating controls (zoom, recenter, layer toggle)
- Ticket Display: Large QR code center, ticket details in Material card, status chip (Valid/Scanned/Invalid), countdown timer for entry

**Forms & Inputs**:
- Text Fields: Material outlined style, floating labels, helper text below, error states with icon
- Dropdowns: Menu surfaces with elevation 8, search for long lists
- Date/Time Pickers: Modal dialogs with calendar grid, time stepper
- Toggle Switches: For staff controls (parking lot open/closed, entrance active/inactive)

**Alerts & Notifications**:
- Snackbar: Bottom-center for transient confirmations (4s auto-dismiss)
- Alert Banners: Top of screen for critical system messages (full-width, dismissible)
- Push Notification Cards: Grouped by type, swipe-to-dismiss, action buttons
- Real-time Updates: Pulsing dot indicator for live data refresh

**Action Elements**:
- FAB (Floating Action Button): Primary action per screen (e.g., "Check In Ticket" for staff)
- Primary Buttons: Filled, high emphasis (Enter Venue, Navigate to Parking)
- Secondary Buttons: Outlined, medium emphasis (View Details, Share)
- Text Buttons: Low emphasis (Cancel, Skip)

**Data Visualization**:
- Flow Charts: Sankey-style for spectator movement patterns
- Heat Maps: Color-coded density overlays on venue map
- Time Series: Line graphs for hourly entry rates, animated path reveals
- Donut Charts: Parking zone capacity distribution, ticket type breakdown

### E. Animations

**Essential Only**:
- Page Transitions: 250ms ease-out slide (mobile), 200ms fade (desktop)
- Loading States: Material circular progress (1.5s rotation), skeleton screens for cards
- Status Changes: 300ms color transition on capacity updates, scale pulse (1.05x) for critical alerts
- Map Interactions: Smooth pan/zoom with momentum (no bounce), marker drop animation (150ms)

**Avoid**: Decorative parallax, hover animations on touch devices, auto-playing carousels

---

## Images

**Hero Section** (Organizer Dashboard):
- Large hero image of crowded venue/concert (70vh height), dark gradient overlay (bottom-to-top), live event stats overlaid on blur region
- Use striking concert/event photography showing crowd energy and scale

**Spectator App** (Home Screen):
- Background: Subtle venue-specific branded pattern or low-opacity event photo
- Ticket card: Include small venue thumbnail in header

**Map Views**:
- Satellite/hybrid map tiles for parking navigation
- Illustrated venue floor plan for indoor wayfinding
- Custom markers: Icon-based (parking, entrance, stage, restroom, medical)

**Empty States**:
- Illustrations for "No Active Events", "Parking Full", "No Notifications" - clean line-art style, branded color accents

---

## Role-Specific Adaptations

**Spectators**: Consumer-friendly, large touch targets (min 44px), simplified navigation, visual ticket prominence
**Staff/Volunteers**: Dense information display, quick-access controls, badge verification UI
**Organizers**: Analytics dashboards, multi-view layouts, export/report generation tools