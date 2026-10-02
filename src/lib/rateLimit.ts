import { NextRequest } from "next/server";
import { ApiError } from "@/lib/auth";

/**
 * Small in-memory sliding-window limiter for unauthenticated endpoints
 * (register, contact, newsletter). State is per server instance; run behind a
 * shared store (e.g. Redis) if the app is scaled horizontally.
 */
const buckets = new Map<string, number[]>();

export function clientKey(req: NextRequest | Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip")) || "local";
}

export function rateLimit(req: NextRequest | Request, bucket: string, max: number, windowMs: number) {
  const key = `${bucket}:${clientKey(req)}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please wait a moment and try again.");
  }
  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
}
