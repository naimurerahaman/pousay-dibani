import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatTaka } from "@/lib/format";

export type OrderSummaryItem = {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderSummaryView = {
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
  items: OrderSummaryItem[];
};

type OrderSummaryProps = {
  order: OrderSummaryView;
  createdAtLabel?: string;
};

export function OrderSummary({ order, createdAtLabel }: OrderSummaryProps) {
  return (
    <div className="order-summary">
      <header className="order-summary__header">
        <div>
          <span className="eyebrow">Order</span>
          <h2>{order.orderNumber}</h2>
          {createdAtLabel ? (
            <p className="muted">Placed on {createdAtLabel}</p>
          ) : null}
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <section className="order-summary__section">
        <h3>Customer</h3>
        <p>
          <strong>{order.customerName}</strong>
          <br />
          {order.customerPhone}
        </p>
        <h3>Delivery</h3>
        <p>
          {order.deliveryAddress}
          <br />
          <span className="muted">{order.deliveryArea}</span>
        </p>
        {order.notes ? (
          <>
            <h3>Notes</h3>
            <p>{order.notes}</p>
          </>
        ) : null}
      </section>

      <section className="order-summary__section">
        <h3>Items</h3>
        <ul className="order-summary__items">
          {order.items.map((item) => (
            <li key={item.id}>
              <span>
                {item.productName} <span className="muted">x {item.quantity}</span>
              </span>
              <strong>{formatTaka(item.lineTotal)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="order-summary__totals">
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
      </section>
    </div>
  );
}
