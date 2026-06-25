"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  checkoutFormSchema,
  orderLookupSchema,
} from "@/lib/orders";
import { generateUniqueOrderNumber } from "@/lib/order-number";
import { notifyNewOrder } from "@/lib/notify";
import { consume, getClientKey } from "@/lib/rate-limit";
import type { DeliveryAreaOption } from "@/lib/types";

// Order placement: allow a short burst, then throttle to ~1 every 30s per IP.
const ORDER_LIMIT = { capacity: 5, refillPerMs: 1 / 30000 };

class OutOfStockError extends Error {
  constructor() {
    super("Out of stock");
    this.name = "OutOfStockError";
  }
}

export type OrderActionResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type OrderLookupResult =
  | { ok: true; order: OrderLookupView }
  | { ok: false; error: string };

export type OrderLookupView = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryArea: string;
  deliveryFee: number;
  subtotal: number;
  total: number;
  notes: string | null;
  createdAt: Date;
  items: Array<{
    id: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};

function fieldErrorsFromZod(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}) {
  const flat = error.flatten();
  const fieldErrors: Record<string, string> = {};
  for (const [key, value] of Object.entries(flat.fieldErrors)) {
    if (value && value.length > 0) {
      fieldErrors[key] = value[0];
    }
  }
  return fieldErrors;
}

export async function placeOrder(
  rawInput: unknown,
): Promise<OrderActionResult> {
  // Throttle order submissions per client to curb spam/abuse.
  const ip = getClientKey(await headers());
  const limit = consume(`order:${ip}`, ORDER_LIMIT);
  if (!limit.allowed) {
    const seconds = Math.max(1, Math.ceil(limit.retryAfterMs / 1000));
    return {
      ok: false,
      error: `Too many order attempts. Please try again in ${seconds}s.`,
    };
  }

  const parsed = checkoutFormSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields and try again.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const input = parsed.data;

  const deliveryArea = await prisma.deliveryArea.findUnique({
    where: { slug: input.deliveryArea },
  });

  if (!deliveryArea || !deliveryArea.isActive) {
    return {
      ok: false,
      error: "That delivery area is not supported.",
      fieldErrors: { deliveryArea: "Choose a supported Khulna delivery area." },
    };
  }

  const productIds = input.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== productIds.length) {
    return {
      ok: false,
      error: "One or more products are no longer available.",
    };
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const orderItems = input.items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    return {
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
      lineTotal: product.price * item.quantity,
    };
  });

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );
  const total = subtotal + deliveryArea.deliveryFee;

  const orderNumber = await generateUniqueOrderNumber();

  try {
    await prisma.$transaction(async (tx) => {
      // Race-safe stock decrement: the conditional `where` ensures we never
      // oversell even under concurrent checkouts. If any item can't be
      // satisfied, throwing rolls back the whole transaction.
      for (const item of orderItems) {
        const { count } = await tx.product.updateMany({
          where: { id: item.productId, stockQty: { gte: item.quantity } },
          data: { stockQty: { decrement: item.quantity } },
        });
        if (count !== 1) {
          throw new OutOfStockError();
        }
      }

      await tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          deliveryAddress: input.deliveryAddress,
          deliveryArea: deliveryArea.name,
          deliveryFee: deliveryArea.deliveryFee,
          subtotal,
          total,
          notes: input.notes ?? null,
          items: {
            create: orderItems,
          },
          events: {
            create: { toStatus: "PENDING", note: "Order placed by customer." },
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof OutOfStockError) {
      return {
        ok: false,
        error: "One or more items just went out of stock. Please review your cart.",
      };
    }
    throw error;
  }

  // Fire-and-forget admin notifications; never block the customer response.
  void notifyNewOrder({
    orderNumber,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    deliveryArea: deliveryArea.name,
    deliveryAddress: input.deliveryAddress,
    subtotal,
    deliveryFee: deliveryArea.deliveryFee,
    total,
    items: orderItems.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  });

  return { ok: true, orderNumber };
}

export async function lookupOrder(
  rawInput: unknown,
): Promise<OrderLookupResult> {
  const parsed = orderLookupSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check the form fields.",
    };
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber },
    include: { items: true },
  });

  if (!order || order.customerPhone !== parsed.data.customerPhone) {
    return {
      ok: false,
      error: "No order matches that number and phone combination.",
    };
  }

  return {
    ok: true,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      deliveryArea: order.deliveryArea,
      deliveryFee: order.deliveryFee,
      subtotal: order.subtotal,
      total: order.total,
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    },
  };
}

export const getActiveDeliveryAreas = cache(async (): Promise<DeliveryAreaOption[]> => {
  // This runs in the root layout on every page, including the statically
  // pre-rendered /_not-found at build time. If the database is unavailable
  // (e.g. a build with no DATABASE_URL), degrade to an empty list instead of
  // crashing the whole build/render. At runtime in production the DB is present
  // and this returns the real areas.
  try {
    const areas = await prisma.deliveryArea.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return areas.map((area) => ({
      slug: area.slug,
      name: area.name,
      deliveryFee: area.deliveryFee,
    }));
  } catch (error) {
    console.error("getActiveDeliveryAreas failed; returning empty list.", error);
    return [];
  }
});
