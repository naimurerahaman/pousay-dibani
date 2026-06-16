"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CART_STORAGE_KEY } from "@/lib/cart";
import type { CartItem } from "@/lib/types";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("pousay-cart-updated", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("pousay-cart-updated", onStoreChange);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]";
}

function getServerSnapshot() {
  return "[]";
}

export function parseCart(rawCart: string): CartItem[] {
  try {
    const parsedCart = JSON.parse(rawCart);
    return Array.isArray(parsedCart) ? (parsedCart as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function useCartItems() {
  const rawCart = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return useMemo(() => parseCart(rawCart), [rawCart]);
}
