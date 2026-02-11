export * from "./models/auth";

import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, boolean, timestamp, varchar, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("Moldova"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  venue: text("venue").notNull(),
  venueId: integer("venue_id").references(() => venues.id),
  status: text("status").notNull().$type<"draft" | "active" | "completed" | "cancelled">(),
  createdBy: varchar("created_by").references(() => users.id),
  maxCapacity: integer("max_capacity").notNull(),
  currentAttendance: integer("current_attendance").default(0),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().$type<"spectator" | "staff" | "organizer">(),
  eventId: integer("event_id").references(() => events.id),
});

export const ticketCategories = pgTable("ticket_categories", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  name: text("name").notNull().$type<"Main" | "Tribuna" | "VIP">(),
  price: doublePrecision("price").notNull(),
  capacity: integer("capacity").notNull(),
  sold: integer("sold").default(0),
  color: text("color").default("#6366f1"),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketCode: text("ticket_code").unique().notNull(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  zone: text("zone").notNull(),
  seat: text("seat"),
  category: text("category").notNull().$type<"Main" | "Tribuna" | "VIP">().default("Main"),
  price: doublePrecision("price").default(0),
  status: text("status").notNull().$type<"valid" | "used" | "invalid" | "pending">(),
  purchasedAt: timestamp("purchased_at").defaultNow(),
  scannedAt: timestamp("scanned_at"),
  scannedBy: varchar("scanned_by").references(() => users.id),
});

export const venueZones = pgTable("venue_zones", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().$type<"stage" | "entrance" | "parking" | "seating" | "facilities">(),
  capacity: integer("capacity").notNull(),
  currentOccupancy: integer("current_occupancy").default(0),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
});

export const parkingLots = pgTable("parking_lots", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  occupied: integer("occupied").default(0),
  status: text("status").notNull().$type<"open" | "closed" | "full">(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  type: text("type").notNull().$type<"info" | "warning" | "success" | "alert">(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  targetRole: text("target_role"),
  createdAt: timestamp("created_at").defaultNow(),
  read: boolean("read").default(false),
  userId: varchar("user_id").references(() => users.id),
});

export const aiRecommendations = pgTable("ai_recommendations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  recommendation: text("recommendation").notNull(),
  type: text("type").notNull(),
  confidence: integer("confidence").notNull(),
  applied: boolean("applied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(userRoles),
  createdEvents: many(events),
  tickets: many(tickets, { relationName: "ticketOwner" }),
  scannedTickets: many(tickets, { relationName: "ticketScanner" }),
  notifications: many(notifications),
}));

export const venuesRelations = relations(venues, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, { fields: [events.createdBy], references: [users.id] }),
  venueRef: one(venues, { fields: [events.venueId], references: [venues.id] }),
  tickets: many(tickets),
  ticketCategories: many(ticketCategories),
  venueZones: many(venueZones),
  parkingLots: many(parkingLots),
  notifications: many(notifications),
  aiRecommendations: many(aiRecommendations),
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  event: one(events, { fields: [userRoles.eventId], references: [events.id] }),
}));

export const ticketCategoriesRelations = relations(ticketCategories, ({ one }) => ({
  event: one(events, { fields: [ticketCategories.eventId], references: [events.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  event: one(events, { fields: [tickets.eventId], references: [events.id] }),
  user: one(users, { fields: [tickets.userId], references: [users.id], relationName: "ticketOwner" }),
  scanner: one(users, { fields: [tickets.scannedBy], references: [users.id], relationName: "ticketScanner" }),
}));

export const venueZonesRelations = relations(venueZones, ({ one }) => ({
  event: one(events, { fields: [venueZones.eventId], references: [events.id] }),
}));

export const parkingLotsRelations = relations(parkingLots, ({ one }) => ({
  event: one(events, { fields: [parkingLots.eventId], references: [events.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  event: one(events, { fields: [notifications.eventId], references: [events.id] }),
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const aiRecommendationsRelations = relations(aiRecommendations, ({ one }) => ({
  event: one(events, { fields: [aiRecommendations.eventId], references: [events.id] }),
}));

export const insertVenueSchema = createInsertSchema(venues).omit({ id: true });
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venues.$inferSelect;

export const insertEventSchema = createInsertSchema(events).omit({ id: true, currentAttendance: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true });
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;

export const insertTicketCategorySchema = createInsertSchema(ticketCategories).omit({ id: true, sold: true });
export type InsertTicketCategory = z.infer<typeof insertTicketCategorySchema>;
export type TicketCategory = typeof ticketCategories.$inferSelect;

export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, purchasedAt: true, scannedAt: true });
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

export const insertVenueZoneSchema = createInsertSchema(venueZones).omit({ id: true, currentOccupancy: true });
export type InsertVenueZone = z.infer<typeof insertVenueZoneSchema>;
export type VenueZone = typeof venueZones.$inferSelect;

export const insertParkingLotSchema = createInsertSchema(parkingLots).omit({ id: true, occupied: true });
export type InsertParkingLot = z.infer<typeof insertParkingLotSchema>;
export type ParkingLot = typeof parkingLots.$inferSelect;

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, read: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({ id: true, applied: true, createdAt: true });
export type InsertAiRecommendation = z.infer<typeof insertAiRecommendationSchema>;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;
