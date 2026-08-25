import { createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";

import type { AppConfig } from "../config/env.js";
import { createDatabase } from "../db/client.js";
import { authSessions, profiles, users } from "../db/schema.js";

const scrypt = promisify(scryptCallback);
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 7;

export interface AuthenticatedUser {
  id: string;
  email: string;
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

export class AuthError extends Error {
  public constructor(public readonly code: "duplicate-email" | "invalid-credentials") {
    super(code === "duplicate-email" ? "An account already exists for that email." : "Email or password is not correct.");
  }
}

export class AuthService {
  private readonly usersByEmail = new Map<string, StoredUser>();
  private readonly usersById = new Map<string, StoredUser>();
  private readonly sessions = new Map<string, StoredSession>();
  private readonly loginAttempts = new Map<string, number[]>();
  private readonly signingSecret: string;
  private readonly secureCookies: boolean;
  private readonly database: ReturnType<typeof createDatabase>["db"] | null;

  public constructor(config: Pick<AppConfig, "environment" | "sessionSecret" | "databaseUrl" | "databaseEnabled">) {
    if (config.environment === "production" && (!config.sessionSecret || config.sessionSecret.length < 32)) {
      throw new Error("SESSION_SECRET must be at least 32 characters in production.");
    }

    this.signingSecret = config.sessionSecret ?? "top-local-development-session-secret-change-before-production";
    this.secureCookies = config.environment === "production";
    this.database = config.databaseUrl && config.databaseEnabled ? createDatabase(config).db : null;
  }

  public async register(input: { email: string; password: string; displayName: string }): Promise<{ user: AuthenticatedUser; cookie: string }> {
    const email = normalizeEmail(input.email);
    if (this.database) return this.registerWithDatabase({ ...input, email });
    if (this.usersByEmail.has(email)) throw new AuthError("duplicate-email");

    const now = new Date().toISOString();
    const user: StoredUser = {
      id: randomUUID(),
      email,
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
    return { user: toPublicUser(user), cookie: await this.createSession(user.id) };
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
    if (attempts.length >= 7) throw new AuthError("invalid-credentials");
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

  private async registerWithDatabase(input: { email: string; password: string; displayName: string }): Promise<{ user: AuthenticatedUser; cookie: string }> {
    if (!this.database) throw new Error("Database is unavailable.");
    const now = new Date();
    const id = randomUUID();
    try {
      await this.database.insert(users).values({ id, email: input.email, passwordHash: await hashPassword(input.password), createdAt: now, updatedAt: now });
      await this.database.insert(profiles).values({ userId: id, displayName: input.displayName.trim(), createdAt: now, updatedAt: now });
    } catch (error) {
      if (isUniqueViolation(error)) throw new AuthError("duplicate-email");
      throw error;
    }
    const user: AuthenticatedUser = { id, email: input.email, displayName: input.displayName.trim(), biography: null, location: null, fieldName: null, avatarDataUrl: null, createdAt: now.toISOString() };
    return { user, cookie: await this.createSession(id) };
  }

  private async loginWithDatabase(input: { email: string; password: string; fingerprint: string }): Promise<{ user: AuthenticatedUser; cookie: string }> {
    if (!this.database) throw new Error("Database is unavailable.");
    const [record] = await this.database.select({ id: users.id, email: users.email, passwordHash: users.passwordHash, createdAt: users.createdAt, displayName: profiles.displayName, biography: profiles.biography, location: profiles.location, fieldName: profiles.fieldName, avatarDataUrl: profiles.avatarDataUrl }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.email, input.email));
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
    const [record] = await this.database.select({ sessionExpiresAt: authSessions.expiresAt, id: users.id, email: users.email, createdAt: users.createdAt, displayName: profiles.displayName, biography: profiles.biography, location: profiles.location, fieldName: profiles.fieldName, avatarDataUrl: profiles.avatarDataUrl }).from(authSessions).innerJoin(users, eq(authSessions.userId, users.id)).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(authSessions.id, sessionId));
    if (!record || record.sessionExpiresAt.getTime() !== expiresAt || record.sessionExpiresAt.getTime() <= Date.now()) return null;
    return toDatabaseUser(record);
  }

  private async updateDatabaseProfile(userId: string, input: { displayName?: string; biography?: string | null; location?: string | null; fieldName?: string | null; avatarDataUrl?: string | null }): Promise<AuthenticatedUser | null> {
    if (!this.database) return null;
    const changes = { updatedAt: new Date(), ...(input.displayName !== undefined ? { displayName: input.displayName.trim() } : {}), ...(input.biography !== undefined ? { biography: input.biography } : {}), ...(input.location !== undefined ? { location: input.location } : {}), ...(input.fieldName !== undefined ? { fieldName: input.fieldName } : {}), ...(input.avatarDataUrl !== undefined ? { avatarDataUrl: input.avatarDataUrl } : {}) };
    const [profile] = await this.database.update(profiles).set(changes).where(eq(profiles.userId, userId)).returning();
    if (!profile) return null;
    const [user] = await this.database.select({ id: users.id, email: users.email, createdAt: users.createdAt }).from(users).where(eq(users.id, userId));
    if (!user) return null;
    return { id: user.id, email: user.email, displayName: profile.displayName, biography: profile.biography, location: profile.location, fieldName: profile.fieldName, avatarDataUrl: profile.avatarDataUrl, createdAt: user.createdAt.toISOString() };
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

function toDatabaseUser(record: { id: string; email: string; createdAt: Date; displayName: string | null; biography: string | null; location: string | null; fieldName: string | null; avatarDataUrl: string | null }): AuthenticatedUser {
  return { id: record.id, email: record.email, displayName: record.displayName ?? record.email.split("@")[0]!, biography: record.biography, location: record.location, fieldName: record.fieldName, avatarDataUrl: record.avatarDataUrl, createdAt: record.createdAt.toISOString() };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";
}
