import { createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, isNull } from "drizzle-orm";

import type { AppConfig } from "../config/env.js";
import { createDatabase } from "../db/client.js";
import { accountActionTokens, authSessions, oauthIdentities, profiles, users } from "../db/schema.js";
import type { GoogleIdentity } from "./googleOAuth.js";
import { AccountEmailService, type AccountActionPurpose, type AccountEmailDelivery } from "../notifications/accountEmail.js";

const scrypt = promisify(scryptCallback);
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 7;
const verificationLifetimeMs = 1000 * 60 * 60 * 24;
const passwordResetLifetimeMs = 1000 * 60 * 30;

export interface AuthenticatedUser {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  biography: string | null;
  location: string | null;
  fieldName: string | null;
  avatarDataUrl: string | null;
  createdAt: string;
}

interface StoredUser extends AuthenticatedUser {
  passwordHash: string;
}

interface StoredSession {
  id: string;
  userId: string;
  expiresAt: number;
}

interface StoredActionToken {
  id: string;
  userId: string;
  purpose: AccountActionPurpose;
  expiresAt: number;
  usedAt: number | null;
}

export interface AccountActionResult {
  delivery: AccountEmailDelivery;
  // Only ever present outside production, so local development and API tests
  // can exercise the full account lifecycle without leaking live reset links.
  developmentActionUrl?: string;
}

export class AuthError extends Error {
  public constructor(public readonly code: "duplicate-email" | "invalid-credentials" | "too-many-attempts" | "invalid-action" | "email-already-verified") {
    super(authErrorMessage(code));
  }
}

export class AuthService {
  private readonly usersByEmail = new Map<string, StoredUser>();
  private readonly usersById = new Map<string, StoredUser>();
  private readonly sessions = new Map<string, StoredSession>();
  private readonly actionTokens = new Map<string, StoredActionToken>();
  private readonly oauthUserIds = new Map<string, string>();
  private readonly loginAttempts = new Map<string, number[]>();
  private readonly signingSecret: string;
  private readonly actionSecret: string;
  private readonly secureCookies: boolean;
  private readonly database: ReturnType<typeof createDatabase>["db"] | null;
  private readonly email: AccountEmailService;

  public constructor(private readonly config: Pick<AppConfig, "environment" | "sessionSecret" | "accountActionSecret" | "publicAppUrl" | "resendApiKey" | "emailFrom" | "databaseUrl" | "databaseEnabled">) {
    if (config.environment === "production" && (!config.sessionSecret || config.sessionSecret.length < 32)) {
      throw new Error("SESSION_SECRET must be at least 32 characters in production.");
    }

    this.signingSecret = config.sessionSecret ?? "top-local-development-session-secret-change-before-production";
    this.actionSecret = config.accountActionSecret ?? this.signingSecret;
    this.secureCookies = config.environment === "production";
    this.database = config.databaseUrl && config.databaseEnabled ? createDatabase(config).db : null;
    this.email = new AccountEmailService(config);
  }

  public async register(input: { email: string; password: string; displayName: string }): Promise<{ user: AuthenticatedUser; cookie: string; verification: AccountActionResult }> {
    const email = normalizeEmail(input.email);
    if (this.database) return this.registerWithDatabase({ ...input, email });
    if (this.usersByEmail.has(email)) throw new AuthError("duplicate-email");

    const now = new Date().toISOString();
    const user: StoredUser = {
      id: randomUUID(),
      email,
      emailVerified: false,
      displayName: input.displayName.trim(),
      biography: null,
      location: null,
      fieldName: null,
      avatarDataUrl: null,
      createdAt: now,
      passwordHash: await hashPassword(input.password)
    };

    this.usersByEmail.set(email, user);
    this.usersById.set(user.id, user);
    const verification = await this.issueAction(user, "verify-email");
    return { user: toPublicUser(user), cookie: await this.createSession(user.id), verification };
  }

  public async login(input: { email: string; password: string; fingerprint: string }): Promise<{ user: AuthenticatedUser; cookie: string }> {
    const email = normalizeEmail(input.email);
    this.assertLoginRate(input.fingerprint);
    if (this.database) return this.loginWithDatabase({ ...input, email });
    const user = this.usersByEmail.get(email);

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      this.recordFailedLogin(input.fingerprint);
      throw new AuthError("invalid-credentials");
    }

