/**
 * One-time backfill: give existing products a starting stock quantity.
 *
 * The `stockQty` column was added with a default of 0, which would mark the
 * whole existing catalog as out-of-stock under the new availability rule.
 * This sets a sane starting stock for products that still sit at 0, while
 * respecting any product explicitly marked OUT_OF_STOCK.
 *
 * Usage:
 *   node scripts/backfill-stock.mjs --dry-run   # report only
 *   node scripts/backfill-stock.mjs             # apply (default qty 50)
 *   node scripts/backfill-stock.mjs --qty=100
 *
 * Or via npm (loads .env): npm run backfill:stock
 */

const DRY_RUN = process.argv.includes("--dry-run");
const qtyArg = process.argv.find((a) => a.startsWith("--qty="));
const QTY = qtyArg ? Number.parseInt(qtyArg.split("=")[1], 10) : 50;

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Run `npm run backfill:stock` (loads .env).");
  }

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

  try {
    const target = await prisma.product.count({
      where: { stockQty: { lte: 0 }, stockStatus: { not: "OUT_OF_STOCK" } },
    });
    console.log(`Products at zero stock (not explicitly out-of-stock): ${target}`);

    if (DRY_RUN) {
      console.log(`Dry run — would set stockQty=${QTY} on ${target} products.`);
      return;
    }

    const result = await prisma.product.updateMany({
      where: { stockQty: { lte: 0 }, stockStatus: { not: "OUT_OF_STOCK" } },
      data: { stockQty: QTY },
    });
    console.log(`Backfill complete: set stockQty=${QTY} on ${result.count} products.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
