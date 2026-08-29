import cors from "cors";
import express from "express";

import type { AppConfig } from "./config/env.js";
import { AuthService } from "./auth/service.js";
import { apiRouter } from "./routes/api.js";
import { createAuthRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { createWorkspaceRouter } from "./routes/workspace.js";
import { createTopRouter } from "./routes/top.js";
import { reportUnhandledError, requestContext } from "./observability/monitoring.js";

export function buildApp(config: AppConfig) {
  const app = express();
  const auth = new AuthService(config);
  const allowedOrigins = new Set([
    config.webOrigin,
    "https://t0p.world",
    "https://www.t0p.world",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5188",
    "http://127.0.0.1:5188",
    "http://localhost:5190",
    "http://127.0.0.1:5190"
  ]);

  app.disable("x-powered-by");
  // Render sits in front of this service, so this makes rate-limit and audit
  // decisions use the visitor IP rather than the platform proxy address.
  app.set("trust proxy", 1);

  app.use(requestContext());
  app.use((_request, response, next) => {
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (config.environment === "production") response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });

  app.use(cors({ origin: [...allowedOrigins], credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);
  app.use("/api/v1", apiRouter);
  app.use("/api/v1/auth", createAuthRouter(auth, config));
  app.use("/api/v1/workspace", createWorkspaceRouter(auth, config));
  app.use("/api/v1/top", createTopRouter(auth, config));

  // Keep production errors useful in Render logs without leaking database or
  // implementation details to people using TOP.
  app.use((error: unknown, request: express.Request, response: express.Response, _next: express.NextFunction) => {
    reportUnhandledError(error, request, response, config);
    if (response.headersSent) return;
    response.status(500).json({ error: "TOP hit a server problem. Please try again in a moment.", requestId: response.locals.requestId });
  });

  return app;
}
