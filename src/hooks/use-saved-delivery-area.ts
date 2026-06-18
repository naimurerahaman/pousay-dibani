"use client";

import { useSyncExternalStore } from "react";
import {
  DELIVERY_AREA_STORAGE_KEY,
  parseSavedDeliveryArea,
  subscribeDeliveryArea,
  type SavedDeliveryArea,
} from "@/lib/delivery-area-pref";

function getSnapshot(): string | null {
  return window.localStorage.getItem(DELIVERY_AREA_STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

export function useSavedDeliveryArea(): SavedDeliveryArea | null {
  const raw = useSyncExternalStore(
    subscribeDeliveryArea,
    getSnapshot,
    getServerSnapshot,
  );

  return parseSavedDeliveryArea(raw);
}
