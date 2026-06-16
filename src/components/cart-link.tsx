"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { getCartCount } from "@/lib/cart";
import { useCartItems } from "@/hooks/use-cart-items";

export function CartLink() {
  const count = getCartCount(useCartItems());

  return (
    <Link className="icon-link" href="/cart" aria-label="Open cart">
      <ShoppingCart size={20} aria-hidden="true" />
      {count > 0 ? <span className="cart-badge">{count}</span> : null}
    </Link>
  );
}
