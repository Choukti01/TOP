export type Environment = "development" | "test" | "production";

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

export function loadConfig(env = process.env): AppConfig {
  return {
    environment: parseEnvironment(env.NODE_ENV),
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
    errorWebhookUrl: env.ERROR_WEBHOOK_URL
  };
}
