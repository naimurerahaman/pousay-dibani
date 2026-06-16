"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save, Trash2 } from "lucide-react";
import { type AdminActionResult, stockStatusValues, stockStatusLabels } from "@/lib/admin-constants";

type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  price: number;
  unit: string;
  imageUrl: string;
  categoryId: string;
  stockStatus: "IN_STOCK" | "LIMITED" | "OUT_OF_STOCK";
  isActive: boolean;
  isFeatured: boolean;
};

type CategoryOption = {
  id: string;
  name: string;
};

type ProductFormProps = {
  mode: "create" | "edit";
  initial: ProductFormValues;
  categories: CategoryOption[];
  action: (formData: FormData) => Promise<AdminActionResult>;
  deleteAction?: () => Promise<AdminActionResult>;
};

export function ProductForm({
  mode,
  initial,
  categories,
  action,
  deleteAction,
}: ProductFormProps) {
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
      router.push("/admin/products");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteAction) return;
    if (!window.confirm("Delete this product? Existing orders will keep their product name.")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <form className="checkout-panel" onSubmit={handleSubmit}>
      <h2>{mode === "create" ? "New product" : "Edit product"}</h2>
      {error ? <div className="form-banner">{error}</div> : null}

      <div className="form-grid">
        <label className="field">
          <span>Name</span>
          <input
            name="name"
            defaultValue={initial.name}
            required
            minLength={2}
            maxLength={120}
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
            maxLength={1000}
            rows={3}
          />
          {fieldErrors.description ? (
            <span className="field-error">{fieldErrors.description}</span>
          ) : null}
        </label>

        <label className="field">
          <span>Price (taka)</span>
          <input
            name="price"
            type="number"
            min={1}
            step={1}
            defaultValue={initial.price}
            required
          />
          {fieldErrors.price ? <span className="field-error">{fieldErrors.price}</span> : null}
        </label>
        <label className="field">
          <span>Unit</span>
          <input
            name="unit"
            defaultValue={initial.unit}
            required
            placeholder="5 kg bag, 12 pcs, ..."
            maxLength={40}
          />
          {fieldErrors.unit ? <span className="field-error">{fieldErrors.unit}</span> : null}
        </label>

        <label className="field field--full">
          <span>Image URL</span>
          <input
            name="imageUrl"
            type="url"
            defaultValue={initial.imageUrl}
            required
            placeholder="https://images.unsplash.com/..."
          />
          {fieldErrors.imageUrl ? (
            <span className="field-error">{fieldErrors.imageUrl}</span>
          ) : null}
        </label>

        <label className="field">
          <span>Category</span>
          <select name="categoryId" defaultValue={initial.categoryId} required>
            <option value="" disabled>
              Select category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {fieldErrors.categoryId ? (
            <span className="field-error">{fieldErrors.categoryId}</span>
          ) : null}
        </label>
        <label className="field">
          <span>Stock status</span>
          <select name="stockStatus" defaultValue={initial.stockStatus}>
            {stockStatusValues.map((value) => (
              <option key={value} value={value}>
                {stockStatusLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="field field--checkbox">
          <input type="checkbox" name="isActive" defaultChecked={initial.isActive} />
          <span>Visible in store</span>
        </label>
        <label className="field field--checkbox">
          <input type="checkbox" name="isFeatured" defaultChecked={initial.isFeatured} />
          <span>Featured on home page</span>
        </label>
      </div>

      <div className="admin-toolbar" style={{ marginTop: 16 }}>
        <button className="button" type="submit" disabled={isPending}>
          <Save size={16} aria-hidden="true" />
          {isPending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
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
