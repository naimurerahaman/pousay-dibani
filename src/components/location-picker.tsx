"use client";

import { Check, MapPin, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { formatTaka } from "@/lib/format";
import type { DeliveryAreaOption } from "@/lib/types";

export type LocationPickerOption = DeliveryAreaOption;

type LocationPickerProps = {
  open: boolean;
  options: LocationPickerOption[];
  selectedSlug?: string | null;
  /** When true, the user must pick an area before the modal can close. */
  required?: boolean;
  title?: string;
  description?: string;
  onSelect: (area: LocationPickerOption) => void;
  onClose: () => void;
};

export function LocationPicker({
  open,
  options,
  selectedSlug = null,
  required = false,
  title = "Where should we deliver?",
  description = "Pick your delivery area so we can show accurate delivery fees and confirm coverage.",
  onSelect,
  onClose,
}: LocationPickerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [showRequiredHint, setShowRequiredHint] = useState(false);

  // The parent is expected to remount this component (via a `key` prop)
  // each time `open` transitions from false to true, which guarantees a
  // fresh `showRequiredHint` state on every open.

  // Body scroll lock, Escape handler, and initial focus.
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (required) {
          setShowRequiredHint(true);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, required, onClose]);

  if (!open) {
    return null;
  }

  function handleBackdropClick() {
    if (required) {
      setShowRequiredHint(true);
      return;
    }
    onClose();
  }

  return (
    <div
      className="location-picker__backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-modal="true"
        className="location-picker__dialog"
        role="dialog"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="location-picker__header">
          <div>
            <span className="eyebrow">
              <MapPin size={14} aria-hidden="true" /> Delivery area
            </span>
            <h2 id={titleId} className="location-picker__title">
              {title}
            </h2>
            <p id={descriptionId} className="location-picker__description">
              {description}
            </p>
          </div>
          {!required ? (
            <button
              type="button"
              className="location-picker__close"
              aria-label="Close location picker"
              onClick={onClose}
            >
              <X size={18} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {required && showRequiredHint ? (
          <div className="form-banner" role="status">
            Please choose a delivery area to continue.
          </div>
        ) : null}

        <ul className="location-picker__list" role="listbox" aria-label="Delivery areas">
          {options.length === 0 ? (
            <li className="location-picker__empty">
              No delivery areas are currently active. Please check back later.
            </li>
          ) : (
            options.map((option) => {
              const isSelected = option.slug === selectedSlug;
              return (
                <li key={option.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={
                      "location-picker__option" +
                      (isSelected ? " location-picker__option--selected" : "")
                    }
                    onClick={() => onSelect(option)}
                  >
                    <span className="location-picker__option-main">
                      <span className="location-picker__option-name">
                        {isSelected ? (
                          <Check size={16} aria-hidden="true" />
                        ) : (
                          <MapPin size={16} aria-hidden="true" />
                        )}
                        {option.name}
                      </span>
                      <span className="location-picker__option-fee">
                        Delivery fee: {formatTaka(option.deliveryFee)}
                      </span>
                    </span>
                    <span className="location-picker__option-fee-strong">
                      {formatTaka(option.deliveryFee)}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}