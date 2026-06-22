/**
 * Import real Bangladeshi grocery products (with photos) from Open Food Facts
 * into the Pousay Dibani catalog.
 *
 * Source: Open Food Facts (https://openfoodfacts.org), an open, ODbL-licensed
 * product database. Read access is free and needs no key — only a descriptive
 * User-Agent. We filter to products sold in Bangladesh, keep only the clean
 * ones (real name + real front photo + a category we recognise), and upsert
 * them by slug. A small curated set of staples (rice, oil, daal, …) is added
 * so the catalog isn't snack-only.
 *
 * Prices: Open Food Facts has no Bangladesh prices, so each imported item gets
 * a PLACEHOLDER price you must review in /admin/products before relying on it.
 *
 * Usage:
 *   node scripts/import-grocery.mjs            # import into the DB (needs DATABASE_URL)
 *   node scripts/import-grocery.mjs --dry-run  # fetch + filter + print only, no DB
 *   node scripts/import-grocery.mjs --limit=40 # cap the number of OFF items
 *
 * Or via npm (loads .env): npm run import:grocery
 */

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = (() => {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  const n = arg ? Number.parseInt(arg.split("=")[1], 10) : 30;
  return Number.isFinite(n) && n > 0 ? n : 30;
})();

const USER_AGENT = "PousayDibani/1.0 (Khulna grocery delivery; import script)";
const OFF_HOST = "images.openfoodfacts.org";

// Categories the importer ensures exist (upserted). The four originals from the
// seed plus two that fit imported packaged goods.
const CATEGORIES = [
  { id: "fresh", name: "Fresh groceries", slug: "fresh-groceries", description: "Rice, oil, lentils, vegetables, eggs, and daily kitchen needs.", isActive: true },
  { id: "snacks-drinks", name: "Snacks & Drinks", slug: "snacks-drinks", description: "Biscuits, chips, chocolates, soft drinks, water, juice, and tea.", isActive: true },
  { id: "dairy", name: "Dairy & Breakfast", slug: "dairy-breakfast", description: "Milk, powdered milk, cheese, butter, ghee, and cereals.", isActive: true },
  { id: "household", name: "Household essentials", slug: "household-essentials", description: "Cleaning, toiletries, and home maintenance supplies.", isActive: true },
];

// Map an Open Food Facts categories_tags array to one of our category ids.
function mapCategory(tags) {
  const t = (tags || []).join(" ").toLowerCase();
  const has = (...words) => words.some((w) => t.includes(w));

  if (has("dairy", "milk", "cheese", "yogurt", "yoghurt", "butter", "ghee", "cereal", "breakfast")) return "dairy";
  if (has("beverage", "drink", "water", "juice", "soda", "soft-drink", "tea", "coffee", "snack", "chip", "crisp", "chocolate", "candy", "confection", "biscuit", "cookie", "cake", "sweet", "noodle")) return "snacks-drinks";
  if (has("cleaning", "detergent", "household", "home-care", "soap", "shampoo", "toiletr")) return "household";
  if (has("rice", "flour", "oil", "pulse", "lentil", "legume", "spice", "sugar", "salt", "grocer", "staple")) return "fresh";
  return null; // unknown -> skip (keeps the catalog clean)
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}

// Deterministic placeholder price (taka) per category, so re-runs are stable.
function placeholderPrice(name, categoryId) {
  const ranges = {
    "snacks-drinks": [20, 160],
    dairy: [60, 320],
    household: [80, 350],
    fresh: [40, 300],
  };
  const [min, max] = ranges[categoryId] || [50, 200];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const span = max - min;
  return min + (h % span) - ((min + (h % span)) % 5); // round to nearest 5
}

function cleanName(raw) {
  if (!raw) return null;
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 3 || name.length > 80) return null;
  if (!/[a-zA-Zঀ-৿]/.test(name)) return null; // must contain letters (skip barcodes)
  if (/^\d{6,}$/.test(name)) return null;
  return name;
}

