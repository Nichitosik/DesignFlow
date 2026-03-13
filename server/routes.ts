import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import {
  insertEventSchema,
  insertTicketSchema,
  insertVenueZoneSchema,
  insertParkingLotSchema,
  insertNotificationSchema,
  insertUserRoleSchema,
  insertVenueSchema,
  insertTicketCategorySchema,
} from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const clients = new Map<WebSocket, { eventId?: number; role?: string }>();

export function broadcast(eventId: number, data: any) {
  clients.forEach((info, client) => {
    if (info.eventId === eventId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function requireRole(...allowedRoles: string[]) {
  return async (req: any, res: any, next: any) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = req.user.claims.sub;
      const roles = await storage.getUserRoles(userId);
      const hasRole = roles.some(r => allowedRoles.includes(r.role));
      if (!hasRole) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization check failed" });
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // Events
  app.get("/api/events", async (_req, res) => {
    try {
      const allEvents = await storage.getEvents();
      res.json(allEvents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(Number(req.params.id));
      if (!event) return res.status(404).json({ message: "Event not found" });
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", isAuthenticated, requireRole("organizer"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roles = await storage.getUserRoles(userId);
      const isOrganizer = roles.some(r => r.role === "organizer");
      if (!isOrganizer) return res.status(403).json({ message: "Only organizers can create events" });

      const parsed = insertEventSchema.parse({ ...req.body, createdBy: userId });
      const event = await storage.createEvent(parsed);
      res.status(201).json(event);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Validation error", errors: error.errors });
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", isAuthenticated, requireRole("organizer"), async (req, res) => {
    try {
      const event = await storage.updateEvent(Number(req.params.id), req.body);
      if (!event) return res.status(404).json({ message: "Event not found" });
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  // Venues
  app.get("/api/venues", async (_req, res) => {
    try {
      const allVenues = await storage.getVenues();
      res.json(allVenues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch venues" });
    }
  });

  app.post("/api/venues", isAuthenticated, requireRole("organizer"), async (req, res) => {
    try {
      const parsed = insertVenueSchema.parse(req.body);
      const venue = await storage.createVenue(parsed);
      res.status(201).json(venue);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Validation error", errors: error.errors });
      res.status(500).json({ message: "Failed to create venue" });
    }
  });

  app.patch("/api/venues/:id", isAuthenticated, requireRole("organizer"), async (req, res) => {
    try {
      const venue = await storage.updateVenue(Number(req.params.id), req.body);
      if (!venue) return res.status(404).json({ message: "Venue not found" });
      res.json(venue);
    } catch (error) {
      res.status(500).json({ message: "Failed to update venue" });
    }
  });

  // Ticket Categories
  app.get("/api/events/:eventId/ticket-categories", async (req, res) => {
    try {
      const cats = await storage.getTicketCategoriesByEvent(Number(req.params.eventId));
      res.json(cats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket categories" });
    }
  });

  app.post("/api/events/:eventId/ticket-categories", isAuthenticated, requireRole("organizer"), async (req, res) => {
    try {
      const parsed = insertTicketCategorySchema.parse({
        ...req.body,
        eventId: Number(req.params.eventId),
      });
      const cat = await storage.createTicketCategory(parsed);
      broadcast(cat.eventId, { type: "ticket_category_update", data: cat });
      res.status(201).json(cat);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Validation error", errors: error.errors });
      res.status(500).json({ message: "Failed to create ticket category" });
    }
  });

  app.patch("/api/events/:eventId/ticket-categories/:id", isAuthenticated, requireRole("organizer"), async (req, res) => {
    try {
      const { price, capacity } = req.body;
      const updateData: any = {};
      if (price !== undefined) updateData.price = Number(price);
      if (capacity !== undefined) updateData.capacity = Number(capacity);
      const cat = await storage.updateTicketCategory(Number(req.params.id), updateData);
      if (!cat) return res.status(404).json({ message: "Category not found" });
      broadcast(cat.eventId, { type: "ticket_category_update", data: cat });
      res.json(cat);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ticket category" });
    }
  });

  // Ticket Availability (public)
  app.get("/api/events/:eventId/ticket-availability", async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const cats = await storage.getTicketCategoriesByEvent(eventId);
      const availability = cats.map(cat => ({
        id: cat.id,
        name: cat.name,
        price: cat.price,
        capacity: cat.capacity,
        sold: cat.sold || 0,
        available: cat.capacity - (cat.sold || 0),
        color: cat.color,
      }));
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket availability" });
    }
  });

  // Tickets
  app.get("/api/events/:eventId/tickets", isAuthenticated, async (req, res) => {
    try {
      const ticketList = await storage.getTicketsByEvent(Number(req.params.eventId));
      res.json(ticketList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ticketList = await storage.getTicketsByUser(userId);
      res.json(ticketList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.post("/api/events/:eventId/tickets", isAuthenticated, async (req: any, res) => {
    try {
      const ticketCode = randomUUID();
      const userId = req.user.claims.sub;
      const eventId = Number(req.params.eventId);
      const { category = "Main" } = req.body;

      const cats = await storage.getTicketCategoriesByEvent(eventId);
      const cat = cats.find(c => c.name === category);
      if (!cat) return res.status(400).json({ message: "Ticket category not found" });

      const available = cat.capacity - (cat.sold || 0);
      if (available <= 0) return res.status(400).json({ message: "No tickets available in this category" });

      const zoneMap: Record<string, string> = { Main: "Main Area", Tribuna: "Tribune Section", VIP: "VIP Zone" };

      const parsed = insertTicketSchema.parse({
        ...req.body,
        eventId,
        userId,
        ticketCode,
        status: "valid",
        category,
        price: cat.price,
        zone: zoneMap[category] || "General",
      });
      const ticket = await storage.createTicket(parsed);

      await storage.updateTicketCategorySold(cat.id, (cat.sold || 0) + 1);

      broadcast(eventId, { type: "ticket_purchased", data: { ticket, category, price: cat.price } });

      res.status(201).json(ticket);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Validation error", errors: error.errors });
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  app.post("/api/tickets/:id/scan", isAuthenticated, requireRole("staff", "organizer"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ticket = await storage.getTicket(Number(req.params.id));
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });

      if (ticket.status === "used") return res.status(400).json({ message: "Ticket already used" });
      if (ticket.status === "invalid") return res.status(400).json({ message: "Ticket is invalid" });

      const updated = await storage.updateTicketStatus(ticket.id, "used", userId);

      if (updated) {
        broadcast(ticket.eventId, { type: "ticket_scanned", data: updated });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to scan ticket" });
    }
  });

  // Ticket Upgrade
  app.post("/api/tickets/:id/upgrade", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ticketId = Number(req.params.id);
      const { newCategory } = req.body;

      const ticket = await storage.getTicket(ticketId);
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });
      if (ticket.userId !== userId) return res.status(403).json({ message: "Not your ticket" });
      if (ticket.status !== "valid" && ticket.status !== "pending") {
        return res.status(400).json({ message: "Only valid or pending tickets can be upgraded" });
      }

      const cats = await storage.getTicketCategoriesByEvent(ticket.eventId);
      const oldCat = cats.find(c => c.name === ticket.category);
      const newCat = cats.find(c => c.name === newCategory);

      if (!newCat) return res.status(400).json({ message: "Invalid category" });
      if (newCat.name === ticket.category) return res.status(400).json({ message: "Already in this category" });

      const available = newCat.capacity - (newCat.sold || 0);
      if (available <= 0) return res.status(400).json({ message: "No tickets available in this category" });

      const oldPrice = oldCat ? oldCat.price : (ticket.price || 0);
      const priceDifference = newCat.price - oldPrice;

      const upgraded = await storage.upgradeTicket(ticketId, newCategory, newCat.price);

      if (oldCat) {
        await storage.updateTicketCategorySold(oldCat.id, Math.max(0, (oldCat.sold || 0) - 1));
      }
      await storage.updateTicketCategorySold(newCat.id, (newCat.sold || 0) + 1);

      if (upgraded) {
        broadcast(ticket.eventId, {
          type: "ticket_upgraded",
          data: { ticket: upgraded, oldCategory: ticket.category, newCategory, priceDifference },
        });
      }

      res.json({ ticket: upgraded, priceDifference });
    } catch (error) {
      res.status(500).json({ message: "Failed to upgrade ticket" });
    }
  });

  // Venue Zones
  app.get("/api/events/:eventId/zones", async (req, res) => {
    try {
      const zones = await storage.getZonesByEvent(Number(req.params.eventId));
      res.json(zones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch zones" });
    }
  });

  app.post("/api/events/:eventId/zones", isAuthenticated, requireRole("organizer"), async (req, res) => {
    try {
      const parsed = insertVenueZoneSchema.parse({
        ...req.body,
        eventId: Number(req.params.eventId),
      });
      const zone = await storage.createVenueZone(parsed);
      res.status(201).json(zone);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Validation error", errors: error.errors });
      res.status(500).json({ message: "Failed to create zone" });
    }
  });

  app.patch("/api/zones/:id/occupancy", isAuthenticated, requireRole("staff", "organizer"), async (req, res) => {
    try {
      const { occupancy } = req.body;
      const zone = await storage.updateZoneOccupancy(Number(req.params.id), occupancy);
      if (!zone) return res.status(404).json({ message: "Zone not found" });

      broadcast(zone.eventId, { type: "zone_update", data: zone });
      res.json(zone);
    } catch (error) {
      res.status(500).json({ message: "Failed to update zone occupancy" });
    }
  });

  // Parking
  app.get("/api/events/:eventId/parking", async (req, res) => {
    try {
      const lots = await storage.getParkingByEvent(Number(req.params.eventId));
      res.json(lots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parking" });
    }
  });

  app.post("/api/events/:eventId/parking", isAuthenticated, requireRole("organizer"), async (req, res) => {
    try {
      const parsed = insertParkingLotSchema.parse({
        ...req.body,
        eventId: Number(req.params.eventId),
      });
      const lot = await storage.createParkingLot(parsed);
      res.status(201).json(lot);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Validation error", errors: error.errors });
      res.status(500).json({ message: "Failed to create parking lot" });
    }
  });

  app.patch("/api/parking/:id", isAuthenticated, requireRole("staff", "organizer"), async (req, res) => {
    try {
      const { occupied, status } = req.body;
      let lot;
      if (occupied !== undefined) {
        lot = await storage.updateParkingOccupancy(Number(req.params.id), occupied);
      }
      if (status !== undefined) {
        lot = await storage.updateParkingStatus(Number(req.params.id), status);
      }
      if (!lot) return res.status(404).json({ message: "Parking lot not found" });

      broadcast(lot.eventId, { type: "parking_update", data: lot });
      res.json(lot);
    } catch (error) {
      res.status(500).json({ message: "Failed to update parking" });
    }
  });

  // Notifications
  app.get("/api/events/:eventId/notifications", isAuthenticated, async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      const notifs = await storage.getNotificationsByEvent(Number(req.params.eventId), role);
      res.json(notifs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifs = await storage.getNotificationsByUser(userId);
      res.json(notifs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/events/:eventId/notifications", isAuthenticated, requireRole("staff", "organizer"), async (req: any, res) => {
    try {
      const parsed = insertNotificationSchema.parse({
        ...req.body,
        eventId: Number(req.params.eventId),
      });
      const notification = await storage.createNotification(parsed);

      broadcast(notification.eventId, { type: "notification", data: notification });
      res.status(201).json(notification);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Validation error", errors: error.errors });
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(Number(req.params.id));
      if (!notification) return res.status(404).json({ message: "Notification not found" });
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // AI Recommendations
  app.get("/api/events/:eventId/recommendations", isAuthenticated, async (req, res) => {
    try {
      const recs = await storage.getRecommendations(Number(req.params.eventId));
      res.json(recs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/events/:eventId/recommendations/generate", isAuthenticated, requireRole("organizer"), async (req: any, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const event = await storage.getEvent(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const [zones, parking, ticketStats] = await Promise.all([
        storage.getZonesByEvent(eventId),
        storage.getParkingByEvent(eventId),
        storage.getTicketStats(eventId),
      ]);

      const prompt = `You are an AI crowd management advisor for entertainment venues. Analyze the following event data and provide actionable recommendations.

Event: ${event.name}
Venue: ${event.venue}
Max Capacity: ${event.maxCapacity}
Current Attendance: ${event.currentAttendance}

Zones:
${zones.map(z => `- ${z.name} (${z.type}): ${z.currentOccupancy}/${z.capacity}`).join("\n")}

Parking:
${parking.map(p => `- ${p.name}: ${p.occupied}/${p.capacity} (${p.status})`).join("\n")}

Ticket Stats:
- Total: ${ticketStats.total}, Valid: ${ticketStats.valid}, Used: ${ticketStats.used}, Pending: ${ticketStats.pending}

Provide 2-4 recommendations as a JSON object with this structure:
{
  "recommendations": [
    {
      "recommendation": "description of the recommendation",
      "type": "crowd_flow" | "safety" | "parking" | "capacity" | "general",
      "confidence": 1-100
    }
  ]
}`;

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are a crowd management AI assistant. Always respond with valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) return res.status(500).json({ message: "No response from AI" });

      const parsed = JSON.parse(content);
      const savedRecs = [];

      for (const rec of parsed.recommendations) {
        const saved = await storage.createRecommendation({
          eventId,
          recommendation: rec.recommendation,
          type: rec.type,
          confidence: rec.confidence,
        });
        savedRecs.push(saved);
      }

      res.status(201).json(savedRecs);
    } catch (error: any) {
      console.error("AI recommendation error:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.patch("/api/recommendations/:id/apply", isAuthenticated, async (req, res) => {
    try {
      const rec = await storage.applyRecommendation(Number(req.params.id));
      if (!rec) return res.status(404).json({ message: "Recommendation not found" });
      res.json(rec);
    } catch (error) {
      res.status(500).json({ message: "Failed to apply recommendation" });
    }
  });

  // User Roles
  app.get("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roles = await storage.getUserRoles(userId);
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user roles" });
    }
  });

  app.post("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertUserRoleSchema.parse({ ...req.body, userId });
      const role = await storage.setUserRole(parsed);
      res.status(201).json(role);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Validation error", errors: error.errors });
      res.status(500).json({ message: "Failed to set user role" });
    }
  });

  // Event Stats
  app.get("/api/events/:eventId/stats", isAuthenticated, async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const [event, ticketStats, zones, parking] = await Promise.all([
        storage.getEvent(eventId),
        storage.getTicketStats(eventId),
        storage.getZonesByEvent(eventId),
        storage.getParkingByEvent(eventId),
      ]);

      if (!event) return res.status(404).json({ message: "Event not found" });

      const totalZoneOccupancy = zones.reduce((sum, z) => sum + (z.currentOccupancy || 0), 0);
      const totalZoneCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
      const totalParkingOccupied = parking.reduce((sum, p) => sum + (p.occupied || 0), 0);
      const totalParkingCapacity = parking.reduce((sum, p) => sum + p.capacity, 0);

      res.json({
        event,
        tickets: ticketStats,
        zones: {
          totalOccupancy: totalZoneOccupancy,
          totalCapacity: totalZoneCapacity,
          occupancyRate: totalZoneCapacity > 0 ? Math.round((totalZoneOccupancy / totalZoneCapacity) * 100) : 0,
        },
        parking: {
          totalOccupied: totalParkingOccupied,
          totalCapacity: totalParkingCapacity,
          occupancyRate: totalParkingCapacity > 0 ? Math.round((totalParkingOccupied / totalParkingCapacity) * 100) : 0,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event stats" });
    }
  });

  // Scan ticket by code
  app.post("/api/tickets/scan", isAuthenticated, requireRole("staff", "organizer"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { ticketCode } = req.body;
      const ticket = await storage.getTicketByCode(ticketCode);
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });
      if (ticket.status === "used") return res.status(400).json({ message: "Ticket already used", ticket });
      if (ticket.status === "invalid") return res.status(400).json({ message: "Ticket is invalid", ticket });

      const updated = await storage.updateTicketStatus(ticket.id, "used", userId);
      if (updated) {
        broadcast(ticket.eventId, { type: "ticket_scanned", data: updated });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to scan ticket" });
    }
  });

  // Seed demo data
  app.post("/api/seed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      await storage.setUserRole({ userId, role: "organizer" });

      const venue = await storage.createVenue({
        name: "Chișinău Arena",
        address: "Strada Independenței 12",
        city: "Chișinău",
        country: "Moldova",
        latitude: 47.0245,
        longitude: 28.8322,
      });

      const event = await storage.createEvent({
        name: "Summer Music Festival 2025",
        description: "The biggest summer music event featuring top artists from around the world.",
        date: new Date("2025-08-15"),
        startTime: "18:00",
        endTime: "23:00",
        venue: "Chișinău Arena",
        venueId: venue.id,
        status: "active",
        createdBy: userId,
        maxCapacity: 10000,
      });

      const catMain = await storage.createTicketCategory({
        eventId: event.id, name: "Main", price: 50, capacity: 5000, color: "#6366f1",
      });
      const catTribuna = await storage.createTicketCategory({
        eventId: event.id, name: "Tribuna", price: 120, capacity: 2000, color: "#f59e0b",
      });
      const catVip = await storage.createTicketCategory({
        eventId: event.id, name: "VIP", price: 250, capacity: 500, color: "#ef4444",
      });

      const zoneData = [
        { eventId: event.id, name: "Main Stage", type: "stage" as const, capacity: 5000, x: 35, y: 10 },
        { eventId: event.id, name: "Entrance 1", type: "entrance" as const, capacity: 500, x: 5, y: 45 },
        { eventId: event.id, name: "Entrance 2", type: "entrance" as const, capacity: 500, x: 75, y: 45 },
        { eventId: event.id, name: "VIP Zone A", type: "seating" as const, capacity: 200, x: 10, y: 65 },
        { eventId: event.id, name: "General 1", type: "seating" as const, capacity: 3000, x: 70, y: 40 },
        { eventId: event.id, name: "Facilities", type: "facilities" as const, capacity: 300, x: 50, y: 80 },
      ];
      for (const z of zoneData) await storage.createVenueZone(z);

      const parkingData = [
        { eventId: event.id, name: "Parking Lot A", capacity: 800, status: "open" as const },
        { eventId: event.id, name: "Parking Lot B", capacity: 600, status: "open" as const },
        { eventId: event.id, name: "VIP Parking", capacity: 200, status: "open" as const },
      ];
      for (const p of parkingData) await storage.createParkingLot(p);

      const ticket = await storage.createTicket({
        ticketCode: randomUUID(),
        eventId: event.id,
        userId,
        zone: "VIP Zone A",
        seat: "Row 5, Seat 12",
        category: "Main",
        price: 50,
        status: "valid",
      });

      await storage.updateTicketCategorySold(catMain.id, 1);

      await storage.createNotification({
        eventId: event.id, type: "info", title: "Gates Opening Soon",
        message: "VIP gates will open in 30 minutes. Please arrive early.",
      });
      await storage.createNotification({
        eventId: event.id, type: "success", title: "Parking Available",
        message: "Parking Lot B has plenty of available spaces.",
      });

      res.json({ event, ticket, venue });
    } catch (error: any) {
      console.error("Seed error:", error);
      res.status(500).json({ message: "Failed to seed data", error: error.message });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    clients.set(ws, {});

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "subscribe") {
          clients.set(ws, { eventId: message.eventId, role: message.role });
        }
      } catch {
        // ignore invalid messages
      }
    });

    ws.on("close", () => clients.delete(ws));
  });

  return httpServer;
}
