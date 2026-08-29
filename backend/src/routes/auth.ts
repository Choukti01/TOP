import { Router, type RequestHandler } from "express";
import { z } from "zod";

import type { AppConfig } from "../config/env.js";
import { GoogleOAuthError, GoogleOAuthService } from "../auth/googleOAuth.js";
import { AuthError, AuthService, type AuthenticatedUser } from "../auth/service.js";
import { createRateLimit } from "../security/rateLimit.js";

const registerInput = z.object({
  email: z.string().trim().email().max(254),
  displayName: z.string().trim().min(2).max(48),
  password: z.string().min(12).max(128)
}).strict();

const loginInput = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
}).strict();

const actionTokenInput = z.object({ token: z.string().min(32).max(512) }).strict();
const passwordResetRequestInput = z.object({ email: z.string().trim().email().max(254) }).strict();
const passwordResetConfirmInput = z.object({ token: z.string().min(32).max(512), password: z.string().min(12).max(128) }).strict();
const changeEmailInput = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) }).strict();

const profileInput = z.object({
  displayName: z.string().trim().min(2).max(48).optional(),
  biography: z.string().trim().max(500).nullable().optional(),
  location: z.string().trim().max(80).nullable().optional(),
  fieldName: z.string().trim().min(2).max(48).nullable().optional(),
  avatarDataUrl: z.string().regex(/^data:image\/(png|jpeg|webp);base64,/).max(500_000).nullable().optional()
}).strict().refine((input) => Object.keys(input).length > 0, "Choose something to update.");

