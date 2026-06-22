import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
  ].find((value) => value?.trim());

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL (or POSTGRES_URL / POSTGRES_PRISMA_URL) is required to initialize Prisma.",
    );
  }

  const adapter = new PrismaPg(connectionString);
  return new PrismaClient({ adapter });
}

let client: PrismaClient | undefined = globalForPrisma.prisma;

function getClient(): PrismaClient {
  if (!client) {
    client = createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
  }
  return client;
}

// Lazy proxy: importing this module never connects or throws. The real client
// is created on first property access (i.e. the first query). This keeps
// `next build` from crashing when no database URL is present (preview deploys,
// CI, local builds) — only code that actually runs a query needs the URL.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const actual = getClient();
    const value = Reflect.get(actual, prop, receiver);
    return typeof value === "function" ? value.bind(actual) : value;
  },
});
