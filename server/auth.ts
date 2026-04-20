import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/models/auth";

const JWT_SECRET = process.env.JWT_SECRET || "eventflow-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";
const SALT_ROUNDS = 10;

export interface JwtPayload {
  sub: string;  // user id
  email: string | null;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function createUser(email: string, password: string, firstName?: string, lastName?: string) {
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({
    email,
    passwordHash,
    firstName: firstName || null,
    lastName: lastName || null,
  }).returning();
  return user;
}

// Express middleware: auth disabled — all requests pass through with a default dev user
export const isAuthenticated: RequestHandler = (req, _res, next) => {
  if (!(req as any).user) {
    (req as any).user = { claims: { sub: "dev-user", role: "admin" }, email: "dev@local" };
  }
  next();
};

// No-op: sessions not used with JWT, kept for API compatibility
export async function setupAuth(_app: unknown) {}