export function createAuthRouter(auth: AuthService, config: AppConfig): Router {
  const router = Router();
  const google = new GoogleOAuthService(config);
  const registerLimit = createRateLimit({ scope: "register", limit: 5, windowMs: 60 * 60 * 1000 });
  const loginLimit = createRateLimit({ scope: "login", limit: 12, windowMs: 15 * 60 * 1000 });
  const resetLimit = createRateLimit({ scope: "password-reset", limit: 5, windowMs: 60 * 60 * 1000 });
  const verificationLimit = createRateLimit({ scope: "email-verification", limit: 5, windowMs: 60 * 60 * 1000 });

  router.get("/providers", (_request, response) => response.status(200).json({ google: google.enabled }));

  router.get("/google/start", (request, response) => {
    try {
      const next = safeNext(request.query.next);
      const started = google.begin(next);
      response.setHeader("Set-Cookie", started.cookie);
      return response.redirect(302, started.authorizationUrl);
    } catch (error) {
      return response.redirect(302, joinUrl(config, { google: googleErrorCode(error), next: safeNext(request.query.next) }));
    }
  });

  router.get("/google/callback", async (request, response) => {
    try {
      const completed = await google.complete({
        code: typeof request.query.code === "string" ? request.query.code : undefined,
        state: typeof request.query.state === "string" ? request.query.state : undefined,
        error: typeof request.query.error === "string" ? request.query.error : undefined,
        cookieHeader: request.headers.cookie
      });
      const result = await auth.signInWithGoogle(completed.identity);
      response.setHeader("Set-Cookie", [result.cookie, completed.clearCookie]);
      return response.redirect(302, joinUrl(config, { google: "success", next: completed.next, fresh: result.isNew }));
    } catch (error) {
      response.setHeader("Set-Cookie", google.clearCookie());
      return response.redirect(302, joinUrl(config, { google: googleErrorCode(error), next: safeNext(request.query.next) }));
    }
  });

  router.post("/register", registerLimit, async (request, response) => {
    const parsed = registerInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Use a valid email, your name, and a password of at least 12 characters." });

    try {
      const result = await auth.register(parsed.data);
      response.setHeader("Set-Cookie", result.cookie);
      return response.status(201).json({
        user: result.user,
        message: "Your TOP account is ready. Check your email to verify it.",
        verificationDelivery: result.verification.delivery,
        ...(result.verification.developmentActionUrl ? { developmentActionUrl: result.verification.developmentActionUrl } : {})
      });
    } catch (error) {
      if (error instanceof AuthError && error.code === "duplicate-email") return response.status(409).json({ error: error.message });
      throw error;
    }
  });

  router.post("/login", loginLimit, async (request, response) => {
    const parsed = loginInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Enter the email and password for your TOP account." });

    try {
      const result = await auth.login({ ...parsed.data, fingerprint: request.ip ?? "unknown" });
      response.setHeader("Set-Cookie", result.cookie);
      return response.status(200).json({ user: result.user });
    } catch (error) {
      if (error instanceof AuthError && error.code === "too-many-attempts") {
        response.setHeader("Retry-After", "900");
        return response.status(429).json({ error: error.message });
      }
      if (error instanceof AuthError) return response.status(401).json({ error: "Email or password is not correct." });
      throw error;
    }
  });

  router.post("/email-verification/confirm", verificationLimit, async (request, response) => {
    const parsed = actionTokenInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "That verification link is not valid." });
    const user = await auth.verifyEmail(parsed.data.token);
    if (!user) return response.status(400).json({ error: "That verification link is invalid or has expired. Request a new one and try again." });
    return response.status(200).json({ user, message: "Your email is verified. Your TOP account is more secure now." });
  });

  router.post("/email-verification/resend", requireAuthenticatedUser(auth), verificationLimit, async (_request, response) => {
    const result = await auth.resendVerification(currentUser(response).id);
    if (!result) return response.status(200).json({ message: "This TOP account is already verified." });
    return response.status(202).json({
      message: "A fresh verification link is on its way to your email.",
      verificationDelivery: result.delivery,
      ...(result.developmentActionUrl ? { developmentActionUrl: result.developmentActionUrl } : {})
    });
  });

  router.post("/email-verification/change-email", requireAuthenticatedUser(auth), verificationLimit, async (request, response) => {
    const parsed = changeEmailInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Enter a valid email and your current password." });
    try {
      const result = await auth.changeUnverifiedEmail(currentUser(response).id, parsed.data.password, parsed.data.email);
      return response.status(200).json({
        user: result.user,
        message: "Your email was updated. Check the new inbox for a fresh verification link.",
        verificationDelivery: result.verification.delivery,
        ...(result.verification.developmentActionUrl ? { developmentActionUrl: result.verification.developmentActionUrl } : {})
      });
    } catch (error) {
      if (error instanceof AuthError && error.code === "duplicate-email") return response.status(409).json({ error: error.message });
      if (error instanceof AuthError && error.code === "email-already-verified") return response.status(409).json({ error: error.message });
      if (error instanceof AuthError) return response.status(401).json({ error: "Your password is not correct." });
      throw error;
    }
  });

  router.post("/password-reset/request", resetLimit, async (request, response) => {
    const parsed = passwordResetRequestInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Enter the email address for your TOP account." });
    const result = await auth.requestPasswordReset(parsed.data.email);
    // This response intentionally stays the same whether or not the account exists.
    return response.status(202).json({
      message: "If a TOP account uses that email, a secure reset link is on its way.",
      ...(result?.developmentActionUrl ? { developmentActionUrl: result.developmentActionUrl } : {})
    });
  });

  router.post("/password-reset/confirm", resetLimit, async (request, response) => {
    const parsed = passwordResetConfirmInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Choose a new password with at least 12 characters." });
    try {
      await auth.resetPassword(parsed.data.token, parsed.data.password);
      return response.status(200).json({ message: "Your password is reset. Sign in with your new password." });
    } catch (error) {
      if (error instanceof AuthError && error.code === "invalid-action") return response.status(400).json({ error: error.message });
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

export function requireVerifiedUser(auth: AuthService): RequestHandler {
  return async (request, response, next) => {
    const user = await auth.currentUser(request.headers.cookie);
    if (!user) return response.status(401).json({ error: "Sign in to enter your personal TOP field." });
    if (!user.emailVerified) return response.status(403).json({ error: "Verify your email before publishing, collaborating, or entering your field.", code: "email-verification-required" });
    response.locals.authUser = user;
    return next();
  };
}

export function currentUser(response: { locals: Record<string, unknown> }): AuthenticatedUser {
  return response.locals.authUser as AuthenticatedUser;
}

function safeNext(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/top";
}

function joinUrl(config: Pick<AppConfig, "publicAppUrl">, input: { google: string; next: string; fresh?: boolean }): string {
  const base = config.publicAppUrl?.endsWith("/") ? config.publicAppUrl : `${config.publicAppUrl ?? "http://localhost:5173"}/`;
  const url = new URL("join", base);
  url.searchParams.set("google", input.google);
  url.searchParams.set("next", input.next);
  if (input.fresh) url.searchParams.set("fresh", "1");
  return url.toString();
}

function googleErrorCode(error: unknown): string {
  return error instanceof GoogleOAuthError ? error.code : "failed";
}
