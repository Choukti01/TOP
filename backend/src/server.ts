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

process.on("unhandledRejection", (reason) => {
  console.error("TOP API unhandled rejection", { name: reason instanceof Error ? reason.name : "UnknownError", message: reason instanceof Error ? reason.message : String(reason) });
});

process.on("uncaughtException", (error) => {
  console.error("TOP API uncaught exception", { name: error.name, message: error.message });
  process.exitCode = 1;
});
