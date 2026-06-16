import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTaka } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { orderStatusLabels, orderStatusValues } from "@/lib/admin-constants";

export const dynamic = "force-dynamic";

const statusFilterSchema = new Set(orderStatusValues);

type AdminOrdersPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
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

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const filterStatus =
    params.status && statusFilterSchema.has(params.status as (typeof orderStatusValues)[number])
      ? (params.status as (typeof orderStatusValues)[number])
      : null;

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where: filterStatus ? { status: filterStatus } : {},
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        deliveryArea: true,
        total: true,
        status: true,
        createdAt: true,
      },
      take: 200,
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countByStatus = new Map(
    counts.map((entry) => [entry.status, entry._count._all]),
  );
  const totalCount = counts.reduce((sum, entry) => sum + entry._count._all, 0);

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Orders</h1>
          <p className="muted">Process incoming orders and keep customers updated.</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar" style={{ marginBottom: 12 }}>
          <Link
            className={`button-link ${filterStatus === null ? "button-link--primary" : ""}`}
            href="/admin/orders"
          >
            All ({totalCount})
          </Link>
          {orderStatusValues.map((status) => {
            const count = countByStatus.get(status) ?? 0;
            const isActive = filterStatus === status;
            return (
              <Link
                key={status}
                className={`button-link ${isActive ? "button-link--primary" : ""}`}
                href={`/admin/orders?status=${status}`}
              >
                {orderStatusLabels[status]} ({count})
              </Link>
            );
          })}
        </div>

        {orders.length === 0 ? (
          <p className="muted">No orders match this filter.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Area</th>
                <th>Total</th>
                <th>Placed</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/orders/${order.id}`}>
                      <strong>{order.orderNumber}</strong>
                    </Link>
                  </td>
                  <td>
                    <strong>{order.customerName}</strong>
                    <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                      {order.customerPhone}
                    </p>
                  </td>
                  <td>{order.deliveryArea}</td>
                  <td>{formatTaka(order.total)}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td>
                    <Link className="button-link" href={`/admin/orders/${order.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
