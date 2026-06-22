/**
 * Remove the earlier demo/seed/Open Food Facts products, keeping ONLY the
 * scraped Shwapno catalog (whose photos are hosted on CloudFront).
 *
 * Rule: keep products whose imageUrl is on d2t8nl1y0ie1km.cloudfront.net;
 * delete everything else (Unsplash seed + curated staples + Open Food Facts).
 *
 * Existing orders are unaffected: OrderItem stores the product name and its
 * productId link is set to null on delete (schema onDelete: SetNull).
 *
 * Usage:
 *   node scripts/cleanup-products.mjs            # preview only (no changes)
 *   node scripts/cleanup-products.mjs --confirm  # actually delete
 *
 * Or via npm (loads .env): npm run cleanup:dummy -- --confirm
 */

const KEEP_HOST = "d2t8nl1y0ie1km.cloudfront.net";
const CONFIRM = process.argv.includes("--confirm");

async function main() {
  const connectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set. Run via `npm run cleanup:dummy`.");

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

  try {
    const total = await prisma.product.count();
    const keep = await prisma.product.count({ where: { imageUrl: { contains: KEEP_HOST } } });
    const toDelete = total - keep;

    console.log(`Products total: ${total}`);
    console.log(`  keep (scraped, on ${KEEP_HOST}): ${keep}`);
    console.log(`  delete (everything else): ${toDelete}`);

    // Show a few examples of what would be deleted.
    const sample = await prisma.product.findMany({
      where: { NOT: { imageUrl: { contains: KEEP_HOST } } },
      select: { name: true, imageUrl: true },
      take: 10,
    });
    if (sample.length) {
      console.log("\nExamples to delete:");
      for (const p of sample) console.log(`  - ${p.name}  (${p.imageUrl.split("/")[2]})`);
    }

    if (!CONFIRM) {
      console.log("\nPREVIEW ONLY — nothing deleted. Re-run with --confirm to delete.");
      return;
    }

    const result = await prisma.product.deleteMany({
      where: { NOT: { imageUrl: { contains: KEEP_HOST } } },
    });
    const remaining = await prisma.product.count();
    console.log(`\nDeleted ${result.count} products. Remaining: ${remaining} (all scraped).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
