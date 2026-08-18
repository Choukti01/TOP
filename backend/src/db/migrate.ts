import { migrate } from "drizzle-orm/postgres-js/migrator";

import { loadConfig } from "../config/env.js";
import { createDatabase } from "./client.js";

const { client, db } = createDatabase(loadConfig());

try {
  await migrate(db, { migrationsFolder: "drizzle" });
} finally {
  await client.end();
}
