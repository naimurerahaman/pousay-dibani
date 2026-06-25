/**
 * Process-level error hooks. Invoked once from `src/instrumentation.ts` when the
 * server starts (Node runtime only). Routes otherwise-unhandled errors through
 * `report()` so they land in structured logs (and Sentry if configured).
 */

import { report } from "@/lib/monitoring";

let installed = false;

export function installErrorHooks() {
  if (installed) return;
  installed = true;

  process.on("unhandledRejection", (reason) => {
    void report({
      message: "unhandledRejection",
      severity: "error",
      error: reason,
    });
  });

  process.on("uncaughtException", (error) => {
    void report({
      message: "uncaughtException",
      severity: "error",
      error,
    });
  });
}
