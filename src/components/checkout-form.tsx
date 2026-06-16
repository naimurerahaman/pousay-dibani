"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { useCartItems } from "@/hooks/use-cart-items";
import { CART_STORAGE_KEY, getCartSubtotal } from "@/lib/cart";
import { formatTaka } from "@/lib/format";
import { formatPhone } from "@/lib/orders";
import { placeOrder } from "@/lib/order-actions";
import { OrderSummary, type OrderSummaryView } from "@/components/order-summary";

type DeliveryAreaOption = {
  slug: string;
  name: string;
  deliveryFee: number;
};

type CheckoutFormProps = {
  areas: DeliveryAreaOption[];
};

type FieldErrors = Record<string, string>;

function buildOrderSummaryFromCart(
  orderNumber: string,
  customerName: string,
  customerPhone: string,
  deliveryAddress: string,
  deliveryArea: string,
  deliveryFee: number,
  notes: string | undefined,
  items: ReturnType<typeof useCartItems>,
): OrderSummaryView {
  return {
    orderNumber,
    status: "PENDING",
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryArea,
    deliveryFee,
    subtotal: getCartSubtotal(items),
    total: getCartSubtotal(items) + deliveryFee,
    notes: notes ?? null,
    createdAt: new Date(),
    items: items.map((item) => ({
      id: item.productId,
      productName: item.name,
      unitPrice: item.price,
      quantity: item.quantity,
      lineTotal: item.price * item.quantity,
    })),
  };
}

export function CheckoutForm({ areas }: CheckoutFormProps) {
  const items = useCartItems();
  const [isPending, startTransition] = useTransition();
  const [confirmedOrder, setConfirmedOrder] = useState<OrderSummaryView | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const subtotal = useMemo(() => getCartSubtotal(items), [items]);

  function clearCart() {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new Event("pousay-cart-updated"));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const customerName = String(formData.get("name") ?? "").trim();
    const customerPhone = formatPhone(String(formData.get("phone") ?? ""));
    const deliveryAddress = String(formData.get("address") ?? "").trim();
    const deliveryAreaSlug = String(formData.get("area") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim() || undefined;

    const matchedArea = areas.find((area) => area.slug === deliveryAreaSlug);
    if (!matchedArea) {
      setFieldErrors({ deliveryArea: "Please choose a supported delivery area." });
      return;
    }

    startTransition(async () => {
      const result = await placeOrder({
        customerName,
        customerPhone,
        deliveryAddress,
        deliveryArea: deliveryAreaSlug,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      setConfirmedOrder(
        buildOrderSummaryFromCart(
          result.orderNumber,
          customerName,
          customerPhone,
          deliveryAddress,
          matchedArea.name,
          matchedArea.deliveryFee,
          notes,
          items,
        ),
      );
      clearCart();
    });
  }

  if (confirmedOrder) {
    return (
      <div className="cart-layout">
        <div className="empty-state">
          <div>
            <h2>Order received</h2>
            <p>
              Your order number is{" "}
              <strong>{confirmedOrder.orderNumber}</strong>. Pousay Dibani will
              confirm the delivery by phone.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/products">
                Continue shopping
              </Link>
              <Link className="button-secondary" href="/order-status">
                Track order
              </Link>
            </div>
          </div>
        </div>
        <OrderSummary order={confirmedOrder} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div>
          <h2>No items to checkout</h2>
          <p>Choose products first, then return here to place the order.</p>
          <Link className="button" href="/products">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <form className="checkout-panel" onSubmit={handleSubmit} noValidate>
        <h2>Delivery details</h2>

        {error ? <div className="form-banner">{error}</div> : null}

        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.customerName)}
            />
            {fieldErrors.customerName ? (
              <span className="field-error">{fieldErrors.customerName}</span>
            ) : null}
          </label>
          <label className="field">
            <span>Phone</span>
            <input
              name="phone"
              required
              inputMode="tel"
              pattern="01[0-9]{9}"
              placeholder="01XXXXXXXXX"
              maxLength={11}
              autoComplete="tel"
              aria-invalid={Boolean(fieldErrors.customerPhone)}
            />
            {fieldErrors.customerPhone ? (
              <span className="field-error">{fieldErrors.customerPhone}</span>
            ) : null}
          </label>
          <label className="field">
            <span>Area</span>
            <select
              name="area"
              required
              defaultValue=""
              aria-invalid={Boolean(fieldErrors.deliveryArea)}
            >
              <option value="" disabled>
                Select area
              </option>
              {areas.map((area) => (
                <option key={area.slug} value={area.slug}>
                  {area.name} (৳{area.deliveryFee})
                </option>
              ))}
            </select>
            {fieldErrors.deliveryArea ? (
              <span className="field-error">{fieldErrors.deliveryArea}</span>
            ) : null}
          </label>
          <label className="field">
            <span>Payment</span>
            <select name="payment" defaultValue="cod" disabled>
              <option value="cod">Cash on delivery</option>
            </select>
          </label>
          <label className="field field--full">
            <span>Address</span>
            <textarea
              name="address"
              required
              minLength={8}
              maxLength={240}
              rows={3}
              aria-invalid={Boolean(fieldErrors.deliveryAddress)}
            />
            {fieldErrors.deliveryAddress ? (
              <span className="field-error">{fieldErrors.deliveryAddress}</span>
            ) : null}
          </label>
          <label className="field field--full">
            <span>Notes</span>
            <textarea
              name="notes"
              maxLength={500}
              rows={2}
              placeholder="Optional delivery notes"
            />
          </label>
        </div>
        <button
          className="button"
          type="submit"
          disabled={isPending || items.length === 0}
        >
          {isPending ? "Placing order…" : "Place order"}
        </button>
      </form>

      <aside className="checkout-panel" aria-label="Checkout summary">
        <h2>Summary</h2>
        {items.map((item) => (
          <div className="summary-line" key={item.productId}>
            <span>
              {item.name} x {item.quantity}
            </span>
            <strong>{formatTaka(item.price * item.quantity)}</strong>
          </div>
        ))}
        <div className="summary-line">
          <span>Subtotal</span>
          <strong>{formatTaka(subtotal)}</strong>
        </div>
        <div className="summary-line">
          <span>Delivery fee</span>
          <strong>{formatTaka(60)}</strong>
        </div>
        <div className="summary-line">
          <span>Total</span>
          <strong>{formatTaka(subtotal + 60)}</strong>
        </div>
        <p className="muted" style={{ fontSize: "0.8rem", marginTop: 8 }}>
          Final delivery fee is set by the chosen Khulna area at order time.
        </p>
      </aside>
    </div>
  );
}
