import { randomUUID } from "node:crypto";
import type { Request, RequestHandler, Response } from "express";

import type { AppConfig } from "../config/env.js";

export function requestContext(): RequestHandler {
  return (_request, response, next) => {
    response.locals.requestId = randomUUID();
    response.setHeader("X-Request-Id", response.locals.requestId);
    next();
  };
}

export function reportUnhandledError(error: unknown, request: Request, response: Response, config: Pick<AppConfig, "errorWebhookUrl">): void {
  const failure = error instanceof Error ? error : new Error("Unknown non-Error exception");
  const cause = "cause" in failure && failure.cause instanceof Error ? failure.cause : null;
  const incident = {
    requestId: typeof response.locals.requestId === "string" ? response.locals.requestId : "unknown",
    method: request.method,
    path: `${request.baseUrl}${request.path}`,
    name: failure.name,
    message: failure.message.split("\n")[0],
    cause: cause ? { name: cause.name, message: cause.message.split("\n")[0] } : null
  };
  console.error("Unhandled TOP API error", incident);

  if (!config.errorWebhookUrl) return;
  // Errors are reported asynchronously and deliberately omit cookies, request
  // bodies, query strings, passwords, and reset tokens.
  void fetch(config.errorWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service: "top-api", severity: "error", ...incident })
  }).catch(() => console.error("TOP error monitor delivery failed", { requestId: incident.requestId }));
}
