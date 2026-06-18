"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { LocationPicker } from "@/components/location-picker";
import { useSavedDeliveryArea } from "@/hooks/use-saved-delivery-area";
import { writeSavedDeliveryArea } from "@/lib/delivery-area-pref";
import type { DeliveryAreaOption } from "@/lib/types";

type NavAreaButtonProps = {
  areas: DeliveryAreaOption[];
};

export function NavAreaButton({ areas }: NavAreaButtonProps) {
  const savedArea = useSavedDeliveryArea();
  const [openCount, setOpenCount] = useState(0);

  const isOpen = openCount > 0;

  function handleSelect(area: DeliveryAreaOption) {
    writeSavedDeliveryArea(area);
    setOpenCount(0);
  }

  const label = savedArea ? savedArea.name : "Choose area";
  const ariaLabel = savedArea
    ? `Change delivery area. Current area: ${savedArea.name}.`
    : "Choose a delivery area.";

  return (
    <>
      <button
        type="button"
        className={
          "nav-area-button" +
          (savedArea ? " nav-area-button--set" : " nav-area-button--empty")
        }
        onClick={() => setOpenCount((count) => count + 1)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <MapPin size={14} aria-hidden="true" />
        <span className="nav-area-button__label">{label}</span>
      </button>
      {isOpen ? (
        <LocationPicker
          key={openCount}
          open
          options={areas}
          selectedSlug={savedArea?.slug ?? null}
          title="Change delivery area"
          description="Pick the Khulna area you want your order delivered to. You can update this any time."
          onSelect={handleSelect}
          onClose={() => setOpenCount(0)}
        />
      ) : null}
    </>
  );
}