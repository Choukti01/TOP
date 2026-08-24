import { Router, type RequestHandler } from "express";
import { z } from "zod";

import { AuthError, AuthService, type AuthenticatedUser } from "../auth/service.js";

const registerInput = z.object({
  email: z.string().trim().email().max(254),
  displayName: z.string().trim().min(2).max(48),
  password: z.string().min(10).max(128)
}).strict();

const loginInput = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
}).strict();

const profileInput = z.object({
  displayName: z.string().trim().min(2).max(48).optional(),
  biography: z.string().trim().max(500).nullable().optional(),
  location: z.string().trim().max(80).nullable().optional()
}).strict().refine((input) => Object.keys(input).length > 0, "Choose something to update.");

export function createAuthRouter(auth: AuthService): Router {
  const router = Router();

  router.post("/register", async (request, response) => {
    const parsed = registerInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Use a valid email, your name, and a password of at least 10 characters." });

    try {
      const result = await auth.register(parsed.data);
      response.setHeader("Set-Cookie", result.cookie);
      return response.status(201).json({ user: result.user });
    } catch (error) {
      if (error instanceof AuthError && error.code === "duplicate-email") return response.status(409).json({ error: error.message });
      throw error;
    }
  });

  router.post("/login", async (request, response) => {
    const parsed = loginInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Enter the email and password for your TOP account." });

    try {
      const result = await auth.login({ ...parsed.data, fingerprint: request.ip ?? "unknown" });
      response.setHeader("Set-Cookie", result.cookie);
      return response.status(200).json({ user: result.user });
    } catch (error) {
      if (error instanceof AuthError) return response.status(401).json({ error: "Email or password is not correct." });
      throw error;
    }
  });

  router.get("/session", requireAuthenticatedUser(auth), (_request, response) => {
    return response.status(200).json({ user: currentUser(response) });
  });

  router.post("/logout", async (request, response) => {
    response.setHeader("Set-Cookie", await auth.logout(request.headers.cookie));
    return response.status(204).send();
  });

  router.patch("/profile", requireAuthenticatedUser(auth), async (request, response) => {
    const parsed = profileInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Profile details need a little more clarity." });
    const user = await auth.updateProfile(currentUser(response).id, parsed.data);
    if (!user) return response.status(401).json({ error: "Your session has ended. Please sign in again." });
    return response.status(200).json({ user });
  });

  return router;
}

export function requireAuthenticatedUser(auth: AuthService): RequestHandler {
  return async (request, response, next) => {
    const user = await auth.currentUser(request.headers.cookie);
    if (!user) return response.status(401).json({ error: "Sign in to enter your personal TOP field." });
    response.locals.authUser = user;
    return next();
  };
}

export function currentUser(response: { locals: Record<string, unknown> }): AuthenticatedUser {
  return response.locals.authUser as AuthenticatedUser;
}
