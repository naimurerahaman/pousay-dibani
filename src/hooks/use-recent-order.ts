"use client";

import { useSyncExternalStore } from "react";
import {
  parseRecentOrder,
  RECENT_ORDER_STORAGE_KEY,
  subscribeRecentOrder,
  type RecentOrderRef,
} from "@/lib/recent-order";

function getSnapshot(): string | null {
  return window.localStorage.getItem(RECENT_ORDER_STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

export function useRecentOrder(): RecentOrderRef | null {
  const raw = useSyncExternalStore(
    subscribeRecentOrder,
    getSnapshot,
    getServerSnapshot,
  );

  return parseRecentOrder(raw);
}
