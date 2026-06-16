/**
 * Lightweight server-side error reporting.
 *
 * In every environment: log a structured error line to stdout (Vercel picks
 * this up as a normal log line).
 *
 * If `SENTRY_DSN` is set, also POST the error to Sentry's envelope endpoint.
 * This avoids adding the Sentry SDK as a dependency for the MVP — when you
 * need richer tracing, swap to `@sentry/nextjs` and remove the manual fetch.
 */

type Severity = "info" | "warning" | "error";

type ReportInput = {
  message: string;
  severity?: Severity;
  error?: unknown;
  context?: Record<string, unknown>;
};

const SENTRY_DSN = process.env.SENTRY_DSN;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { message: String(error) };
}

async function sendToSentry(payload: {
  message: string;
  level: Severity;
  exception?: ReturnType<typeof serializeError>;
  context?: Record<string, unknown>;
  timestamp: number;
}) {
  if (!SENTRY_DSN) return;

  try {
    const url = new URL("/api/1/envelope/", SENTRY_DSN);
    const projectId = url.pathname.split("/").filter(Boolean).pop() ?? "0";

    const envelope = [
      { event_id: crypto.randomUUID(), sent_at: new Date().toISOString() },
      {
        event_id: crypto.randomUUID(),
        platform: "javascript",
        level: payload.level,
        message: { formatted: payload.message },
        exception:
          payload.exception ?
            { values: [{ type: payload.exception.name, value: payload.exception.message, stacktrace: payload.exception.stack }] }
            : undefined,
        extra: payload.context,
        timestamp: payload.timestamp / 1000,
      },
    ];

    await fetch(`https://${url.hostname}/api/${projectId}/store/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body: JSON.stringify(envelope),
    });
  } catch {
    // Never let monitoring break the request.
  }
}

export async function report(input: ReportInput) {
  const severity = input.severity ?? "error";
  const exception = input.error ? serializeError(input.error) : undefined;

  const payload = {
    message: input.message,
    level: severity,
    exception,
    context: input.context,
    timestamp: Date.now(),
  };

  // Always log structured.
  console[severity === "info" ? "info" : severity === "warning" ? "warn" : "error"](
    JSON.stringify({
      tag: "pousay-dibani.report",
      ...payload,
    }),
  );

  // Best-effort Sentry forwarding.
  if (SENTRY_DSN) {
    void sendToSentry(payload);
  }
}
