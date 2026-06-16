#!/usr/bin/env node
/**
 * Smoke test for a running Pousay Dibani deployment.
 *
 * Usage:
 *   node scripts/smoke-test.mjs
 *   BASE_URL=https://pousay-dibani.vercel.app node scripts/smoke-test.mjs
 *
 * Asserts that:
 *   - GET /              -> 200, body contains "Pousay Dibani"
 *   - GET /products      -> 200, body contains "Products"
 *   - GET /admin/login   -> 200, body contains "Admin sign in"
 *   - GET /admin         -> 200 or 307 (redirects to login when unauthed)
 *   - GET /api/auth/session -> 200
 *
 * Exits 0 on success, 1 on any failure.
 */

import process from "node:process";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const checks = [
  {
    name: "home page",
    path: "/",
    expectStatus: (s) => s === 200,
    expectBody: (body) => body.includes("Pousay Dibani"),
  },
  {
    name: "products page",
    path: "/products",
    expectStatus: (s) => s === 200,
    expectBody: (body) => body.includes("Products"),
  },
  {
    name: "cart page",
    path: "/cart",
    expectStatus: (s) => s === 200,
    expectBody: (body) => body.length > 0,
  },
  {
    name: "order status page",
    path: "/order-status",
    expectStatus: (s) => s === 200,
    expectBody: (body) => body.includes("Order status"),
  },
  {
    name: "admin login page",
    path: "/admin/login",
    expectStatus: (s) => s === 200,
    expectBody: (body) => body.includes("Admin sign in"),
  },
  {
    name: "admin dashboard (expects redirect to login when unauthed)",
    path: "/admin",
    expectStatus: (s) => s === 200 || s === 307,
    expectBody: (body) => body.length > 0,
  },
  {
    name: "auth.js session endpoint",
    path: "/api/auth/session",
    expectStatus: (s) => s === 200,
    expectBody: (body) => body !== null,
  },
];

async function run() {
  console.log(`Smoke testing ${BASE_URL}\n`);

  let failures = 0;
  for (const check of checks) {
    const url = `${BASE_URL}${check.path}`;
    try {
      const res = await fetch(url, { redirect: "manual" });
      const status = res.status;
      const body = res.headers.get("content-type")?.includes("text/html")
        ? await res.text()
        : await res.text();

      const statusOk = check.expectStatus(status);
      const bodyOk = check.expectBody(body);
      const ok = statusOk && bodyOk;

      const statusLabel = ok ? "OK" : "FAIL";
      console.log(
        `  [${statusLabel}] ${check.name.padEnd(48)} ${String(status).padEnd(4)} ${check.path}`,
      );
      if (!ok) {
        if (!statusOk) {
          console.log(`         expected status check to pass, got ${status}`);
        }
        if (!bodyOk) {
          console.log(`         body assertion failed`);
        }
        failures += 1;
      }
    } catch (error) {
      console.log(`  [FAIL] ${check.name.padEnd(48)} ERR   ${check.path}`);
      console.log(`         ${(error instanceof Error ? error.message : String(error))}`);
      failures += 1;
    }
  }

  console.log("");
  if (failures === 0) {
    console.log(`All ${checks.length} smoke checks passed.`);
    process.exit(0);
  } else {
    console.error(`${failures}/${checks.length} smoke checks failed.`);
    process.exit(1);
  }
}

run();
