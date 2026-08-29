import { createHash, createHmac, createPublicKey, randomBytes, timingSafeEqual, verify as verifySignature } from "node:crypto";
import { z } from "zod";

import type { AppConfig } from "../config/env.js";

const stateLifetimeMs = 10 * 60 * 1000;
let googleKeys: GoogleJwk[] = [];
let googleKeysExpiresAt = 0;

interface GoogleJwk {
  kty: "RSA";
  kid: string;
  n: string;
  e: string;
  alg?: string;
}

export interface GoogleIdentity {
  subject: string;
  email: string;
  displayName: string;
}

export class GoogleOAuthError extends Error {
  public constructor(public readonly code: "unavailable" | "invalid-state" | "denied" | "failed") {
    super(googleOAuthErrorMessage(code));
  }
}

interface OAuthState {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
  expiresAt: number;
}

export class GoogleOAuthService {
  public constructor(private readonly config: Pick<AppConfig, "environment" | "sessionSecret" | "accountActionSecret" | "googleClientId" | "googleClientSecret" | "googleRedirectUri">) {}

  public get enabled(): boolean {
    return Boolean(this.config.googleClientId && this.config.googleClientSecret && this.config.googleRedirectUri);
  }

  public begin(next: string): { authorizationUrl: string; cookie: string } {
    if (!this.enabled) throw new GoogleOAuthError("unavailable");
    const state = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const verifier = randomBytes(64).toString("base64url");
    const payload: OAuthState = { state, nonce, verifier, next, expiresAt: Date.now() + stateLifetimeMs };
    const params = new URLSearchParams({
      client_id: this.config.googleClientId!,
      redirect_uri: this.config.googleRedirectUri!,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      state,
      nonce,
      code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      code_challenge_method: "S256"
    });

    return {
      authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      cookie: this.serializeCookie(this.signState(payload), Math.floor(stateLifetimeMs / 1000))
    };
  }

  public async complete(input: { code?: string; state?: string; error?: string; cookieHeader?: string }): Promise<{ identity: GoogleIdentity; next: string; clearCookie: string }> {
    const pending = this.readState(input.cookieHeader);
    const clearCookie = this.serializeCookie("", 0);
    if (!pending || !input.state || !safeEqual(input.state, pending.state)) throw new GoogleOAuthError("invalid-state");
    if (input.error) throw new GoogleOAuthError("denied");
    if (!input.code || !this.enabled) throw new GoogleOAuthError(this.enabled ? "failed" : "unavailable");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: input.code,
        client_id: this.config.googleClientId!,
        client_secret: this.config.googleClientSecret!,
        redirect_uri: this.config.googleRedirectUri!,
        grant_type: "authorization_code",
        code_verifier: pending.verifier
      })
    });

    const tokenPayload = await tokenResponse.json().catch(() => null);
    const parsedToken = z.object({ id_token: z.string().min(20) }).safeParse(tokenPayload);
    if (!tokenResponse.ok || !parsedToken.success) throw new GoogleOAuthError("failed");

    try {
      const payload = await verifyGoogleIdToken(parsedToken.data.id_token, this.config.googleClientId!);
      const subject = typeof payload.sub === "string" ? payload.sub : "";
      const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
      const displayName = typeof payload.name === "string" ? payload.name.trim().slice(0, 48) : "";
      if (!subject || !email || payload.email_verified !== true || !safeEqual(typeof payload.nonce === "string" ? payload.nonce : "", pending.nonce)) {
        throw new GoogleOAuthError("failed");
      }
      return { identity: { subject, email, displayName: displayName || email.split("@")[0]! }, next: pending.next, clearCookie };
    } catch (error) {
      if (error instanceof GoogleOAuthError) throw error;
      throw new GoogleOAuthError("failed");
    }
  }

  public clearCookie(): string {
    return this.serializeCookie("", 0);
  }

  private readState(header: string | undefined): OAuthState | null {
    const signed = readCookie(header, "top_google_oauth");
    if (!signed) return null;
    const [encoded, signature] = signed.split(".");
    if (!encoded || !signature || !safeEqual(signature, this.sign(encoded))) return null;
    try {
      const parsed = z.object({
        state: z.string().min(32).max(128),
        nonce: z.string().min(32).max(128),
        verifier: z.string().min(43).max(128),
        next: z.string().startsWith("/").max(2_000),
        expiresAt: z.number().int().positive()
      }).parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
      return parsed.expiresAt > Date.now() && !parsed.next.startsWith("//") ? parsed : null;
    } catch {
      return null;
    }
  }

  private signState(payload: OAuthState): string {
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encoded}.${this.sign(encoded)}`;
  }

  private sign(value: string): string {
    const secret = this.config.accountActionSecret ?? this.config.sessionSecret ?? "top-local-google-oauth-secret";
    return createHmac("sha256", secret).update(value).digest("base64url");
  }

  private serializeCookie(value: string, maxAge: number): string {
    const secure = this.config.environment === "production" ? "; Secure" : "";
    return `top_google_oauth=${value}; Path=/api/v1/auth/google; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
  }
}

