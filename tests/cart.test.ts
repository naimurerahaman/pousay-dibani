import { describe, it, expect } from "vitest";
import {
  getCartCount,
  getCartSubtotal,
  mergeCartItem,
  toCartItem,
} from "@/lib/cart";
import type { CartItem, Product } from "@/lib/types";

const product: Product = {
  id: "p1",
  name: "Miniket Rice",
  slug: "miniket-rice",
  description: "Rice",
  price: 420,
  unit: "5 kg",
  imageUrl: "https://example.com/rice.webp",
  categoryId: "fresh",
  stockStatus: "in_stock",
  isFeatured: true,
};

describe("cart math", () => {
  it("converts a product to a cart item with default quantity 1", () => {
    expect(toCartItem(product)).toMatchObject({ productId: "p1", quantity: 1 });
  });

  it("sums quantities and subtotal", () => {
    const items: CartItem[] = [
      toCartItem(product, 2),
      toCartItem({ ...product, id: "p2", price: 100 }, 3),
    ];
    expect(getCartCount(items)).toBe(5);
    expect(getCartSubtotal(items)).toBe(420 * 2 + 100 * 3);
  });

  it("merges a new product as a new line", () => {
    const merged = mergeCartItem([], toCartItem(product));
    expect(merged).toHaveLength(1);
  });

  it("merges an existing product by increasing quantity", () => {
    const start = [toCartItem(product, 1)];
    const merged = mergeCartItem(start, toCartItem(product, 2));
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(3);
  });
});
