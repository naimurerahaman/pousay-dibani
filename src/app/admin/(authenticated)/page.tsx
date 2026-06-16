import Link from "next/link";
import { ArrowRight, Clock3, DollarSign, PackageCheck, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTaka } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const dynamic = "force-dynamic";

type MetricCard = {
  label: string;
  value: string;
  hint: string;
  icon: typeof Clock3;
  tone: "default" | "positive" | "warning" | "info";
};

export default async function AdminDashboardPage() {
  const [totalOrders, pendingOrders, deliveredOrders, revenueAggregate, recentOrders] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          deliveryArea: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

  const revenue = revenueAggregate._sum.total ?? 0;

  const metrics: MetricCard[] = [
    {
      label: "Total orders",
      value: totalOrders.toString(),
      hint: "All time",
      icon: PackageCheck,
      tone: "info",
    },
    {
      label: "Pending orders",
      value: pendingOrders.toString(),
      hint: "Awaiting confirmation",
      icon: Clock3,
      tone: "warning",
    },
    {
      label: "Delivered orders",
      value: deliveredOrders.toString(),
      hint: "Completed deliveries",
      icon: Truck,
      tone: "positive",
    },
    {
      label: "Revenue",
      value: formatTaka(revenue),
      hint: "Excludes cancelled orders",
      icon: DollarSign,
      tone: "default",
    },
  ];

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Overview of Pousay Dibani Khulna operations.</p>
        </div>
        <Link className="button-link button-link--primary" href="/admin/orders">
          View all orders <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="admin-metric-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className="admin-metric" key={metric.label}>
              <span className="admin-metric__label">{metric.label}</span>
              <span className="admin-metric__value">{metric.value}</span>
              <span className="admin-metric__hint">
                <Icon size={13} aria-hidden="true" style={{ marginRight: 4 }} />
                {metric.hint}
              </span>
            </article>
          );
        })}
      </div>

      <div className="admin-card">
        <div className="admin-page-header" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Recent orders</h2>
          <Link className="button-ghost" href="/admin/orders">
            See all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="muted">No orders yet. New customer orders will appear here.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Area</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                  </td>
                  <td>{order.customerName}</td>
                  <td>{order.deliveryArea}</td>
                  <td>{formatTaka(order.total)}</td>
                  <td>
                    <OrderStatusBadge status={order.status} />
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
