import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  events, tickets, venueZones, parkingLots, notifications, aiRecommendations, userRoles, venues, ticketCategories,
  type Event, type InsertEvent,
  type Ticket, type InsertTicket,
  type VenueZone, type InsertVenueZone,
  type ParkingLot, type InsertParkingLot,
  type Notification, type InsertNotification,
  type AiRecommendation, type InsertAiRecommendation,
  type UserRole, type InsertUserRole,
  type Venue, type InsertVenue,
  type TicketCategory, type InsertTicketCategory,
} from "@shared/schema";
import { users, type User, type UpsertUser } from "@shared/models/auth";

export interface IStorage {
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined>;
  getActiveEvents(): Promise<Event[]>;

  getVenues(): Promise<Venue[]>;
  getVenue(id: number): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: number, data: Partial<InsertVenue>): Promise<Venue | undefined>;

  getTicketCategoriesByEvent(eventId: number): Promise<TicketCategory[]>;
  createTicketCategory(cat: InsertTicketCategory): Promise<TicketCategory>;
  updateTicketCategorySold(id: number, sold: number): Promise<TicketCategory | undefined>;
  updateTicketCategory(id: number, data: Partial<InsertTicketCategory>): Promise<TicketCategory | undefined>;

  getTicketsByEvent(eventId: number): Promise<Ticket[]>;
  getTicketsByUser(userId: string): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketByCode(code: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicketStatus(id: number, status: string, scannedBy?: string): Promise<Ticket | undefined>;
  upgradeTicket(id: number, newCategory: string, newPrice: number): Promise<Ticket | undefined>;
  getTicketStats(eventId: number): Promise<{ total: number; valid: number; used: number; invalid: number; pending: number }>;

  getZonesByEvent(eventId: number): Promise<VenueZone[]>;
  createVenueZone(zone: InsertVenueZone): Promise<VenueZone>;
  updateZoneOccupancy(id: number, occupancy: number): Promise<VenueZone | undefined>;

  getParkingByEvent(eventId: number): Promise<ParkingLot[]>;
  createParkingLot(lot: InsertParkingLot): Promise<ParkingLot>;
  updateParkingOccupancy(id: number, occupied: number): Promise<ParkingLot | undefined>;
  updateParkingStatus(id: number, status: string): Promise<ParkingLot | undefined>;

  getNotificationsByEvent(eventId: number, role?: string): Promise<Notification[]>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification | undefined>;

  getUserRoles(userId: string): Promise<UserRole[]>;
  getUserRoleForEvent(userId: string, eventId: number): Promise<UserRole | undefined>;
  setUserRole(userRole: InsertUserRole): Promise<UserRole>;

  getRecommendations(eventId: number): Promise<AiRecommendation[]>;
  createRecommendation(rec: InsertAiRecommendation): Promise<AiRecommendation>;
  applyRecommendation(id: number): Promise<AiRecommendation | undefined>;
}

