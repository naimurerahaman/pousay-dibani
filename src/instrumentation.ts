/**
 * Next.js instrumentation entrypoint. `register()` runs once when the server
 * process starts. We use it to install process-level error hooks (Node runtime
 * only — the edge runtime has no `process.on`).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { installErrorHooks } = await import("@/lib/boot");
    installErrorHooks();
  }
}
