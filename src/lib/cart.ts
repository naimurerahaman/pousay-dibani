import type { CartItem, Product } from "@/lib/types";

export const CART_STORAGE_KEY = "pousay-dibani-cart";

export function toCartItem(product: Product, quantity = 1): CartItem {
  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    unit: product.unit,
    imageUrl: product.imageUrl,
    quantity,
  };
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function mergeCartItem(items: CartItem[], nextItem: CartItem) {
  const existingItem = items.find(
    (item) => item.productId === nextItem.productId,
  );

  if (!existingItem) {
    return [...items, nextItem];
  }

  return items.map((item) =>
    item.productId === nextItem.productId
      ? { ...item, quantity: item.quantity + nextItem.quantity }
      : item,
  );
}