class DatabaseStorage implements IStorage {
  async getEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(desc(events.id));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event as any).returning();
    return created;
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set(data as any).where(eq(events.id, id)).returning();
    return updated;
  }

  async getActiveEvents(): Promise<Event[]> {
    return db.select().from(events).where(eq(events.status, "active")).orderBy(desc(events.date));
  }

  async getVenues(): Promise<Venue[]> {
    return db.select().from(venues);
  }

  async getVenue(id: number): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue;
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const [created] = await db.insert(venues).values(venue as any).returning();
    return created;
  }

  async updateVenue(id: number, data: Partial<InsertVenue>): Promise<Venue | undefined> {
    const [updated] = await db.update(venues).set(data as any).where(eq(venues.id, id)).returning();
    return updated;
  }

  async getTicketCategoriesByEvent(eventId: number): Promise<TicketCategory[]> {
    return db.select().from(ticketCategories).where(eq(ticketCategories.eventId, eventId));
  }

  async createTicketCategory(cat: InsertTicketCategory): Promise<TicketCategory> {
    const [created] = await db.insert(ticketCategories).values(cat as any).returning();
    return created;
  }

  async updateTicketCategorySold(id: number, sold: number): Promise<TicketCategory | undefined> {
    const [updated] = await db.update(ticketCategories).set({ sold }).where(eq(ticketCategories.id, id)).returning();
    return updated;
  }

  async updateTicketCategory(id: number, data: Partial<InsertTicketCategory>): Promise<TicketCategory | undefined> {
    const [updated] = await db.update(ticketCategories).set(data as any).where(eq(ticketCategories.id, id)).returning();
    return updated;
  }

  async getTicketsByEvent(eventId: number): Promise<Ticket[]> {
    return db.select().from(tickets).where(eq(tickets.eventId, eventId));
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    return db.select().from(tickets).where(eq(tickets.userId, userId));
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async getTicketByCode(code: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketCode, code));
    return ticket;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [created] = await db.insert(tickets).values(ticket as any).returning();
    return created;
  }

  async updateTicketStatus(id: number, status: string, scannedBy?: string): Promise<Ticket | undefined> {
    const updateData: any = { status, scannedAt: new Date() };
    if (scannedBy) updateData.scannedBy = scannedBy;
    const [updated] = await db.update(tickets).set(updateData).where(eq(tickets.id, id)).returning();
    return updated;
  }

  async upgradeTicket(id: number, newCategory: string, newPrice: number): Promise<Ticket | undefined> {
    const [updated] = await db.update(tickets)
      .set({ category: newCategory, price: newPrice } as any)
      .where(eq(tickets.id, id))
      .returning();
    return updated;
  }

  async getTicketStats(eventId: number): Promise<{ total: number; valid: number; used: number; invalid: number; pending: number }> {
    const allTickets = await db.select().from(tickets).where(eq(tickets.eventId, eventId));
    return {
      total: allTickets.length,
      valid: allTickets.filter(t => t.status === "valid").length,
      used: allTickets.filter(t => t.status === "used").length,
      invalid: allTickets.filter(t => t.status === "invalid").length,
      pending: allTickets.filter(t => t.status === "pending").length,
    };
  }

  async getZonesByEvent(eventId: number): Promise<VenueZone[]> {
    return db.select().from(venueZones).where(eq(venueZones.eventId, eventId));
  }

  async createVenueZone(zone: InsertVenueZone): Promise<VenueZone> {
    const [created] = await db.insert(venueZones).values(zone as any).returning();
    return created;
  }

  async updateZoneOccupancy(id: number, occupancy: number): Promise<VenueZone | undefined> {
    const [updated] = await db.update(venueZones).set({ currentOccupancy: occupancy }).where(eq(venueZones.id, id)).returning();
    return updated;
  }

  async getParkingByEvent(eventId: number): Promise<ParkingLot[]> {
    return db.select().from(parkingLots).where(eq(parkingLots.eventId, eventId));
  }

  async createParkingLot(lot: InsertParkingLot): Promise<ParkingLot> {
    const [created] = await db.insert(parkingLots).values(lot as any).returning();
    return created;
  }

  async updateParkingOccupancy(id: number, occupied: number): Promise<ParkingLot | undefined> {
    const [updated] = await db.update(parkingLots).set({ occupied }).where(eq(parkingLots.id, id)).returning();
    return updated;
  }

  async updateParkingStatus(id: number, status: string): Promise<ParkingLot | undefined> {
    const [updated] = await db.update(parkingLots).set({ status } as any).where(eq(parkingLots.id, id)).returning();
    return updated;
  }

  async getNotificationsByEvent(eventId: number, role?: string): Promise<Notification[]> {
    if (role) {
      return db.select().from(notifications)
        .where(and(eq(notifications.eventId, eventId), eq(notifications.targetRole, role)))
        .orderBy(desc(notifications.createdAt));
    }
    return db.select().from(notifications)
      .where(eq(notifications.eventId, eventId))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification as any).returning();
    return created;
  }

  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return db.select().from(userRoles).where(eq(userRoles.userId, userId));
  }

  async getUserRoleForEvent(userId: string, eventId: number): Promise<UserRole | undefined> {
    const [role] = await db.select().from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.eventId, eventId)));
    return role;
  }

  async setUserRole(userRole: InsertUserRole): Promise<UserRole> {
    if (userRole.eventId) {
      const existing = await this.getUserRoleForEvent(userRole.userId, userRole.eventId);
      if (existing) {
        const [updated] = await db.update(userRoles).set({ role: userRole.role } as any)
          .where(eq(userRoles.id, existing.id)).returning();
        return updated;
      }
    }
    const [created] = await db.insert(userRoles).values(userRole as any).returning();
    return created;
  }

  async getRecommendations(eventId: number): Promise<AiRecommendation[]> {
    return db.select().from(aiRecommendations)
      .where(eq(aiRecommendations.eventId, eventId))
      .orderBy(desc(aiRecommendations.createdAt));
  }

  async createRecommendation(rec: InsertAiRecommendation): Promise<AiRecommendation> {
    const [created] = await db.insert(aiRecommendations).values(rec as any).returning();
    return created;
  }

  async applyRecommendation(id: number): Promise<AiRecommendation | undefined> {
    const [updated] = await db.update(aiRecommendations).set({ applied: true }).where(eq(aiRecommendations.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
