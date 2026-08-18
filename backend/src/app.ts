import cors from "cors";
import express from "express";

import type { AppConfig } from "./config/env.js";
import { apiRouter } from "./routes/api.js";
import { healthRouter } from "./routes/health.js";
import { workspaceRouter } from "./routes/workspace.js";

export function buildApp(config: AppConfig) {
  const app = express();
  const allowedOrigins = new Set([
    config.webOrigin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5188",
    "http://127.0.0.1:5188",
    "http://localhost:5190",
    "http://127.0.0.1:5190"
  ]);

  app.disable("x-powered-by");

  app.use((_request, response, next) => {
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    next();
  });

  app.use(cors({ origin: [...allowedOrigins] }));
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);
  app.use("/api/v1", apiRouter);
  app.use("/api/v1/workspace", workspaceRouter);

  return app;
}
