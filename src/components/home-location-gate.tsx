"use client";

import { LocationPicker } from "@/components/location-picker";
import { useSavedDeliveryArea } from "@/hooks/use-saved-delivery-area";
import { writeSavedDeliveryArea } from "@/lib/delivery-area-pref";
import type { DeliveryAreaOption } from "@/lib/types";

type HomeLocationGateProps = {
  areas: DeliveryAreaOption[];
};

export function HomeLocationGate({ areas }: HomeLocationGateProps) {
  const savedArea = useSavedDeliveryArea();

  if (savedArea) {
    return null;
  }

  return (
    <LocationPicker
      open
      required
      options={areas}
      onSelect={writeSavedDeliveryArea}
      onClose={() => {
        // Required mode: the picker ignores close attempts; only selecting
        // an area will dismiss it (which writes to storage and re-renders
        // this gate as null).
      }}
    />
  );
}