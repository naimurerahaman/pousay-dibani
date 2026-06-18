export const RECENT_ORDER_STORAGE_KEY = "pousay-dibani-recent-order";
export const RECENT_ORDER_UPDATED_EVENT = "pousay-recent-order-updated";

export type RecentOrderRef = {
  orderNumber: string;
  customerPhone: string;
  savedAt: number;
};

function isRecentOrderRef(value: unknown): value is RecentOrderRef {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.orderNumber === "string" &&
    candidate.orderNumber.length > 0 &&
    typeof candidate.customerPhone === "string" &&
    candidate.customerPhone.length > 0 &&
    typeof candidate.savedAt === "number" &&
    Number.isFinite(candidate.savedAt)
  );
}

export function parseRecentOrder(raw: string | null): RecentOrderRef | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecentOrderRef(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readRecentOrder(): RecentOrderRef | null {
  if (typeof window === "undefined") return null;
  return parseRecentOrder(window.localStorage.getItem(RECENT_ORDER_STORAGE_KEY));
}

export function writeRecentOrder(ref: RecentOrderRef) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_ORDER_STORAGE_KEY, JSON.stringify(ref));
    window.dispatchEvent(new Event(RECENT_ORDER_UPDATED_EVENT));
  } catch {
    // localStorage can be unavailable (private mode, quota); this is best-effort.
  }
}

export function clearRecentOrder() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RECENT_ORDER_STORAGE_KEY);
  window.dispatchEvent(new Event(RECENT_ORDER_UPDATED_EVENT));
}

export function subscribeRecentOrder(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(RECENT_ORDER_UPDATED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(RECENT_ORDER_UPDATED_EVENT, onStoreChange);
  };
}