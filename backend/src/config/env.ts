export type Environment = "development" | "test" | "production";
export type TopEyeEngine = "ollama" | "disabled";

export interface AppConfig {
  environment: Environment;
  host: string;
  port: number;
  webOrigin: string;
  databaseUrl?: string;
  databaseEnabled?: boolean;
  sessionSecret?: string;
  accountActionSecret?: string;
  publicAppUrl?: string;
  resendApiKey?: string;
  emailFrom?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
  topEyeEngine?: TopEyeEngine;
  ollamaBaseUrl?: string;
  topEyeModel?: string;
  errorWebhookUrl?: string;
}

function parsePort(value: string | undefined): number {
  if (!value) return 3000;

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

function parseEnvironment(value: string | undefined): Environment {
  if (!value) return "development";

  if (value === "development" || value === "test" || value === "production") {
    return value;
  }

  throw new Error("NODE_ENV must be development, test, or production.");
}

function parseTopEyeEngine(value: string | undefined, environment: Environment): TopEyeEngine {
  if (!value) return environment === "development" ? "ollama" : "disabled";
  if (value === "ollama" || value === "disabled") return value;
  throw new Error("TOPEYE_ENGINE must be ollama or disabled.");
}

function parseLocalOllamaUrl(value: string | undefined): string {
  const candidate = value?.trim() || "http://127.0.0.1:11434";
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("OLLAMA_BASE_URL must be a valid local HTTP URL.");
  }

  const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
  if (url.protocol !== "http:" || !loopbackHosts.has(url.hostname) || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("OLLAMA_BASE_URL must point to a loopback HTTP service, such as http://127.0.0.1:11434.");
  }
  return url.toString().replace(/\/$/, "");
}

export function loadConfig(env = process.env): AppConfig {
  const environment = parseEnvironment(env.NODE_ENV);
  return {
    environment,
    host: env.HOST ?? "127.0.0.1",
    port: parsePort(env.PORT),
    webOrigin: env.WEB_ORIGIN ?? "http://localhost:5173",
    databaseUrl: env.DATABASE_URL,
    databaseEnabled: env.DATABASE_ENABLED === "true",
    sessionSecret: env.SESSION_SECRET,
    // This is deliberately separate from WEB_ORIGIN. WEB_ORIGIN governs CORS;
    // PUBLIC_APP_URL is the safe, canonical destination for account-action links.
    publicAppUrl: env.PUBLIC_APP_URL ?? env.WEB_ORIGIN ?? "http://localhost:5173",
    accountActionSecret: env.ACCOUNT_ACTION_SECRET,
    resendApiKey: env.RESEND_API_KEY,
    emailFrom: env.EMAIL_FROM,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: env.GOOGLE_REDIRECT_URI,
    // T0PEYE Core is a local-only engine by default. A production deployment
    // cannot be pointed at a person's laptop by configuration.
    topEyeEngine: parseTopEyeEngine(env.TOPEYE_ENGINE, environment),
    ollamaBaseUrl: parseLocalOllamaUrl(env.OLLAMA_BASE_URL),
    topEyeModel: env.TOPEYE_MODEL?.trim() || "topeye-core",
    errorWebhookUrl: env.ERROR_WEBHOOK_URL
  };
}
