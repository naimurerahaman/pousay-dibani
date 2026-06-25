/**
 * Reset an admin user's password from the command line (lockout recovery).
 *
 * The new password is read from the NEW_ADMIN_PASSWORD env var (preferred, so it
 * never lands in shell history) or as the first CLI argument. The target email
 * defaults to ADMIN_EMAIL.
 *
 * Usage (loads .env):
 *   NEW_ADMIN_PASSWORD='StrongPass123!' npm run reset:admin-password
 *   npm run reset:admin-password -- 'StrongPass123!'
 *   npm run reset:admin-password -- 'StrongPass123!' someone@example.com
 */

import bcrypt from "bcryptjs";

async function main() {
  const newPassword = process.env.NEW_ADMIN_PASSWORD ?? process.argv[2] ?? "";
  const email = (process.argv[3] ?? process.env.ADMIN_EMAIL ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw new Error("No target email. Set ADMIN_EMAIL or pass it as the 2nd argument.");
  }
  if (newPassword.length < 12) {
    throw new Error("New password must be at least 12 characters.");
  }

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Run via `npm run reset:admin-password` (loads .env).");
  }

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

  try {
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (!existing) {
      throw new Error(`No admin user with email ${email}.`);
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.adminUser.update({ where: { email }, data: { passwordHash } });
    console.log(`Password reset for admin: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Reset failed:", err.message ?? err);
  process.exit(1);
});