    this.loginAttempts.delete(input.fingerprint);
    return { user: toPublicUser(user), cookie: await this.createSession(user.id) };
  }

  // OAuth identities are linked to a TOP account by Google's stable subject
  // identifier, never by a browser-supplied email address alone.
  public async signInWithGoogle(identity: GoogleIdentity): Promise<{ user: AuthenticatedUser; cookie: string; isNew: boolean }> {
    if (this.database) return this.signInWithGoogleDatabase(identity);
    const key = `google:${identity.subject}`;
    const linkedUserId = this.oauthUserIds.get(key);
    let user = linkedUserId ? this.usersById.get(linkedUserId) : undefined;
    let isNew = false;

    if (!user) {
      user = this.usersByEmail.get(normalizeEmail(identity.email));
      if (!user) {
        const now = new Date().toISOString();
        user = {
          id: randomUUID(), email: normalizeEmail(identity.email), emailVerified: true,
          displayName: identity.displayName.trim() || identity.email.split("@")[0]!,
          biography: null, location: null, fieldName: null, avatarDataUrl: null, createdAt: now,
          passwordHash: await hashPassword(randomBytes(48).toString("base64url"))
        };
        this.usersByEmail.set(user.email, user);
        this.usersById.set(user.id, user);
        isNew = true;
      } else {
        user.emailVerified = true;
      }
      this.oauthUserIds.set(key, user.id);
    }

    return { user: toPublicUser(user), cookie: await this.createSession(user.id), isNew };
  }

  public async currentUser(cookieHeader: string | undefined): Promise<AuthenticatedUser | null> {
    const token = parseCookie(cookieHeader, "top_session");
    if (!token) return null;

    const [sessionId, expiresAtText, signature] = token.split(".");
    if (!sessionId || !expiresAtText || !signature || !this.isTokenSignatureValid(sessionId, expiresAtText, signature)) return null;

    const expiresAt = Number(expiresAtText);
    if (this.database) return this.currentDatabaseUser(sessionId, expiresAt);

    const session = this.sessions.get(sessionId);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || !session || session.expiresAt !== expiresAt) {
      if (sessionId) this.sessions.delete(sessionId);
      return null;
    }

    const user = this.usersById.get(session.userId);
    return user ? toPublicUser(user) : null;
  }

  public async logout(cookieHeader: string | undefined): Promise<string> {
    const token = parseCookie(cookieHeader, "top_session");
    const sessionId = token?.split(".")[0];
    if (sessionId && this.database) await this.database.delete(authSessions).where(eq(authSessions.id, sessionId));
    else if (sessionId) this.sessions.delete(sessionId);
    return this.serializeCookie("", 0);
  }

  public async updateProfile(userId: string, input: { displayName?: string; biography?: string | null; location?: string | null; fieldName?: string | null; avatarDataUrl?: string | null }): Promise<AuthenticatedUser | null> {
    if (this.database) return this.updateDatabaseProfile(userId, input);
    const user = this.usersById.get(userId);
    if (!user) return null;
    if (input.displayName !== undefined) user.displayName = input.displayName.trim();
    if (input.biography !== undefined) user.biography = input.biography;
    if (input.location !== undefined) user.location = input.location;
    if (input.fieldName !== undefined) user.fieldName = input.fieldName;
    if (input.avatarDataUrl !== undefined) user.avatarDataUrl = input.avatarDataUrl;
    return toPublicUser(user);
  }

  public async resendVerification(userId: string): Promise<AccountActionResult | null> {
    const user = await this.userById(userId);
    if (!user || user.emailVerified) return null;
    return this.issueAction(user, "verify-email");
  }

  // A person who mistyped an email while registering can correct it without
  // opening access to a verified account's login identity.
  public async changeUnverifiedEmail(userId: string, password: string, nextEmailInput: string): Promise<{ user: AuthenticatedUser; verification: AccountActionResult }> {
    const nextEmail = normalizeEmail(nextEmailInput);
    if (this.database) return this.changeUnverifiedEmailDatabase(userId, password, nextEmail);
    const user = this.usersById.get(userId);
    if (!user || !(await verifyPassword(password, user.passwordHash))) throw new AuthError("invalid-credentials");
    if (user.emailVerified) throw new AuthError("email-already-verified");
    const owner = this.usersByEmail.get(nextEmail);
    if (owner && owner.id !== userId) throw new AuthError("duplicate-email");
    this.usersByEmail.delete(user.email);
    user.email = nextEmail;
    this.usersByEmail.set(nextEmail, user);
    const publicUser = toPublicUser(user);
    return { user: publicUser, verification: await this.issueAction(publicUser, "verify-email") };
  }

  public async verifyEmail(rawToken: string): Promise<AuthenticatedUser | null> {
    const action = await this.consumeAction(rawToken, "verify-email");
    if (!action) return null;
    const now = new Date();
    if (this.database) {
      await this.database.update(users).set({ emailVerifiedAt: now, updatedAt: now }).where(eq(users.id, action.userId));
    } else {
      const user = this.usersById.get(action.userId);
      if (user) user.emailVerified = true;
    }
    return this.userById(action.userId);
  }

  public async requestPasswordReset(emailInput: string): Promise<AccountActionResult | null> {
    const user = await this.userByEmail(normalizeEmail(emailInput));
    // Returning null outward is intentional: this endpoint must never reveal
    // whether a particular address belongs to a TOP account.
    return user ? this.issueAction(user, "password-reset") : null;
  }

  public async resetPassword(rawToken: string, password: string): Promise<void> {
    const action = await this.consumeAction(rawToken, "password-reset");
    if (!action) throw new AuthError("invalid-action");
    const now = new Date();
    const passwordHash = await hashPassword(password);
    if (this.database) {
      await this.database.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, action.userId));
      // A password reset revokes every browser session, including a stolen one.
      await this.database.delete(authSessions).where(eq(authSessions.userId, action.userId));
    } else {
      const user = this.usersById.get(action.userId);
      if (!user) throw new AuthError("invalid-action");
      user.passwordHash = passwordHash;
      for (const [id, session] of this.sessions) if (session.userId === action.userId) this.sessions.delete(id);
    }
  }

  private async createSession(userId: string): Promise<string> {
    this.removeExpiredSessions();
    const id = randomUUID();
    const expiresAt = Date.now() + sessionLifetimeMs;
    if (this.database) await this.database.insert(authSessions).values({ id, userId, expiresAt: new Date(expiresAt), createdAt: new Date() });
    else this.sessions.set(id, { id, userId, expiresAt });
    const signature = this.sign(`${id}.${expiresAt}`);
    return this.serializeCookie(`${id}.${expiresAt}.${signature}`, Math.floor(sessionLifetimeMs / 1000));
  }

  private serializeCookie(value: string, maxAge: number): string {
    const secure = this.secureCookies ? "; Secure" : "";
    return `top_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
  }

  private sign(value: string): string {
    return createHmac("sha256", this.signingSecret).update(value).digest("base64url");
  }

  private hashActionToken(rawToken: string): string {
    return createHmac("sha256", this.actionSecret).update(rawToken).digest("base64url");
  }

  private isTokenSignatureValid(sessionId: string, expiresAt: string, signature: string): boolean {
    const expected = this.sign(`${sessionId}.${expiresAt}`);
    const receivedBytes = Buffer.from(signature);
    const expectedBytes = Buffer.from(expected);
    return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
  }

  private assertLoginRate(fingerprint: string): void {
    const now = Date.now();
    const attempts = (this.loginAttempts.get(fingerprint) ?? []).filter((attempt) => now - attempt < 15 * 60 * 1000);
    this.loginAttempts.set(fingerprint, attempts);
    if (attempts.length >= 7) throw new AuthError("too-many-attempts");
  }

  private recordFailedLogin(fingerprint: string): void {
    const attempts = this.loginAttempts.get(fingerprint) ?? [];
    attempts.push(Date.now());
    this.loginAttempts.set(fingerprint, attempts);
  }

  private removeExpiredSessions(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) if (session.expiresAt <= now) this.sessions.delete(id);
  }

  private async registerWithDatabase(input: { email: string; password: string; displayName: string }): Promise<{ user: AuthenticatedUser; cookie: string; verification: AccountActionResult }> {
    if (!this.database) throw new Error("Database is unavailable.");
    const now = new Date();
    const id = randomUUID();
    try {
      await this.database.insert(users).values({ id, email: input.email, passwordHash: await hashPassword(input.password), emailVerifiedAt: null, createdAt: now, updatedAt: now });
      await this.database.insert(profiles).values({ userId: id, displayName: input.displayName.trim(), createdAt: now, updatedAt: now });
    } catch (error) {
      if (isUniqueViolation(error)) throw new AuthError("duplicate-email");
      throw error;
    }
    const user: AuthenticatedUser = { id, email: input.email, emailVerified: false, displayName: input.displayName.trim(), biography: null, location: null, fieldName: null, avatarDataUrl: null, createdAt: now.toISOString() };
    const verification = await this.issueAction(user, "verify-email");
    return { user, cookie: await this.createSession(id), verification };
  }

  private async signInWithGoogleDatabase(identity: GoogleIdentity): Promise<{ user: AuthenticatedUser; cookie: string; isNew: boolean }> {
    if (!this.database) throw new Error("Database is unavailable.");
    const email = normalizeEmail(identity.email);
    const [linkedIdentity] = await this.database.select({ userId: oauthIdentities.userId }).from(oauthIdentities)
      .where(and(eq(oauthIdentities.provider, "google"), eq(oauthIdentities.providerSubject, identity.subject)));
    let user = linkedIdentity ? await this.userById(linkedIdentity.userId) : await this.userByEmail(email);
    let isNew = false;

    if (!user) {
      const now = new Date();
      const id = randomUUID();
      try {
        await this.database.insert(users).values({
          id, email, passwordHash: await hashPassword(randomBytes(48).toString("base64url")),
          emailVerifiedAt: now, createdAt: now, updatedAt: now
        });
        await this.database.insert(profiles).values({
          userId: id, displayName: identity.displayName.trim() || email.split("@")[0]!, createdAt: now, updatedAt: now
        });
        user = { id, email, emailVerified: true, displayName: identity.displayName.trim() || email.split("@")[0]!, biography: null, location: null, fieldName: null, avatarDataUrl: null, createdAt: now.toISOString() };
        isNew = true;
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        user = await this.userByEmail(email);
        if (!user) throw error;
      }
    }

    if (!user.emailVerified) {
      const now = new Date();
      await this.database.update(users).set({ emailVerifiedAt: now, updatedAt: now }).where(eq(users.id, user.id));
      user = { ...user, emailVerified: true };
    }
    await this.database.insert(oauthIdentities).values({
      provider: "google", providerSubject: identity.subject, userId: user.id, email, createdAt: new Date(), updatedAt: new Date()
    }).onConflictDoNothing();
    return { user, cookie: await this.createSession(user.id), isNew };
  }

  private async changeUnverifiedEmailDatabase(userId: string, password: string, nextEmail: string): Promise<{ user: AuthenticatedUser; verification: AccountActionResult }> {
    if (!this.database) throw new Error("Database is unavailable.");
    const [record] = await this.database.select({ id: users.id, email: users.email, passwordHash: users.passwordHash, emailVerifiedAt: users.emailVerifiedAt })
      .from(users).where(eq(users.id, userId));
    if (!record || !(await verifyPassword(password, record.passwordHash))) throw new AuthError("invalid-credentials");
    if (record.emailVerifiedAt) throw new AuthError("email-already-verified");
    try {
      await this.database.update(users).set({ email: nextEmail, updatedAt: new Date() }).where(eq(users.id, userId));
    } catch (error) {
      if (isUniqueViolation(error)) throw new AuthError("duplicate-email");
      throw error;
    }
    const user = await this.userById(userId);
    if (!user) throw new AuthError("invalid-credentials");
    return { user, verification: await this.issueAction(user, "verify-email") };
  }

  private async loginWithDatabase(input: { email: string; password: string; fingerprint: string }): Promise<{ user: AuthenticatedUser; cookie: string }> {
    if (!this.database) throw new Error("Database is unavailable.");
    const [record] = await this.database.select({ id: users.id, email: users.email, passwordHash: users.passwordHash, emailVerifiedAt: users.emailVerifiedAt, createdAt: users.createdAt, displayName: profiles.displayName, biography: profiles.biography, location: profiles.location, fieldName: profiles.fieldName, avatarDataUrl: profiles.avatarDataUrl }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.email, input.email));
    if (!record || !(await verifyPassword(input.password, record.passwordHash))) {
      this.recordFailedLogin(input.fingerprint);
      throw new AuthError("invalid-credentials");
    }
    this.loginAttempts.delete(input.fingerprint);
    const user = toDatabaseUser(record);
    return { user, cookie: await this.createSession(user.id) };
  }

  private async currentDatabaseUser(sessionId: string, expiresAt: number): Promise<AuthenticatedUser | null> {
    if (!this.database) return null;
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      await this.database.delete(authSessions).where(eq(authSessions.id, sessionId));
      return null;
    }
    const [record] = await this.database.select({ sessionExpiresAt: authSessions.expiresAt, id: users.id, email: users.email, emailVerifiedAt: users.emailVerifiedAt, createdAt: users.createdAt, displayName: profiles.displayName, biography: profiles.biography, location: profiles.location, fieldName: profiles.fieldName, avatarDataUrl: profiles.avatarDataUrl }).from(authSessions).innerJoin(users, eq(authSessions.userId, users.id)).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(authSessions.id, sessionId));
    if (!record || record.sessionExpiresAt.getTime() !== expiresAt || record.sessionExpiresAt.getTime() <= Date.now()) return null;
    return toDatabaseUser(record);
  }

  private async updateDatabaseProfile(userId: string, input: { displayName?: string; biography?: string | null; location?: string | null; fieldName?: string | null; avatarDataUrl?: string | null }): Promise<AuthenticatedUser | null> {
    if (!this.database) return null;
    const changes = { updatedAt: new Date(), ...(input.displayName !== undefined ? { displayName: input.displayName.trim() } : {}), ...(input.biography !== undefined ? { biography: input.biography } : {}), ...(input.location !== undefined ? { location: input.location } : {}), ...(input.fieldName !== undefined ? { fieldName: input.fieldName } : {}), ...(input.avatarDataUrl !== undefined ? { avatarDataUrl: input.avatarDataUrl } : {}) };
    const [profile] = await this.database.update(profiles).set(changes).where(eq(profiles.userId, userId)).returning();
    if (!profile) return null;
    const [user] = await this.database.select({ id: users.id, email: users.email, emailVerifiedAt: users.emailVerifiedAt, createdAt: users.createdAt }).from(users).where(eq(users.id, userId));
    if (!user) return null;
    return { id: user.id, email: user.email, emailVerified: Boolean(user.emailVerifiedAt), displayName: profile.displayName, biography: profile.biography, location: profile.location, fieldName: profile.fieldName, avatarDataUrl: profile.avatarDataUrl, createdAt: user.createdAt.toISOString() };
  }

  private async userById(userId: string): Promise<AuthenticatedUser | null> {
    if (!this.database) {
      const user = this.usersById.get(userId);
      return user ? toPublicUser(user) : null;
    }
    const [record] = await this.database.select({ id: users.id, email: users.email, emailVerifiedAt: users.emailVerifiedAt, createdAt: users.createdAt, displayName: profiles.displayName, biography: profiles.biography, location: profiles.location, fieldName: profiles.fieldName, avatarDataUrl: profiles.avatarDataUrl }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.id, userId));
    return record ? toDatabaseUser(record) : null;
  }

  private async userByEmail(email: string): Promise<AuthenticatedUser | null> {
    if (!this.database) {
      const user = this.usersByEmail.get(email);
      return user ? toPublicUser(user) : null;
    }
    const [record] = await this.database.select({ id: users.id, email: users.email, emailVerifiedAt: users.emailVerifiedAt, createdAt: users.createdAt, displayName: profiles.displayName, biography: profiles.biography, location: profiles.location, fieldName: profiles.fieldName, avatarDataUrl: profiles.avatarDataUrl }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.email, email));
    return record ? toDatabaseUser(record) : null;
  }

  private async issueAction(user: AuthenticatedUser, purpose: AccountActionPurpose): Promise<AccountActionResult> {
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = this.hashActionToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (purpose === "verify-email" ? verificationLifetimeMs : passwordResetLifetimeMs));
    if (this.database) {
      await this.database.delete(accountActionTokens).where(and(eq(accountActionTokens.userId, user.id), eq(accountActionTokens.purpose, purpose), isNull(accountActionTokens.usedAt)));
      await this.database.insert(accountActionTokens).values({ id: randomUUID(), userId: user.id, purpose, tokenHash, expiresAt, usedAt: null, createdAt: now });
    } else {
      for (const [hash, action] of this.actionTokens) if (action.userId === user.id && action.purpose === purpose && action.usedAt === null) this.actionTokens.delete(hash);
      this.actionTokens.set(tokenHash, { id: randomUUID(), userId: user.id, purpose, expiresAt: expiresAt.getTime(), usedAt: null });
    }
    const actionUrl = this.actionUrl(purpose, rawToken);
    const delivery = await this.email.send({ email: user.email, displayName: user.displayName, purpose, actionUrl });
    return { delivery, ...(this.config.environment === "production" ? {} : { developmentActionUrl: actionUrl }) };
  }

  private async consumeAction(rawToken: string, purpose: AccountActionPurpose): Promise<{ userId: string } | null> {
    const tokenHash = this.hashActionToken(rawToken);
    const now = new Date();
    if (!this.database) {
      const action = this.actionTokens.get(tokenHash);
      if (!action || action.purpose !== purpose || action.usedAt !== null || action.expiresAt <= now.getTime()) return null;
      action.usedAt = now.getTime();
      return { userId: action.userId };
    }
    const [action] = await this.database.select().from(accountActionTokens).where(and(eq(accountActionTokens.tokenHash, tokenHash), eq(accountActionTokens.purpose, purpose), isNull(accountActionTokens.usedAt)));
    if (!action || action.expiresAt.getTime() <= now.getTime()) return null;
    const updated = await this.database.update(accountActionTokens).set({ usedAt: now }).where(and(eq(accountActionTokens.id, action.id), isNull(accountActionTokens.usedAt))).returning({ id: accountActionTokens.id });
    return updated.length ? { userId: action.userId } : null;
  }

  private actionUrl(purpose: AccountActionPurpose, rawToken: string): string {
    const publicAppUrl = this.config.publicAppUrl ?? "http://localhost:5173";
    const base = publicAppUrl.endsWith("/") ? publicAppUrl : `${publicAppUrl}/`;
    const url = new URL(purpose === "verify-email" ? "verify-email" : "join", base);
    url.searchParams.set(purpose === "verify-email" ? "verify" : "reset", rawToken);
    return url.toString();
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}.${key.toString("base64url")}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(".");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const key = (await scrypt(password, salt, expected.length)) as Buffer;
  return key.length === expected.length && timingSafeEqual(key, expected);
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function toPublicUser(user: StoredUser): AuthenticatedUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return { ...publicUser };
}

function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const chunk of header.split(";")) {
    const [key, ...value] = chunk.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

function toDatabaseUser(record: { id: string; email: string; emailVerifiedAt: Date | null; createdAt: Date; displayName: string | null; biography: string | null; location: string | null; fieldName: string | null; avatarDataUrl: string | null }): AuthenticatedUser {
  return { id: record.id, email: record.email, emailVerified: Boolean(record.emailVerifiedAt), displayName: record.displayName ?? record.email.split("@")[0]!, biography: record.biography, location: record.location, fieldName: record.fieldName, avatarDataUrl: record.avatarDataUrl, createdAt: record.createdAt.toISOString() };
}

function authErrorMessage(code: AuthError["code"]): string {
  if (code === "duplicate-email") return "Use sign in or password recovery if this email already has a TOP account.";
  if (code === "too-many-attempts") return "Too many sign-in attempts. Please wait 15 minutes before trying again.";
  if (code === "invalid-action") return "That account link is invalid or has expired. Request a new one and try again.";
  if (code === "email-already-verified") return "This email is already verified and cannot be changed from this screen.";
  return "Email or password is not correct.";
}

function isUniqueViolation(error: unknown): boolean {
  // Drizzle wraps driver failures in a QueryError, so the PostgreSQL code is
  // usually available on `cause` rather than the outer error itself.
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (typeof current !== "object" || current === null) return false;
    const candidate = current as { code?: unknown; cause?: unknown; message?: unknown };
    if (candidate.code === "23505") return true;
    // Some postgres.js versions expose the constraint only in the message.
    // Keep the check scoped to the users email constraint so unrelated unique
    // failures are still surfaced for monitoring instead of being mislabeled.
    if (typeof candidate.message === "string" && candidate.message.includes("users_email_unique")) return true;
    current = candidate.cause;
  }
  return false;
}
