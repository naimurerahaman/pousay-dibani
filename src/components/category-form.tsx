"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save, Trash2 } from "lucide-react";
import {
  type AdminActionResult,
} from "@/lib/admin-constants";

type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

type CategoryFormProps = {
  mode: "create" | "edit";
  initial: CategoryFormValues;
  action: (formData: FormData) => Promise<AdminActionResult>;
  deleteAction?: () => Promise<AdminActionResult>;
};

export function CategoryForm({ mode, initial, action, deleteAction }: CategoryFormProps) {
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
      router.push("/admin/categories");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteAction) return;
    if (!window.confirm("Delete this category? Products in it must be moved first.")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/categories");
      router.refresh();
    });
  }

  return (
    <form className="checkout-panel" onSubmit={handleSubmit}>
      <h2>{mode === "create" ? "New category" : "Edit category"}</h2>
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
        <label className="field field--full">
          <span>Description</span>
          <textarea
            name="description"
            defaultValue={initial.description}
            required
            minLength={2}
            maxLength={280}
            rows={3}
          />
          {fieldErrors.description ? (
            <span className="field-error">{fieldErrors.description}</span>
          ) : null}
        </label>
        <label className="field field--checkbox">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={initial.isActive}
          />
          <span>Active in store</span>
        </label>
      </div>

      <div className="admin-toolbar" style={{ marginTop: 16 }}>
        <button className="button" type="submit" disabled={isPending}>
          <Save size={16} aria-hidden="true" />
          {isPending ? "Saving…" : mode === "create" ? "Create category" : "Save changes"}
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
