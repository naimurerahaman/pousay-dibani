"use server";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  checkoutFormSchema,
  orderLookupSchema,
} from "@/lib/orders";
import { generateUniqueOrderNumber } from "@/lib/order-number";
import { sendOrderConfirmation } from "@/lib/order-sms";
import { report } from "@/lib/monitoring";
import type { DeliveryAreaOption } from "@/lib/types";

export type OrderSmsStatus = "sent" | "skipped" | "failed";

export type OrderActionResult =
  | {
      ok: true;
      orderNumber: string;
      smsStatus: OrderSmsStatus;
      smsWarning?: string;
    }
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

  const order = await prisma.order.create({
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
    },
    select: { id: true },
  });

  // The order is committed; any SMS failure here must not undo it. The
  // result is surfaced to the customer so they can record the order
  // number themselves if the SMS never went out.
  let smsStatus: OrderSmsStatus = "skipped";
  let smsWarning: string | undefined;
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const result = await sendOrderConfirmation({
      orderId: order.id,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      orderNumber,
      total,
      appUrl,
    });

    if (result.ok) {
      smsStatus = "sent";
    } else {
      smsStatus = result.status;
      smsWarning =
        result.status === "skipped"
          ? "SMS notifications are not configured. Please save your order number for status tracking."
          : "We couldn't send your confirmation SMS. Please save your order number for status tracking.";
      await report({
        message: "Order confirmation SMS was not sent",
        severity: "warning",
        context: {
          orderId: order.id,
          orderNumber,
          reason: result.reason,
        },
      });
    }
  } catch (error) {
    smsStatus = "failed";
    smsWarning =
      "We couldn't send your confirmation SMS. Please save your order number for status tracking.";
    await report({
      message: "Unexpected error while sending order confirmation SMS",
      severity: "error",
      error,
      context: { orderId: order.id, orderNumber },
    });
  }

  return smsWarning
    ? { ok: true, orderNumber, smsStatus, smsWarning }
    : { ok: true, orderNumber, smsStatus };
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
  const areas = await prisma.deliveryArea.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return areas.map((area) => ({
    slug: area.slug,
    name: area.name,
    deliveryFee: area.deliveryFee,
  }));
});
