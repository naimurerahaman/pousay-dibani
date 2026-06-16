import type { OrderStatus } from "@prisma/client";

const labels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const tones: Record<OrderStatus, string> = {
  PENDING: "pending",
  CONFIRMED: "info",
  PREPARING: "info",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const label = labels[status as OrderStatus] ?? status;
  const tone = tones[status as OrderStatus] ?? "pending";

  return (
    <span className={`status-pill status-pill--${tone}`} aria-label={`Status: ${label}`}>
      {label}
    </span>
  );
}
