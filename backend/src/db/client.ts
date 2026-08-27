import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { AppConfig } from "../config/env.js";
import * as schema from "./schema.js";

export function createDatabase(config: Pick<AppConfig, "databaseUrl">) {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required for database-backed operations.");
  }

  // Supabase's transaction pooler (and other PgBouncer-compatible providers)
  // cannot keep PostgreSQL prepared statements pinned to one connection. Drizzle
  // still parameterizes every query; disabling prepared statements here only
  // makes those parameterized queries safe to run through a shared pool.
  const client = postgres(config.databaseUrl, { max: 10, prepare: false });

  return {
    client,
    db: drizzle(client, { schema })
  };
}