async function verifyGoogleIdToken(token: string, clientId: string): Promise<Record<string, unknown>> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) throw new GoogleOAuthError("failed");
  let header: { alg?: unknown; kid?: unknown };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8")) as { alg?: unknown; kid?: unknown };
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch { throw new GoogleOAuthError("failed"); }
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new GoogleOAuthError("failed");
  let key = (await currentGoogleKeys()).find((candidate) => candidate.kid === header.kid);
  // Google rotates signing keys. A single forced refresh avoids rejecting a
  // valid new key just because the previous cache is still warm.
  if (!key) key = (await currentGoogleKeys(true)).find((candidate) => candidate.kid === header.kid);
  if (!key) throw new GoogleOAuthError("failed");
  const validSignature = verifySignature("RSA-SHA256", Buffer.from(`${encodedHeader}.${encodedPayload}`), createPublicKey({ key: { kty: key.kty, n: key.n, e: key.e }, format: "jwk" }), Buffer.from(encodedSignature, "base64url"));
  const now = Math.floor(Date.now() / 1000);
  const audience = payload.aud;
  const audienceMatches = audience === clientId || (Array.isArray(audience) && audience.includes(clientId));
  const issuerMatches = payload.iss === "https://accounts.google.com" || payload.iss === "accounts.google.com";
  if (!validSignature || !audienceMatches || !issuerMatches || typeof payload.exp !== "number" || payload.exp <= now || (typeof payload.iat === "number" && payload.iat > now + 60)) throw new GoogleOAuthError("failed");
  return payload;
}

async function currentGoogleKeys(force = false): Promise<GoogleJwk[]> {
  if (!force && googleKeys.length && googleKeysExpiresAt > Date.now()) return googleKeys;
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  const body = await response.json().catch(() => null);
  const parsed = z.object({ keys: z.array(z.object({ kty: z.literal("RSA"), kid: z.string().min(1), n: z.string().min(1), e: z.string().min(1), alg: z.string().optional() })) }).safeParse(body);
  if (!response.ok || !parsed.success) throw new GoogleOAuthError("failed");
  const cacheControl = response.headers.get("cache-control") ?? "";
  const maxAge = Number(/max-age=(\d+)/.exec(cacheControl)?.[1] ?? 3600);
  googleKeys = parsed.data.keys;
  googleKeysExpiresAt = Date.now() + Math.max(60, Math.min(maxAge, 86_400)) * 1000;
  return googleKeys;
}

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const chunk of header.split(";")) {
    const [key, ...value] = chunk.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function googleOAuthErrorMessage(code: GoogleOAuthError["code"]): string {
  if (code === "unavailable") return "Google sign-in is not configured for TOP yet.";
  if (code === "invalid-state") return "That Google sign-in request expired. Start again from TOP.";
  if (code === "denied") return "Google sign-in was cancelled. You can choose email instead.";
  return "TOP could not verify that Google sign-in. Please try again.";
}
