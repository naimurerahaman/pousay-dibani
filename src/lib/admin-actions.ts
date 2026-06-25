"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { type OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  fieldErrorsFromZod,
  type AdminActionResult,
} from "@/lib/admin-constants";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens."),
  description: z.string().trim().min(2).max(280),
  isActive: z.boolean(),
});

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens."),
  description: z.string().trim().min(2).max(1000),
  price: z.coerce.number().int().min(1, "Price must be at least 1 taka."),
  unit: z.string().trim().min(1).max(40),
  imageUrl: z.string().trim().url("Image URL must be a valid URL."),
  categoryId: z.string().trim().min(1, "Choose a category."),
  stockStatus: z.enum(["IN_STOCK", "LIMITED", "OUT_OF_STOCK"]),
  stockQty: z.coerce.number().int().min(0, "Stock quantity cannot be negative."),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

const deliveryAreaSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens."),
  deliveryFee: z.coerce.number().int().min(0, "Delivery fee cannot be negative."),
  isActive: z.boolean(),
});

const orderStatusSchema = z.object({
  orderId: z.string().trim().min(1),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
});

async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
) {
  let candidate = base.length > 0 ? base : `item-${Date.now()}`;
  let suffix = 1;
  while (await exists(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function createCategory(
  rawInput: unknown,
): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const desiredSlug = parsed.data.slug || slugify(parsed.data.name);

  const slug = await ensureUniqueSlug(desiredSlug, async (candidate) => {
    const existing = await prisma.category.findUnique({ where: { slug: candidate } });
    return Boolean(existing);
  });

  await prisma.category.create({
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

export async function updateCategory(
  id: string,
  rawInput: unknown,
): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "Category not found." };
  }

  let slug = parsed.data.slug || existing.slug;
  if (slug !== existing.slug) {
    slug = await ensureUniqueSlug(slug, async (candidate) => {
      const match = await prisma.category.findUnique({ where: { slug: candidate } });
      return Boolean(match && match.id !== id);
    });
  }

  await prisma.category.update({
    where: { id },
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<AdminActionResult> {
  await requireAdmin();

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return {
      ok: false,
      error: `Move or delete ${productCount} product(s) in this category first.`,
    };
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { ok: true };
}

export async function createProduct(
  rawInput: unknown,
): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  });
  if (!category) {
    return { ok: false, error: "Selected category does not exist." };
  }

  const desiredSlug = parsed.data.slug || slugify(parsed.data.name);
  const slug = await ensureUniqueSlug(desiredSlug, async (candidate) => {
    const match = await prisma.product.findUnique({ where: { slug: candidate } });
    return Boolean(match);
  });

  await prisma.product.create({
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

export async function updateProduct(
  id: string,
  rawInput: unknown,
): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "Product not found." };
  }

  let slug = parsed.data.slug || existing.slug;
  if (slug !== existing.slug) {
    slug = await ensureUniqueSlug(slug, async (candidate) => {
      const match = await prisma.product.findUnique({ where: { slug: candidate } });
      return Boolean(match && match.id !== id);
    });
  }

  await prisma.product.update({
    where: { id },
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<AdminActionResult> {
  await requireAdmin();

  await prisma.product.delete({ where: { id } });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

export async function createDeliveryArea(
  rawInput: unknown,
): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = deliveryAreaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const desiredSlug = parsed.data.slug || slugify(parsed.data.name);
  const slug = await ensureUniqueSlug(desiredSlug, async (candidate) => {
    const match = await prisma.deliveryArea.findUnique({ where: { slug: candidate } });
    return Boolean(match);
  });

  await prisma.deliveryArea.create({
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/delivery-areas");
  return { ok: true };
}

export async function updateDeliveryArea(
  id: string,
  rawInput: unknown,
): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = deliveryAreaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const existing = await prisma.deliveryArea.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "Delivery area not found." };
  }

  let slug = parsed.data.slug || existing.slug;
  if (slug !== existing.slug) {
    slug = await ensureUniqueSlug(slug, async (candidate) => {
      const match = await prisma.deliveryArea.findUnique({ where: { slug: candidate } });
      return Boolean(match && match.id !== id);
    });
  }

  await prisma.deliveryArea.update({
    where: { id },
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/delivery-areas");
  return { ok: true };
}

export async function deleteDeliveryArea(id: string): Promise<AdminActionResult> {
  await requireAdmin();

  await prisma.deliveryArea.delete({ where: { id } });
  revalidatePath("/admin/delivery-areas");
  return { ok: true };
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(200),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function changeAdminPassword(
  rawInput: unknown,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const parsed = changePasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const record = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  if (!record) {
    return { ok: false, error: "Admin account not found." };
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, record.passwordHash);
  if (!ok) {
    return {
      ok: false,
      error: "Current password is incorrect.",
      fieldErrors: { currentPassword: "Incorrect password." },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash },
  });

  return { ok: true };
}

export async function updateOrderStatus(
  rawInput: unknown,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const parsed = orderStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please choose a valid status.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const existing = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { items: true },
  });
  if (!existing) {
    return { ok: false, error: "Order not found." };
  }

  const fromStatus = existing.status as OrderStatus;
  const toStatus = parsed.data.status as OrderStatus;

  if (fromStatus === toStatus) {
    return { ok: true };
  }

  // Cancelling a not-yet-cancelled order returns its reserved stock.
  const shouldRevertStock =
    toStatus === "CANCELLED" && fromStatus !== "CANCELLED";

  await prisma.$transaction(async (tx) => {
    if (shouldRevertStock) {
      for (const item of existing.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { increment: item.quantity } },
          });
        }
      }
    }

    await tx.order.update({
      where: { id: parsed.data.orderId },
      data: {
        status: toStatus,
        events: {
          create: {
            fromStatus,
            toStatus,
            actorEmail: admin.email ?? null,
          },
        },
      },
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { ok: true };
}
