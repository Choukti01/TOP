import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { AppConfig } from "../config/env.js";
import * as schema from "./schema.js";

type DatabaseConnection = {
  client: ReturnType<typeof postgres>;
  db: ReturnType<typeof drizzle<typeof schema>>;
};

// The API has several domain services (auth, Field, seeds, and the public
// TOP Page). They all point to the same database, so they must also share one
// connection pool. Creating a pool per service quietly exhausts Supabase's
// session-pool limit even when only one person is using TOP.
const connections = new Map<string, DatabaseConnection>();

export function createDatabase(config: Pick<AppConfig, "databaseUrl">) {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required for database-backed operations.");
  }

  const existing = connections.get(config.databaseUrl);
  if (existing) return existing;

  // Supabase's transaction pooler (and other PgBouncer-compatible providers)
  // cannot keep PostgreSQL prepared statements pinned to one connection. Drizzle
  // still parameterizes every query; disabling prepared statements here only
  // makes those parameterized queries safe to run through a shared pool.
  // Keep this deliberately small: TOP's free Supabase session pool has a
  // 15-client ceiling, and this process also needs room for migrations and
  // operational connections. Idle sessions are released promptly.
  const client = postgres(config.databaseUrl, {
    max: 4,
    prepare: false,
    idle_timeout: 20,
    max_lifetime: 60 * 30
  });

  const connection: DatabaseConnection = {
    client,
    db: drizzle(client, { schema })
  };

  connections.set(config.databaseUrl, connection);
  return connection;
}
