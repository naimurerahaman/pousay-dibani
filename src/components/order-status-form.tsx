"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { OrderSummary, type OrderSummaryView } from "@/components/order-summary";
import { formatPhone } from "@/lib/orders";
import { lookupOrder } from "@/lib/order-actions";

type OrderStatusFormProps = {
  initialOrderNumber: string;
  initialPhone: string;
  initialResult: OrderSummaryView | null;
  initialError: string | null;
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

export function OrderStatusForm({
  initialOrderNumber,
  initialPhone,
  initialResult,
  initialError,
}: OrderStatusFormProps) {
  const [isPending, startTransition] = useTransition();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState(initialPhone);
  const [result, setResult] = useState<OrderSummaryView | null>(initialResult);
  const [error, setError] = useState<string | null>(initialError);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanedPhone = formatPhone(phone);
    const trimmedOrder = orderNumber.trim();

    startTransition(async () => {
      const response = await lookupOrder({
        orderNumber: trimmedOrder,
        customerPhone: cleanedPhone,
      });

      if (!response.ok) {
        setResult(null);
        setError(response.error);
        return;
      }

      setResult(response.order);
    });
  }

  return (
    <>
      <form className="checkout-panel" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <label className="field">
            <span>Order number</span>
            <input
              name="orderNumber"
              required
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="PD-123456-XXXX"
            />
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
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
        </div>
        {error ? <div className="form-banner">{error}</div> : null}
        <button className="button" type="submit" disabled={isPending}>
          <Search size={17} aria-hidden="true" />
          {isPending ? "Checking…" : "Check status"}
        </button>
      </form>

      {result ? (
        <div className="section" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <OrderSummary
            order={result}
            createdAtLabel={formatDate(new Date(result.createdAt))}
          />
        </div>
      ) : !error ? (
        <div className="empty-state">
          <div>
            <h2>Track a Khulna delivery</h2>
            <p>
              Enter the order number we sent you and the phone number you used
              at checkout.
            </p>
            <Link className="button" href="/products">
              Browse products
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