// A curated staples backbone (Unsplash photos are already allowed by the app).
const CURATED = [
  { name: "Soybean Oil", unit: "1 L bottle", price: 175, categoryId: "fresh", featured: true, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80", description: "Refined soybean cooking oil for everyday Bangladeshi cooking." },
  { name: "Masoor Daal (Red Lentil)", unit: "1 kg pack", price: 140, categoryId: "fresh", featured: true, image: "https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=900&q=80", description: "Premium red lentils, a staple for daily daal." },
  { name: "Atta (Wheat Flour)", unit: "2 kg pack", price: 120, categoryId: "fresh", featured: false, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80", description: "Whole wheat atta for roti and paratha." },
  { name: "Sugar", unit: "1 kg pack", price: 130, categoryId: "fresh", featured: false, image: "https://images.unsplash.com/photo-1581600140682-d4e68c8cde32?auto=format&fit=crop&w=900&q=80", description: "Refined white sugar for tea, sweets, and cooking." },
  { name: "Iodised Salt", unit: "1 kg pack", price: 40, categoryId: "fresh", featured: false, image: "https://images.unsplash.com/photo-1518110925495-7f6f6e9b07b5?auto=format&fit=crop&w=900&q=80", description: "Free-flowing iodised table salt." },
  { name: "Onion", unit: "1 kg", price: 60, categoryId: "fresh", featured: true, image: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fit=crop&w=900&q=80", description: "Fresh onions for everyday cooking." },
  { name: "Potato", unit: "1 kg", price: 35, categoryId: "fresh", featured: false, image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=80", description: "Fresh potatoes sourced locally." },
  { name: "Green Chili", unit: "250 g", price: 30, categoryId: "fresh", featured: false, image: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?auto=format&fit=crop&w=900&q=80", description: "Fresh green chilies for daily cooking." },
  { name: "Powdered Milk", unit: "500 g pack", price: 420, categoryId: "dairy", featured: true, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80", description: "Instant full-cream milk powder for tea and breakfast." },
  { name: "Loose Tea", unit: "400 g pack", price: 230, categoryId: "snacks-drinks", featured: false, image: "https://images.unsplash.com/photo-1523920290228-4f321a939b4c?auto=format&fit=crop&w=900&q=80", description: "Strong black tea leaves for everyday cha." },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Open Food Facts rate-limits its search API and intermittently returns 503.
// Retry a few times with exponential backoff before giving up on a page.
async function fetchJsonWithRetry(url, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      if (res.ok) return await res.json();
      if (res.status === 503 || res.status === 429) {
        const wait = 1500 * 2 ** i;
        console.warn(`  OFF HTTP ${res.status}; retrying in ${Math.round(wait / 1000)}s (attempt ${i + 1}/${attempts})...`);
        await sleep(wait);
        continue;
      }
      console.warn(`  OFF HTTP ${res.status}; giving up on this page.`);
      return null;
    } catch (err) {
      const wait = 1500 * 2 ** i;
      console.warn(`  OFF fetch error (${err.message}); retrying in ${Math.round(wait / 1000)}s...`);
      await sleep(wait);
    }
  }
  return null;
}

async function fetchOffProducts() {
  const collected = [];
  const seenSlugs = new Set();
  const perCategoryCount = {};

  for (let page = 1; page <= 4 && collected.length < LIMIT; page++) {
    const url =
      "https://world.openfoodfacts.org/api/v2/search" +
      "?countries_tags_en=Bangladesh" +
      "&fields=code,product_name,brands,quantity,categories_tags,image_front_url" +
      "&page_size=100&sort_by=unique_scans_n&page=" +
      page;

    if (page > 1) await sleep(1500); // be polite between pages

    const json = await fetchJsonWithRetry(url);
    if (!json) {
      console.warn(`  OFF page ${page} unavailable after retries; continuing with what we have.`);
      break;
    }

    const products = json.products || [];
    if (products.length === 0) break;

    for (const p of products) {
      if (collected.length >= LIMIT) break;

      const name = cleanName(p.product_name);
      if (!name) continue;

      const image = p.image_front_url;
      if (!image || !image.startsWith(`https://${OFF_HOST}/`)) continue;

      const categoryId = mapCategory(p.categories_tags);
      if (!categoryId) continue;

      // Keep the catalog balanced: cap each category.
      perCategoryCount[categoryId] = perCategoryCount[categoryId] || 0;
      if (perCategoryCount[categoryId] >= 12) continue;

      const slug = slugify(name);
      if (!slug || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);
      perCategoryCount[categoryId]++;

      const brand = (p.brands || "").split(",")[0].trim();
      const unit = (p.quantity || "").trim().slice(0, 40) || "1 pack";

      collected.push({
        name,
        slug,
        description:
          `${brand ? brand + " — " : ""}${name}. Imported from Open Food Facts; review price and details before publishing.`.slice(0, 1000),
        price: placeholderPrice(name, categoryId),
        unit,
        imageUrl: image,
        stockStatus: "IN_STOCK",
        isActive: true,
        isFeatured: false,
        categoryId,
        _source: "openfoodfacts",
      });
    }
  }

  return collected;
}

function curatedProducts() {
  return CURATED.map((c) => ({
    name: c.name,
    slug: slugify(c.name),
    description: c.description,
    price: c.price,
    unit: c.unit,
    imageUrl: c.image,
    stockStatus: "IN_STOCK",
    isActive: true,
    isFeatured: Boolean(c.featured),
    categoryId: c.categoryId,
    _source: "curated",
  }));
}

async function main() {
  console.log(`Importing grocery items (limit=${LIMIT}, dryRun=${DRY_RUN})...`);

  const offItems = await fetchOffProducts();
  const curated = curatedProducts();
  // Curated first so they win any slug collision with an OFF item.
  const bySlug = new Map();
  for (const item of [...curated, ...offItems]) {
    if (!bySlug.has(item.slug)) bySlug.set(item.slug, item);
  }
  const items = [...bySlug.values()];

  console.log(
    `Prepared ${items.length} products (${curated.length} curated staples, ${offItems.length} from Open Food Facts).`,
  );

  if (DRY_RUN) {
    const byCat = {};
    for (const it of items) (byCat[it.categoryId] ||= []).push(it);
    for (const [cat, list] of Object.entries(byCat)) {
      console.log(`\n[${cat}] ${list.length} items:`);
      for (const it of list) {
        console.log(`  - ${it.name}  |  ৳${it.price}  |  ${it.unit}  |  ${it._source}`);
      }
    }
    console.log("\nDry run complete — nothing written to the database.");
    return;
  }

  const connectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Run `npm run import:grocery` (loads .env) or export DATABASE_URL.",
    );
  }

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("@prisma/client");
  const adapter = new PrismaPg(connectionString);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Ensuring categories...");
    for (const c of CATEGORIES) {
      await prisma.category.upsert({
        where: { id: c.id },
        update: { name: c.name, slug: c.slug, description: c.description, isActive: c.isActive },
        create: c,
      });
    }

    console.log("Upserting products...");
    let created = 0;
    let updated = 0;
    for (const it of items) {
      const data = {
        name: it.name,
        slug: it.slug,
        description: it.description,
        price: it.price,
        unit: it.unit,
        imageUrl: it.imageUrl,
        stockStatus: it.stockStatus,
        isActive: it.isActive,
        isFeatured: it.isFeatured,
        categoryId: it.categoryId,
      };
      const existing = await prisma.product.findUnique({ where: { slug: it.slug }, select: { id: true } });
      await prisma.product.upsert({ where: { slug: it.slug }, update: data, create: data });
      if (existing) updated++;
      else created++;
    }

    console.log(`Import complete: ${created} created, ${updated} updated (${items.length} total).`);
    console.log("Reminder: prices are placeholders — review them in /admin/products.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
