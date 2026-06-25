import { describe, it, expect, vi, afterEach } from "vitest";
import { consume, getClientKey } from "@/lib/rate-limit";

const config = { capacity: 3, refillPerMs: 1 / 1000 }; // 3 burst, 1 token/sec

afterEach(() => {
  vi.useRealTimers();
});

describe("rate limiter", () => {
  it("allows up to capacity then blocks", () => {
    const key = `test:${Math.random()}`;
    expect(consume(key, config).allowed).toBe(true);
    expect(consume(key, config).allowed).toBe(true);
    expect(consume(key, config).allowed).toBe(true);
    const blocked = consume(key, config);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("refills tokens over time", () => {
    vi.useFakeTimers();
    const key = `test:${Math.random()}`;
    consume(key, config);
    consume(key, config);
    consume(key, config);
    expect(consume(key, config).allowed).toBe(false);
    // Advance ~1.1s so one token refills.
    vi.advanceTimersByTime(1100);
    expect(consume(key, config).allowed).toBe(true);
  });

  it("extracts the first x-forwarded-for IP", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientKey(headers)).toBe("1.2.3.4");
  });

  it("falls back to unknown when no IP headers are present", () => {
    expect(getClientKey(new Headers())).toBe("unknown");
  });
});
