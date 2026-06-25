import { prisma } from "@/lib/prisma";
import type { Product, ProductCategory, StockStatus } from "@/lib/types";

export { formatTaka } from "@/lib/format";

// Effective availability combines the manual display status with the numeric
// stock count: zero stock is always "sold out", regardless of stored status.
function toStockStatus(status: string, stockQty: number): StockStatus {
  if (stockQty <= 0) return "out_of_stock";
  switch (status) {
    case "LIMITED":
      return "limited";
    case "OUT_OF_STOCK":
      return "out_of_stock";
    case "IN_STOCK":
    default:
      return "in_stock";
  }
}

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  unit: string;
  imageUrl: string;
  stockStatus: string;
  stockQty: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
};

function toCategory(row: CategoryRow): ProductCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    unit: row.unit,
    imageUrl: row.imageUrl,
    categoryId: row.categoryId,
    stockStatus: toStockStatus(row.stockStatus, row.stockQty),
    isFeatured: row.isFeatured,
  };
}

export async function getActiveCategories(): Promise<ProductCategory[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return rows.map(toCategory);
}

export async function getCategoryById(
  categoryId: string,
): Promise<ProductCategory | null> {
  const row = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  return row ? toCategory(row) : null;
}

export async function getCategoryBySlug(
  slug: string,
): Promise<ProductCategory | null> {
  const row = await prisma.category.findUnique({
    where: { slug },
  });
  return row ? toCategory(row) : null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const featured = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  if (featured.length > 0) return featured.map(toProduct);

  // No products explicitly featured yet — show a sample of the live catalog so
  // the home page never has an empty "popular" section.
  const sample = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return sample.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { slug },
  });
  return row ? toProduct(row) : null;
}

export async function getProductsByCategory(
  categoryId: string,
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, categoryId },
    orderBy: { name: "asc" },
  });
  return rows.map(toProduct);
}

export type ProductFilter = {
  query?: string;
  categoryId?: string;
};

export async function searchProducts(
  filter: ProductFilter = {},
): Promise<Product[]> {
  const query = filter.query?.trim();
  const categoryId = filter.categoryId?.trim();

  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });
  return rows.map(toProduct);
}

export async function getAllActiveProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return rows.map(toProduct);
}
