"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save, Trash2 } from "lucide-react";
import { type AdminActionResult } from "@/lib/admin-constants";

type DeliveryAreaFormValues = {
  name: string;
  slug: string;
  deliveryFee: number;
  isActive: boolean;
};

type DeliveryAreaFormProps = {
  mode: "create" | "edit";
  initial: DeliveryAreaFormValues;
  action: (formData: FormData) => Promise<AdminActionResult>;
  deleteAction?: () => Promise<AdminActionResult>;
};

export function DeliveryAreaForm({
  mode,
  initial,
  action,
  deleteAction,
}: DeliveryAreaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }
      router.push("/admin/delivery-areas");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteAction) return;
    if (!window.confirm("Delete this delivery area?")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/delivery-areas");
      router.refresh();
    });
  }

  return (
    <form className="checkout-panel" onSubmit={handleSubmit}>
      <h2>{mode === "create" ? "New delivery area" : "Edit delivery area"}</h2>
      {error ? <div className="form-banner">{error}</div> : null}

      <div className="form-grid">
        <label className="field">
          <span>Name</span>
          <input
            name="name"
            defaultValue={initial.name}
            required
            minLength={2}
            maxLength={60}
          />
          {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
        </label>
        <label className="field">
          <span>Slug</span>
          <input
            name="slug"
            defaultValue={initial.slug}
            placeholder="auto-generated from name"
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          />
          {fieldErrors.slug ? <span className="field-error">{fieldErrors.slug}</span> : null}
        </label>
        <label className="field">
          <span>Delivery fee (taka)</span>
          <input
            name="deliveryFee"
            type="number"
            min={0}
            step={1}
            defaultValue={initial.deliveryFee}
            required
          />
          {fieldErrors.deliveryFee ? (
            <span className="field-error">{fieldErrors.deliveryFee}</span>
          ) : null}
        </label>
        <label className="field field--checkbox">
          <input type="checkbox" name="isActive" defaultChecked={initial.isActive} />
          <span>Active and offered at checkout</span>
        </label>
      </div>

      <div className="admin-toolbar" style={{ marginTop: 16 }}>
        <button className="button" type="submit" disabled={isPending}>
          <Save size={16} aria-hidden="true" />
          {isPending ? "Saving…" : mode === "create" ? "Create area" : "Save changes"}
        </button>
        {deleteAction ? (
          <button
            className="button-link button-link--danger"
            type="button"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 size={16} aria-hidden="true" />
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
