"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the browser console; Vercel captures this on the server side
    // too, but logging on the client helps local debugging.
    console.error("Unhandled error", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="page-shell">
          <main>
            <section className="section empty-state">
              <div>
                <h1>Something went wrong</h1>
                <p>
                  We hit an unexpected error. The team has been notified.
                  Please try again, or come back to the homepage.
                </p>
                {error.digest ? (
                  <p className="muted" style={{ fontSize: "0.85rem" }}>
                    Reference: {error.digest}
                  </p>
                ) : null}
                <div className="hero-actions">
                  <button className="button" type="button" onClick={reset}>
                    Try again
                  </button>
                  <Link className="button-secondary" href="/">
                    Go home
                  </Link>
                </div>
              </div>
            </section>
          </main>
        </div>
      </body>
    </html>
  );
}
