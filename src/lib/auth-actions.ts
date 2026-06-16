"use server";

import { headers } from "next/headers";
import { consume, getClientKey } from "@/lib/rate-limit";

// Token bucket: 5 attempts, refilled at 1 token / 12s.
// So 5 quick attempts are allowed, then 1 every 12s after that.
const LOGIN_LIMIT = { capacity: 5, refillPerMs: 1 / 12000 };

export type LoginGateResult =
  | { ok: true }
  | { ok: false; error: string; retryAfterMs: number };

export async function checkLoginRateLimit(): Promise<LoginGateResult> {
  const headerList = await headers();
  const ip = getClientKey(headerList);
  const result = consume(`login:${ip}`, LOGIN_LIMIT);

  if (!result.allowed) {
    const seconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
    return {
      ok: false,
      error: `Too many attempts. Try again in ${seconds}s.`,
      retryAfterMs: result.retryAfterMs,
    };
  }

  return { ok: true };
}
