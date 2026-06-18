"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useCartItems } from "@/hooks/use-cart-items";
import { useSavedDeliveryArea } from "@/hooks/use-saved-delivery-area";
import { CART_STORAGE_KEY, getCartSubtotal } from "@/lib/cart";
import { DEFAULT_DELIVERY_FEE } from "@/lib/delivery-area";
import { formatTaka } from "@/lib/format";
import type { CartItem } from "@/lib/types";

export function CartView() {
  const items = useCartItems();
  const savedArea = useSavedDeliveryArea();
  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
  const deliveryFee = savedArea?.deliveryFee ?? DEFAULT_DELIVERY_FEE;
  const total = items.length > 0 ? subtotal + deliveryFee : 0;

  function writeCart(nextItems: CartItem[]) {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems));
    window.dispatchEvent(new Event("pousay-cart-updated"));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      writeCart(items.filter((item) => item.productId !== productId));
      return;
    }

    writeCart(
      items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div>
          <h2>Your cart is empty</h2>
          <p>
            Add groceries, household goods, health basics, or stationery for
            delivery inside Khulna city.
          </p>
          <Link className="button" href="/products">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <section className="cart-panel" aria-label="Cart items">
        <h2>Cart items</h2>
        <div className="cart-list">
          {items.map((item) => (
            <article className="cart-row" key={item.productId}>
              <div className="cart-row__image">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="84px"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div>
                <h3>{item.name}</h3>
                <p>
                  {formatTaka(item.price)} / {item.unit}
                </p>
                <p>{formatTaka(item.price * item.quantity)}</p>
              </div>
              <div className="cart-row__actions">
                <div className="quantity-control" aria-label="Quantity">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    aria-label={`Decrease ${item.name}`}
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    aria-label={`Increase ${item.name}`}
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
                <button
                  className="button-ghost"
                  type="button"
                  onClick={() => updateQuantity(item.productId, 0)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="checkout-panel" aria-label="Order summary">
        <h2>Order summary</h2>
        <div className="summary-line">
          <span>Subtotal</span>
          <strong>{formatTaka(subtotal)}</strong>
        </div>
        <div className="summary-line">
          <span>
            Delivery fee
            {savedArea ? (
              <span className="muted" style={{ marginLeft: 6, fontSize: "0.8rem" }}>
                to {savedArea.name}
              </span>
            ) : null}
          </span>
          <strong>{formatTaka(deliveryFee)}</strong>
        </div>
        <div className="summary-line">
          <span>Total</span>
          <strong>{formatTaka(total)}</strong>
        </div>
        {!savedArea ? (
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: 8 }}>
            Pick a delivery area in the navigation to see your real fee.
          </p>
        ) : null}
        <Link className="button" href="/checkout">
          Checkout
        </Link>
      </aside>
    </div>
  );
}
