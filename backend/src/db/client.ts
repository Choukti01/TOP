import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { AppConfig } from "../config/env.js";
import * as schema from "./schema.js";

export function createDatabase(config: Pick<AppConfig, "databaseUrl">) {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required for database-backed operations.");
  }

  const client = postgres(config.databaseUrl, { max: 10 });

  return {
    client,
    db: drizzle(client, { schema })
  };
}
