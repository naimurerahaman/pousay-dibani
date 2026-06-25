import { describe, it, expect } from "vitest";
import { checkoutSchema, formatPhone, phoneRegex } from "@/lib/orders";
import { formatTaka } from "@/lib/format";

describe("phone handling", () => {
  it("accepts valid 11-digit BD mobile numbers", () => {
    expect(phoneRegex.test("01712345678")).toBe(true);
  });

  it("rejects malformed numbers", () => {
    expect(phoneRegex.test("12345")).toBe(false);
    expect(phoneRegex.test("0171234567")).toBe(false); // too short
  });

  it("strips non-digits", () => {
    expect(formatPhone("+880 1712-345678")).toBe("8801712345678");
  });
});

describe("checkout validation", () => {
  const base = {
    customerName: "Rahim",
    customerPhone: "01712345678",
    deliveryAddress: "12 Sonadanga, Khulna",
    deliveryArea: "sonadanga",
    items: [{ productId: "p1", quantity: 2 }],
  };

  it("passes a well-formed order", () => {
    expect(checkoutSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an empty cart", () => {
    expect(checkoutSchema.safeParse({ ...base, items: [] }).success).toBe(false);
  });

  it("rejects a bad phone", () => {
    expect(
      checkoutSchema.safeParse({ ...base, customerPhone: "123" }).success,
    ).toBe(false);
  });
});

describe("currency formatting", () => {
  it("formats taka without fraction digits", () => {
    expect(formatTaka(420)).toContain("420");
  });
});
