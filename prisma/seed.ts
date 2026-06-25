import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

type CategorySeed = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

type ProductSeed = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  unit: string;
  imageUrl: string;
  stockStatus: "IN_STOCK" | "LIMITED" | "OUT_OF_STOCK";
  stockQty?: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
};

type DeliveryAreaSeed = {
  id: string;
  name: string;
  slug: string;
  deliveryFee: number;
  isActive: boolean;
};

const categories: CategorySeed[] = [
  {
    id: "fresh",
    name: "Fresh groceries",
    slug: "fresh-groceries",
    description: "Rice, vegetables, fruits, eggs, and daily kitchen needs.",
    isActive: true,
  },
  {
    id: "household",
    name: "Household essentials",
    slug: "household-essentials",
    description: "Cleaning, toiletries, and home maintenance supplies.",
    isActive: true,
  },
  {
    id: "pharmacy",
    name: "Health basics",
    slug: "health-basics",
    description: "Common wellness and care products for home delivery.",
    isActive: true,
  },
  {
    id: "stationery",
    name: "Stationery",
    slug: "stationery",
    description: "Student and office supplies delivered across Khulna.",
    isActive: true,
  },
];

const products: ProductSeed[] = [
  {
    id: "miniket-rice-5kg",
    name: "Miniket Rice",
    slug: "miniket-rice-5kg",
    description: "Premium everyday rice packed for family kitchen use.",
    price: 420,
    unit: "5 kg bag",
    imageUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80",
    stockStatus: "IN_STOCK",
    isActive: true,
    isFeatured: true,
    categoryId: "fresh",
  },
  {
    id: "farm-eggs-12",
    name: "Farm Eggs",
    slug: "farm-eggs-12",
    description: "Fresh eggs sourced daily from local suppliers.",
    price: 150,
    unit: "12 pcs",
    imageUrl:
      "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=900&q=80",
    stockStatus: "LIMITED",
    isActive: true,
    isFeatured: true,
    categoryId: "fresh",
  },
  {
    id: "seasonal-vegetable-pack",
    name: "Vegetable Pack",
    slug: "seasonal-vegetable-pack",
    description: "A mixed basket of seasonal vegetables for daily cooking.",
    price: 280,
    unit: "bundle",
    imageUrl:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80",
    stockStatus: "IN_STOCK",
    isActive: true,
    isFeatured: true,
    categoryId: "fresh",
  },
  {
    id: "laundry-detergent",
    name: "Laundry Detergent",
    slug: "laundry-detergent",
    description: "Effective detergent powder for regular household laundry.",
    price: 190,
    unit: "1 kg pack",
    imageUrl:
      "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?auto=format&fit=crop&w=900&q=80",
    stockStatus: "IN_STOCK",
    isActive: true,
    isFeatured: false,
    categoryId: "household",
  },
  {
    id: "dishwash-liquid",
    name: "Dishwash Liquid",
    slug: "dishwash-liquid",
    description: "Kitchen cleaning liquid for plates, pans, and utensils.",
    price: 125,
    unit: "500 ml",
    imageUrl:
      "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=900&q=80",
    stockStatus: "IN_STOCK",
    isActive: true,
    isFeatured: false,
    categoryId: "household",
  },
  {
    id: "hand-sanitizer",
    name: "Hand Sanitizer",
    slug: "hand-sanitizer",
    description: "Pocket-friendly sanitizer for home, office, and travel.",
    price: 90,
    unit: "100 ml",
    imageUrl:
      "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=900&q=80",
    stockStatus: "IN_STOCK",
    isActive: true,
    isFeatured: true,
    categoryId: "pharmacy",
  },
  {
    id: "notebook-set",
    name: "Notebook Set",
    slug: "notebook-set",
    description: "Ruled notebooks for school, college, and office work.",
    price: 220,
    unit: "4 pcs",
    imageUrl:
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80",
    stockStatus: "IN_STOCK",
    isActive: true,
    isFeatured: false,
    categoryId: "stationery",
  },
  {
    id: "ball-pen-pack",
    name: "Ball Pen Pack",
    slug: "ball-pen-pack",
    description: "Smooth writing pens for students and daily office use.",
    price: 80,
    unit: "10 pcs",
    imageUrl:
      "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=900&q=80",
    stockStatus: "IN_STOCK",
    isActive: true,
    isFeatured: false,
    categoryId: "stationery",
  },
];

