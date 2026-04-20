import type { Express } from "express";
import { isAuthenticated, signToken, comparePassword, findUserByEmail, findUserById, createUser } from "../../auth";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function registerAuthRoutes(app: Express): void {
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const existing = await findUserByEmail(parsed.email);
      if (existing) {
        return res.status(409).json({ message: "Email already in use" });
      }
      const user = await createUser(parsed.email, parsed.password, parsed.firstName, parsed.lastName);
      const token = signToken({ sub: user.id, email: user.email ?? null });
      const { passwordHash: _pw, ...safeUser } = user;
      res.status(201).json({ token, user: safeUser });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const user = await findUserByEmail(parsed.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const valid = await comparePassword(parsed.password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const token = signToken({ sub: user.id, email: user.email ?? null });
      const { passwordHash: _pw, ...safeUser } = user;
      res.json({ token, user: safeUser });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await findUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { passwordHash: _pw, ...safeUser } = user;
      res.json(safeUser);
    } catch {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout (client-side only with JWT, but endpoint for compatibility)
  app.post("/api/auth/logout", (_req, res) => {
    res.json({ message: "Logged out" });
  });
}
