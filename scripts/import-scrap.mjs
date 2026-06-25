/**
 * Import the scraped Shwapno catalog (scrap/shwapno-com-*.csv) into the store,
 * mapping each scraped category into the store's EXISTING categories (no new
 * categories are created). Product names are derived from the image filenames;
 * the scrape has no prices, so every product gets a PLACEHOLDER price to review
 * in /admin/products.
 *
 * Usage:
 *   node scripts/import-scrap.mjs --dry-run        # parse + report, no DB
 *   node scripts/import-scrap.mjs                  # import everything
 *   node scripts/import-scrap.mjs --per-category=15
 *   node scripts/import-scrap.mjs --limit=200
 *
 * Or via npm (loads .env): npm run import:scrap
 */

import { readFileSync, existsSync } from "node:fs";

const DRY_RUN = process.argv.includes("--dry-run");
const numArg = (name, def) => {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  const n = a ? Number.parseInt(a.split("=")[1], 10) : def;
  return Number.isFinite(n) && n > 0 ? n : def;
};
const PER_CATEGORY = numArg("per-category", Infinity);
const LIMIT = numArg("limit", Infinity);

const CSV_PATH = "scrap/shwapno-com-2026-06-22.csv";

// Map each scraped Shwapno category to one of the store's EXISTING category ids.
const FALLBACK_CATEGORY = "fresh";
const CATEGORY_MAP = {
  "Soup": "soup",
  "Atta Maida & Suji": "atta-maida-and-suji",
  "Sauces & Pickles": "sauces-and-pickles",
  "Sauces": "sauces-and-pickles",
  "Fashion & Lifestyle": "fashion-and-lifestyle",
  "Toys & Sports": "toys-sports",
  "Home Cleaning": "household",
  "Conditioners": "household",
  "Shampoo": "household",
  "Baby Food & Care": "baby-corner",
  "Liquid & UHT Milk": "dairy",
  "Powder Milk": "dairy",
  "Butter": "dairy",
  "Yogurt": "dairy",
  "Cereals": "dairy",
  "Honey": "fresh",
  "Salt & Sugar": "fresh",
  "Spices": "fresh",
  "Oil": "fresh",
  "Baking Needs": "fresh",
  "Breads": "fresh",
  "Noodles": "fresh",
  "Eggs": "fresh",
  "Fresh Fruits": "fruits-vegetables",
  "Fresh Vegetables": "fruits-vegetables",
  "Fish": "meat-fish",
  "Meat": "meat-fish",
  "Frozen": "meat-fish",
  "Chips & Pretzels": "snacks-drinks",
  "Candy & Chocolate": "snacks-drinks",
  "Biscuits": "snacks-drinks",
  "Juice": "drinks-beverages",
  "Coffee": "drinks-beverages",
  "Tea": "drinks-beverages",
  "Soft Drinks": "drinks-beverages",
  "Ice Cream": "ice-cream",
};

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\r") { /* skip */ }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function decodeImage(u) {
  const m = u.match(/[?&]url=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : u;
}

function nameFromUrl(u) {
  const file = decodeImage(u).split("/").pop().replace(/\.\w+$/, "");
  return file
    .replace(/^[0-9a-f]{16,}_/, "")
    .replace(/_\d+_\d+$/, "")
    .replace(/_\d+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[A-Za-z]?\d{4,}\s+/, "")
    .trim();
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}

function placeholderPrice(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 50 + (h % 91) * 5; // 50..500, multiples of 5
}

function build() {
  const rows = parseCSV(readFileSync(CSV_PATH, "utf8"));
  const header = rows[0].map((h) => h.replace(/^﻿/, ""));
  const cData = header.indexOf("data");
  const cImg1 = header.indexOf("image_1");
  const dataRows = rows.slice(1).filter((r) => r.length >= header.length - 2);

  const products = [];
  const seenSlugs = new Set();
  const unmapped = new Set();

  for (const r of dataRows) {
    const catName = (r[cData] || "").trim();
    if (!catName) continue;
    let categoryId = CATEGORY_MAP[catName];
    if (!categoryId) { unmapped.add(catName); categoryId = FALLBACK_CATEGORY; }

    const imgs = (r[cImg1] || "")
      .split(/\n/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http") && !/default-product/.test(s));

    let perCat = 0;
    for (const raw of imgs) {
      if (perCat >= PER_CATEGORY) break;
      const name = nameFromUrl(raw);
      if (!name || !/[A-Za-z]{2,}/.test(name)) continue;
      const slug = slugify(name);
      if (!slug || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);
      perCat++;
      products.push({
        name: name.slice(0, 120),
        slug,
        description: `${name}. Imported from scraped Shwapno catalog — set the real price in admin.`.slice(0, 1000),
        price: placeholderPrice(name),
        unit: "1 pack",
        imageUrl: decodeImage(raw),
        stockStatus: "IN_STOCK",
        isActive: true,
        isFeatured: false,
        categoryId,
      });
    }
  }

  const finalProducts = Number.isFinite(LIMIT) ? products.slice(0, LIMIT) : products;
  return { products: finalProducts, unmapped: [...unmapped] };
}

async function main() {
  if (!existsSync(CSV_PATH)) throw new Error(`CSV not found at ${CSV_PATH}`);
  console.log(`Importing scraped catalog (dryRun=${DRY_RUN}, perCategory=${PER_CATEGORY}, limit=${LIMIT})...`);

  const { products, unmapped } = build();
  if (unmapped.length) console.log(`Note: unmapped scraped categories sent to "${FALLBACK_CATEGORY}": ${unmapped.join(", ")}`);

  const byCat = {};
  for (const p of products) byCat[p.categoryId] = (byCat[p.categoryId] || 0) + 1;
  console.log(`Prepared ${products.length} products. Distribution across existing categories:`);
  for (const [cat, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) console.log(`  ${cat}: ${n}`);

  if (DRY_RUN) {
    console.log("\nDry run complete — nothing written to the database.");
    return;
  }

  const connectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set. Run `npm run import:scrap` (loads .env).");

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

  try {
    // Only assign products to categories that actually exist in the DB.
    const existing = new Set((await prisma.category.findMany({ select: { id: true } })).map((c) => c.id));
    const missingTargets = [...new Set(products.map((p) => p.categoryId))].filter((id) => !existing.has(id));
    if (missingTargets.length) {
      throw new Error(
        `These mapped category ids don't exist in the DB: ${missingTargets.join(", ")}. ` +
        `Update CATEGORY_MAP in scripts/import-scrap.mjs to match your categories.`,
      );
    }

    console.log(`Upserting ${products.length} products...`);
    let i = 0;
    for (const p of products) {
      const data = {
        name: p.name, slug: p.slug, description: p.description, price: p.price,
        unit: p.unit, imageUrl: p.imageUrl, stockStatus: p.stockStatus,
        isActive: p.isActive, isFeatured: p.isFeatured, categoryId: p.categoryId,
      };
      // Seed a starting stock on first insert; never clobber admin-adjusted stock on re-import.
      await prisma.product.upsert({ where: { slug: p.slug }, update: data, create: { ...data, stockQty: 50 } });
      if (++i % 100 === 0) console.log(`  ...${i}/${products.length}`);
    }

    console.log(`Import complete: ${products.length} products upserted into existing categories.`);
    console.log("Reminder: all prices are placeholders — set real prices in /admin/products.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
