"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { useCartItems } from "@/hooks/use-cart-items";
import { useSavedDeliveryArea } from "@/hooks/use-saved-delivery-area";
import { clearSavedDeliveryArea } from "@/lib/delivery-area-pref";
import { writeRecentOrder } from "@/lib/recent-order";
import { CART_STORAGE_KEY, getCartSubtotal } from "@/lib/cart";
import { formatTaka } from "@/lib/format";
import { formatPhone } from "@/lib/orders";
import { placeOrder } from "@/lib/order-actions";
import { OrderSummary, type OrderSummaryView } from "@/components/order-summary";
import type { DeliveryAreaOption } from "@/lib/types";

type CheckoutFormProps = {
  areas: DeliveryAreaOption[];
};

type FieldErrors = Record<string, string>;

type ConfirmedOrder = {
  summary: OrderSummaryView;
  smsStatus: "sent" | "skipped" | "failed";
  smsWarning?: string;
};

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
  const savedArea = useSavedDeliveryArea();
  const [isPending, startTransition] = useTransition();
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
  const activeMatchedArea = savedArea
    ? areas.find((area) => area.slug === savedArea.slug) ?? null
    : null;
  const isStaleSavedArea = Boolean(savedArea) && activeMatchedArea === null;
  const matchedArea = activeMatchedArea;
  const deliveryFee = activeMatchedArea?.deliveryFee ?? 0;

  // If the saved area is no longer active on the server, drop it from
  // local storage so the navbar / next visit prompts for a fresh pick.
  useEffect(() => {
    if (isStaleSavedArea) {
      clearSavedDeliveryArea();
    }
  }, [isStaleSavedArea]);

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

    const submittedArea = areas.find((area) => area.slug === deliveryAreaSlug);
    if (!submittedArea) {
      setFieldErrors({
        deliveryArea: "Please pick a delivery area from the navigation before placing your order.",
      });
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

      setConfirmedOrder({
        summary: buildOrderSummaryFromCart(
          result.orderNumber,
          customerName,
          customerPhone,
          deliveryAddress,
          submittedArea.name,
          submittedArea.deliveryFee,
          notes,
          items,
        ),
        smsStatus: result.smsStatus,
        smsWarning: result.smsWarning,
      });
      writeRecentOrder({
        orderNumber: result.orderNumber,
        customerPhone,
        savedAt: Date.now(),
      });
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
              <strong>{confirmedOrder.summary.orderNumber}</strong>. Pousay
              Dibani will confirm the delivery by phone.
            </p>
            {confirmedOrder.smsWarning ? (
              <div
                className="form-banner form-banner--warning"
                role="status"
                style={{ marginTop: 16, textAlign: "left" }}
              >
                {confirmedOrder.smsWarning}
              </div>
            ) : null}
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
        <OrderSummary order={confirmedOrder.summary} />
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

        {!matchedArea ? (
          <div className="form-banner" role="status">
            Please choose a delivery area from the navigation before placing your
            order.
          </div>
        ) : isStaleSavedArea ? (
          <div className="form-banner" role="status">
            Your previously saved area is no longer available. Pick a new
            delivery area from the navigation.
          </div>
        ) : null}

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
          <div className="field">
            <span>Area</span>
            {matchedArea ? (
              <>
                <input type="hidden" name="area" value={matchedArea.slug} />
                <div className="locked-area" aria-live="polite">
                  <MapPin size={16} aria-hidden="true" />
                  <span>
                    <strong>{matchedArea.name}</strong>
                    <span className="muted">
                      {" "}
                      — Delivery fee {formatTaka(matchedArea.deliveryFee)}
                    </span>
                  </span>
                </div>
                <span className="field-hint">
                  Update this from the navigation if you need a different area.
                </span>
              </>
            ) : (
              <span className="field-error">
                {fieldErrors.deliveryArea ?? "No delivery area selected."}
              </span>
            )}
          </div>
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
          disabled={isPending || items.length === 0 || !matchedArea}
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
          <span>
            Delivery fee
            {matchedArea ? (
              <span className="muted" style={{ marginLeft: 6, fontSize: "0.8rem" }}>
                to {matchedArea.name}
              </span>
            ) : null}
          </span>
          <strong>{formatTaka(deliveryFee)}</strong>
        </div>
        <div className="summary-line">
          <span>Total</span>
          <strong>{formatTaka(subtotal + deliveryFee)}</strong>
        </div>
        <p className="muted" style={{ fontSize: "0.8rem", marginTop: 8 }}>
          Final delivery fee is set by your chosen Khulna area at order time.
        </p>
      </aside>
    </div>
  );
}
