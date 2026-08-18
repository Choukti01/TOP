import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { buildApp } from "./app.js";
import { loadConfig } from "./config/env.js";

const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const config = loadConfig();
const app = buildApp(config);

const server = app.listen(config.port, config.host, () => {
  console.info(`TOP API listening at http://${config.host}:${config.port}`);
});

server.on("error", (error) => {
  console.error("TOP API failed to start", error);
  process.exitCode = 1;
});
