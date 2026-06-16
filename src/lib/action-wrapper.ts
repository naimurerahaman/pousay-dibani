import { report } from "@/lib/monitoring";

/**
 * Wraps a server action so that any thrown error is:
 *   1. Logged + reported via Sentry (if configured)
 *   2. Converted to a structured `{ ok: false, error }` return value
 *      so the client sees a friendly error instead of a hard 500.
 *
 * Usage:
 *   export const myAction = withErrorHandling("myAction", async (input) => { ... });
 */
export function withErrorHandling<Args extends unknown[], R>(
  name: string,
  fn: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<R | { ok: false; error: string }> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      await report({
        message: `Server action "${name}" failed`,
        error,
        context: { name, argsPreview: safeArgsPreview(args) },
      });

      const message =
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong. Please try again.";

      return { ok: false, error: message };
    }
  };
}

function safeArgsPreview(args: unknown[]) {
  try {
    return args.map((arg) => {
      if (arg == null) return arg;
      if (typeof arg === "string") return arg.length > 200 ? `${arg.slice(0, 200)}…` : arg;
      if (typeof arg === "number" || typeof arg === "boolean") return arg;
      return "<object>";
    });
  } catch {
    return ["<unserializable>"];
  }
}
