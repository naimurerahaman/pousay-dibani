import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Read lazily so the config can load even when DATABASE_URL isn't
    // set in the environment (e.g. during `prisma generate` from `postinstall`
    // on a fresh Vercel deploy before env vars are injected).
    url: process.env.DATABASE_URL ?? "",
  },
});
