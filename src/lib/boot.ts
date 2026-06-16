/**
 * Process-level error hooks. Import this from a server entrypoint so it
 * runs once when the server starts.
 *
 * Currently: no-op (Vercel's runtime logs unhandled errors automatically).
 * Future: hook in `report()` for Sentry forwarding.
 */

export function installErrorHooks() {
  // Reserved for future Sentry/error monitoring wiring.
  // Example:
  //   process.on("unhandledRejection", (reason) => report({ message: "unhandledRejection", error: reason }));
  //   process.on("uncaughtException", (error) => report({ message: "uncaughtException", error }));
}
