import type { RequestHandler } from "express";

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowMs: number;
  key?: (request: Parameters<RequestHandler>[0]) => string;
};

type HitWindow = { count: number; resetAt: number };

// The API runs as one lightweight web process today. This small guard protects
// sensitive endpoints immediately; move its counters to Redis when TOP scales
// to multiple API instances.
export function createRateLimit(options: RateLimitOptions): RequestHandler {
  const hits = new Map<string, HitWindow>();
  const keyFor = options.key ?? ((request) => request.ip || "unknown");

  return (request, response, next) => {
    const now = Date.now();
    const key = `${options.scope}:${keyFor(request)}`.slice(0, 400);
    const previous = hits.get(key);
    const current = !previous || previous.resetAt <= now ? { count: 0, resetAt: now + options.windowMs } : previous;
    current.count += 1;
    hits.set(key, current);

    const remaining = Math.max(0, options.limit - current.count);
    response.setHeader("RateLimit-Limit", String(options.limit));
    response.setHeader("RateLimit-Remaining", String(remaining));
    response.setHeader("RateLimit-Reset", String(Math.ceil(current.resetAt / 1000)));

    if (current.count > options.limit) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      response.setHeader("Retry-After", String(retryAfter));
      return response.status(429).json({ error: "TOP is protecting this account action. Please wait a little and try again." });
    }
    return next();
  };
}
