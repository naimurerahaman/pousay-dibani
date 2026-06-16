/**
 * Tiny in-memory token-bucket rate limiter.
 *
 * Suitable for a single-instance MVP deploy. For a multi-instance
 * production deploy, swap the Map for a shared store (Upstash Redis,
 * Vercel KV, etc.) — the public `consume` API stays the same.
 */

type Bucket = {
  tokens: number;
  lastRefill: number;
};

type RateLimitConfig = {
  /** Max tokens in the bucket. */
  capacity: number;
  /** Tokens added per millisecond. */
  refillPerMs: number;
};

const buckets = new Map<string, Bucket>();

function getBucket(key: string, config: RateLimitConfig): Bucket {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: config.capacity, lastRefill: now };
    buckets.set(key, bucket);
  } else {
    const elapsed = now - bucket.lastRefill;
    const refilled = elapsed * config.refillPerMs;
    if (refilled > 0) {
      bucket.tokens = Math.min(
        config.capacity,
        bucket.tokens + refilled,
      );
      bucket.lastRefill = now;
    }
  }

  return bucket;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

/**
 * Try to consume one token from the bucket for `key`.
 * Returns whether the request is allowed, remaining tokens, and
 * (if blocked) how long until the next token is available.
 */
export function consume(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const bucket = getBucket(key, config);
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterMs: 0 };
  }

  const deficit = 1 - bucket.tokens;
  const retryAfterMs = Math.ceil(deficit / config.refillPerMs);
  return { allowed: false, remaining: 0, retryAfterMs };
}

/**
 * Best-effort key extraction for a request: prefers x-forwarded-for,
 * falls back to x-real-ip, then to "unknown".
 */
export function getClientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

// Periodically prune stale buckets to keep memory bounded.
// Every 10 minutes, drop buckets that are already at full capacity.
const TEN_MINUTES = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    const elapsed = now - bucket.lastRefill;
    if (elapsed > TEN_MINUTES && bucket.tokens >= 1) {
      buckets.delete(key);
    }
  }
}, TEN_MINUTES).unref?.();
