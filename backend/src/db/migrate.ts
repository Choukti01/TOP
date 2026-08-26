import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { loadConfig } from "../config/env.js";
import { createDatabase } from "./client.js";

const envPath = resolve(process.cwd(), ".env");

// An explicit DATABASE_URL is authoritative. This keeps a one-time production
// migration from accidentally falling back to a developer's local .env file.
if (existsSync(envPath) && !process.env.DATABASE_URL) {
  process.loadEnvFile(envPath);
}

const { client, db } = createDatabase(loadConfig());

try {
  await migrate(db, { migrationsFolder: "drizzle" });
} finally {
  await client.end();
}
