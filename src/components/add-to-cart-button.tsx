"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { CART_STORAGE_KEY, mergeCartItem, toCartItem } from "@/lib/cart";
import type { CartItem, Product } from "@/lib/types";

type AddToCartButtonProps = {
  product: Product;
  variant?: "primary" | "secondary";
};

function readCart() {
  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
    return rawCart ? (JSON.parse(rawCart) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function AddToCartButton({
  product,
  variant = "secondary",
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const isDisabled = product.stockStatus === "out_of_stock";

  function handleAdd() {
    const nextCart = mergeCartItem(readCart(), toCartItem(product));
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
    window.dispatchEvent(new Event("pousay-cart-updated"));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <button
      className={variant === "primary" ? "button" : "button-secondary"}
      type="button"
      onClick={handleAdd}
      disabled={isDisabled}
      aria-label={`Add ${product.name} to cart`}
    >
      {added ? (
        <Check size={17} aria-hidden="true" />
      ) : (
        <Plus size={17} aria-hidden="true" />
      )}
      {added ? "Added" : "Add"}
    </button>
  );
}
