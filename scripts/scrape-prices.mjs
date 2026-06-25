/**
 * Fetch real prices for the catalog from Shwapno's public search API and write
 * them back to our products.
 *
 * Why this works reliably: our products were imported from Shwapno, and their
 * `imageUrl` points at Shwapno's CloudFront thumbnails
 * (`.../thumbs/<imageId>_<Name>_1_<size>.webp`). Shwapno's search API
 * (`/api/search?q=...`) returns each result's price together with the SAME
 * image (same `<imageId>` prefix). So we match by exact image id — not fuzzy
 * names — which is both precise and robust. A normalized-name match is kept as a
 * lower-confidence fallback.
 *
 * Usage (loads .env):
 *   npm run scrape:prices                 # DRY RUN: writes scrap/price-review.csv only
 *   npm run scrape:prices -- --apply      # update prices for image-id matches
 *   npm run scrape:prices -- --apply --include-name-matches
 *   npm run scrape:prices -- --limit=50 --delay=300
 */

import { writeFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");
const INCLUDE_NAME_MATCHES = process.argv.includes("--include-name-matches");
const numArg = (name, def) => {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  const n = a ? Number.parseInt(a.split("=")[1], 10) : def;
  return Number.isFinite(n) ? n : def;
};
const LIMIT = numArg("limit", Infinity);
const DELAY_MS = numArg("delay", 250);

const SEARCH_URL = "https://www.shwapno.com/api/search";
const UA =
  "Mozilla/5.0 (compatible; PousayDibani-price-sync/1.0; +https://pousay-dibani.vercel.app)";
const REPORT_PATH = "scrap/price-review.csv";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pull the CloudFront image id (24-hex prefix) out of a thumbnail URL. */
function imageIdFromUrl(url) {
  if (!url) return null;
  const file = url.split("/").pop() ?? "";
  const id = file.split("_")[0];
  return /^[0-9a-f]{16,}$/i.test(id) ? id.toLowerCase() : null;
}

function normalizeName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Build a short search query from a product name (first few meaningful words). */
function queryFromName(name) {
  const words = normalizeName(name)
    .split(" ")
    .filter((w) => w && !/^\d+(kg|g|ml|l|pcs|pc|gm)?$/.test(w));
  return words.slice(0, 4).join(" ");
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function fetchSearch(query) {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`search ${res.status} for "${query}"`);
  const json = await res.json();
  return Array.isArray(json.products) ? json.products : [];
}

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Run via `npm run scrape:prices` (loads .env).");
  }

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

  // Caches populated from every API response we see, so one query can resolve
  // many products without extra requests.
  const idToPrice = new Map(); // imageId -> { price, name, seName }
  const nameToPrice = new Map(); // normalizedName -> { price, name, seName }
  const queryCache = new Set();

  function ingest(products) {
    for (const entry of products) {
      const p = entry.product;
      if (!p) continue;
      const priceValue = p?.price?.priceValue;
      if (typeof priceValue !== "number" || priceValue <= 0) continue;
      const imgUrl =
        p?.picture?.largeDeviceUrl?.imageUrl ??
        p?.picture?.largeDeviceUrl?.fullSizeImageUrl ??
        "";
      const id = imageIdFromUrl(imgUrl);
      const rec = { price: Math.round(priceValue), name: p.name, seName: p.seName };
      if (id && !idToPrice.has(id)) idToPrice.set(id, rec);
      const nk = normalizeName(p.name);
      if (nk && !nameToPrice.has(nk)) nameToPrice.set(nk, rec);
    }
  }

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, imageUrl: true, price: true },
      orderBy: { name: "asc" },
    });
    const work = Number.isFinite(LIMIT) ? products.slice(0, LIMIT) : products;
    console.log(`Matching ${work.length} products against Shwapno (apply=${APPLY})...`);

    const rows = [];
    let imageMatches = 0;
    let nameMatches = 0;
    let unmatched = 0;
    let requests = 0;

    for (let i = 0; i < work.length; i++) {
      const product = work[i];
      const imgId = imageIdFromUrl(product.imageUrl);
      const nameKey = normalizeName(product.name);

      // Only hit the network if we can't already resolve this product.
      const resolvable = () =>
        (imgId && idToPrice.has(imgId)) || nameToPrice.has(nameKey);
      if (!resolvable()) {
        const query = queryFromName(product.name) || nameKey;
        if (query && !queryCache.has(query)) {
          queryCache.add(query);
          try {
            const results = await fetchSearch(query);
            ingest(results);
            requests++;
          } catch (err) {
            console.warn(`  ! ${product.name}: ${err.message}`);
          }
          await sleep(DELAY_MS);
        }
      }

      let confidence = "none";
      let match = null;
      if (imgId && idToPrice.has(imgId)) {
        match = idToPrice.get(imgId);
        confidence = "image";
        imageMatches++;
      } else if (nameToPrice.has(nameKey)) {
        match = nameToPrice.get(nameKey);
        confidence = "name";
        nameMatches++;
      } else {
        unmatched++;
      }

      rows.push({
        slug: product.slug,
        name: product.name,
        oldPrice: product.price,
        matchedName: match?.name ?? "",
        newPrice: match?.price ?? "",
        confidence,
      });

      if ((i + 1) % 100 === 0) {
        console.log(
          `  ...${i + 1}/${work.length} (img:${imageMatches} name:${nameMatches} none:${unmatched}, ${requests} requests)`,
        );
      }
    }

    // Write the review report regardless of mode.
    const header = "slug,name,oldPrice,matchedName,newPrice,confidence";
    const csv =
      header +
      "\n" +
      rows
        .map((r) =>
          [r.slug, r.name, r.oldPrice, r.matchedName, r.newPrice, r.confidence]
            .map(csvEscape)
            .join(","),
        )
        .join("\n");
    writeFileSync(REPORT_PATH, csv, "utf8");
    console.log(`\nReport written to ${REPORT_PATH}`);
    console.log(
      `Summary: ${imageMatches} image matches, ${nameMatches} name matches, ${unmatched} unmatched (of ${work.length}).`,
    );

    if (!APPLY) {
      console.log("\nDry run — no prices written. Re-run with --apply to update.");
      return;
    }

    const applicable = rows.filter(
      (r) =>
        r.newPrice &&
        (r.confidence === "image" ||
          (INCLUDE_NAME_MATCHES && r.confidence === "name")),
    );
    console.log(`Applying ${applicable.length} price updates...`);
    let applied = 0;
    for (const r of applicable) {
      if (r.newPrice === r.oldPrice) continue;
      await prisma.product.update({
        where: { slug: r.slug },
        data: { price: r.newPrice },
      });
      if (++applied % 100 === 0) console.log(`  ...${applied}/${applicable.length}`);
    }
    console.log(`Done. Updated ${applied} prices. Unmatched products keep their old price.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Price scrape failed:", err);
  process.exit(1);
});
