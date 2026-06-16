import type { StockStatus } from "@prisma/client";

export const stockStatusValues = ["IN_STOCK", "LIMITED", "OUT_OF_STOCK"] as const;
export const orderStatusValues = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatusValue = (typeof orderStatusValues)[number];

export const stockStatusLabels: Record<StockStatus, string> = {
  IN_STOCK: "In stock",
  LIMITED: "Limited",
  OUT_OF_STOCK: "Sold out",
};

export const orderStatusLabels: Record<OrderStatusValue, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export type AdminActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function fieldErrorsFromZod(error: {
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
