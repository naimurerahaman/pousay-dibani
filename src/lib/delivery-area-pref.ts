import type { DeliveryAreaOption } from "@/lib/types";

export const DELIVERY_AREA_STORAGE_KEY = "pousay-dibani-delivery-area";
export const DELIVERY_AREA_UPDATED_EVENT = "pousay-delivery-area-updated";

export type SavedDeliveryArea = DeliveryAreaOption;

function isSavedDeliveryArea(value: unknown): value is SavedDeliveryArea {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.slug === "string" &&
    candidate.slug.length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.length > 0 &&
    typeof candidate.deliveryFee === "number" &&
    Number.isFinite(candidate.deliveryFee) &&
    candidate.deliveryFee >= 0
  );
}

export function parseSavedDeliveryArea(raw: string | null): SavedDeliveryArea | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSavedDeliveryArea(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readSavedDeliveryArea(): SavedDeliveryArea | null {
  if (typeof window === "undefined") return null;
  return parseSavedDeliveryArea(window.localStorage.getItem(DELIVERY_AREA_STORAGE_KEY));
}

export function writeSavedDeliveryArea(area: SavedDeliveryArea) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DELIVERY_AREA_STORAGE_KEY, JSON.stringify(area));
  window.dispatchEvent(new Event(DELIVERY_AREA_UPDATED_EVENT));
}

export function clearSavedDeliveryArea() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DELIVERY_AREA_STORAGE_KEY);
  window.dispatchEvent(new Event(DELIVERY_AREA_UPDATED_EVENT));
}

export function subscribeDeliveryArea(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(DELIVERY_AREA_UPDATED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(DELIVERY_AREA_UPDATED_EVENT, onStoreChange);
  };
}