const deliveryAreas: DeliveryAreaSeed[] = [
  {
    id: "sonadanga",
    name: "Sonadanga",
    slug: "sonadanga",
    deliveryFee: 60,
    isActive: true,
  },
  {
    id: "khalishpur",
    name: "Khalishpur",
    slug: "khalishpur",
    deliveryFee: 60,
    isActive: true,
  },
  {
    id: "daulatpur",
    name: "Daulatpur",
    slug: "daulatpur",
    deliveryFee: 80,
    isActive: true,
  },
  {
    id: "boyra",
    name: "Boyra",
    slug: "boyra",
    deliveryFee: 70,
    isActive: true,
  },
  {
    id: "new-market",
    name: "New Market",
    slug: "new-market",
    deliveryFee: 60,
    isActive: true,
  },
];

async function seedCatalog(prisma: PrismaClient) {
  console.log("Seeding categories...");
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: category.isActive,
      },
      create: category,
    });
  }

  console.log("Seeding products...");
  for (const product of products) {
    // Default starting stock derived from the display status when not set.
    const stockQty =
      product.stockQty ??
      (product.stockStatus === "OUT_OF_STOCK"
        ? 0
        : product.stockStatus === "LIMITED"
          ? 8
          : 50);
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        unit: product.unit,
        imageUrl: product.imageUrl,
        stockStatus: product.stockStatus,
        stockQty,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        categoryId: product.categoryId,
      },
      create: { ...product, stockQty },
    });
  }

  console.log("Seeding delivery areas...");
  for (const area of deliveryAreas) {
    await prisma.deliveryArea.upsert({
      where: { id: area.id },
      update: {
        name: area.name,
        slug: area.slug,
        deliveryFee: area.deliveryFee,
        isActive: area.isActive,
      },
      create: area,
    });
  }

  return {
    categories: categories.length,
    products: products.length,
    deliveryAreas: deliveryAreas.length,
  };
}

async function seedAdmin(prisma: PrismaClient) {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!adminEmail || !adminPassword) {
    console.log(
      "  Skipping admin user: set ADMIN_EMAIL and ADMIN_PASSWORD to seed one.",
    );
    return { admin: 0 };
  }

  console.log("Seeding admin user...");
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });
  if (existingAdmin) {
    await prisma.adminUser.update({
      where: { email: adminEmail },
      data: {
        name: "Pousay Dibani Admin",
        passwordHash,
        role: "OWNER",
      },
    });
    console.log(`  Updated existing admin: ${adminEmail}`);
  } else {
    await prisma.adminUser.create({
      data: {
        name: "Pousay Dibani Admin",
        email: adminEmail,
        passwordHash,
        role: "OWNER",
      },
    });
    console.log(`  Created admin: ${adminEmail}`);
  }

  return { admin: 1 };
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and provide a real PostgreSQL connection string.",
    );
  }

  const adapter = new PrismaPg(connectionString);
  const prisma = new PrismaClient({ adapter });

  // Modes:
  //   default  -> full seed (categories, products, areas, admin)
  //   "admin"  -> only the admin user
  //   "catalog"-> only the catalog + delivery areas (no admin)
  const mode = (process.argv[2] ?? "all").toLowerCase();

  let counts: { categories?: number; products?: number; deliveryAreas?: number; admin?: number } = {};

  if (mode === "admin") {
    counts = await seedAdmin(prisma);
  } else if (mode === "catalog") {
    counts = await seedCatalog(prisma);
  } else if (mode === "all" || mode === undefined) {
    counts = await seedCatalog(prisma);
    counts = { ...counts, ...(await seedAdmin(prisma)) };
  } else {
    throw new Error(`Unknown seed mode: ${mode}. Use: all, admin, catalog.`);
  }

  const summary = [
    counts.categories !== undefined ? `${counts.categories} categories` : null,
    counts.products !== undefined ? `${counts.products} products` : null,
    counts.deliveryAreas !== undefined ? `${counts.deliveryAreas} delivery areas` : null,
    counts.admin !== undefined ? `${counts.admin} admin` : null,
  ]
    .filter(Boolean)
    .join(", ");

  console.log(`Seed complete (mode=${mode}): ${summary || "no changes"}.`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
