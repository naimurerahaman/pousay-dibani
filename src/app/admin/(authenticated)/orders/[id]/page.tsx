import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTaka } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { AdminOrderStatusForm } from "@/components/admin-order-status-form";
import { updateOrderStatus } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

type AdminOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  async function action(formData: FormData) {
    "use server";
    return updateOrderStatus({
      orderId: String(formData.get("orderId") ?? ""),
      status: String(formData.get("status") ?? ""),
    });
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <Link className="button-ghost" href="/admin/orders" style={{ marginBottom: 8, display: "inline-flex" }}>
            <ArrowLeft size={16} aria-hidden="true" />
            Orders
          </Link>
          <h1>{order.orderNumber}</h1>
          <p className="muted">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="admin-card">
        <div className="form-grid">
          <div>
            <span className="admin-metric__label">Customer</span>
            <p style={{ margin: "6px 0 0" }}>
              <strong>{order.customerName}</strong>
              <br />
              {order.customerPhone}
            </p>
          </div>
          <div>
            <span className="admin-metric__label">Delivery</span>
            <p style={{ margin: "6px 0 0" }}>
              {order.deliveryAddress}
              <br />
              <span className="muted">{order.deliveryArea}</span>
            </p>
          </div>
          {order.notes ? (
            <div className="admin-metric__label" style={{ gridColumn: "1 / -1" }}>
              Notes
              <p style={{ margin: "6px 0 0", color: "var(--ink)", fontWeight: 500 }}>
                {order.notes}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="admin-card">
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Items</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit price</th>
              <th>Quantity</th>
              <th>Line total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.productName}</strong>
                </td>
                <td>{formatTaka(item.unitPrice)}</td>
                <td>{item.quantity}</td>
                <td>{formatTaka(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="order-summary__totals" style={{ marginTop: 16 }}>
          <div className="summary-line">
            <span>Subtotal</span>
            <strong>{formatTaka(order.subtotal)}</strong>
          </div>
          <div className="summary-line">
            <span>Delivery fee</span>
            <strong>{formatTaka(order.deliveryFee)}</strong>
          </div>
          <div className="summary-line summary-line--total">
            <span>Total</span>
            <strong>{formatTaka(order.total)}</strong>
          </div>
        </div>
      </div>

      <AdminOrderStatusForm orderId={order.id} initialStatus={order.status} action={action} />
    </>
  );
}
