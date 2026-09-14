import "server-only";
import { RateLimitError } from "@/shared/api/errors";

type Bucket = { count: number; resetAt: number };

// In-memory and therefore per-instance: enough to stop a bot hammering the
// public appointment form on a single-node deploy. Swap the Map for Redis
// (or Upstash) when the app runs on more than one instance.
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) throw new RateLimitError();
}

/** Best-effort client identity for rate limiting behind a proxy. */
export function clientKey(req: Request, scope: string) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

/** Exposed for tests so one spec can't leak state into the next. */
export function resetRateLimits() {
  buckets.clear();
}
