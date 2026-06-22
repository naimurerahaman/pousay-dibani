"use client";

import type { ChangeEvent } from "react";

type CategoryOption = {
  id: string;
  name: string;
};

type CategoryFilterSelectProps = {
  categories: CategoryOption[];
  defaultValue: string;
};

/**
 * Category dropdown for the products filter. Submitting its parent form on
 * change means picking a category loads the relevant products immediately —
 * no separate "Search" click needed. The text search still uses the button
 * (or Enter), and the current search term is preserved on category change.
 */
export function CategoryFilterSelect({
  categories,
  defaultValue,
}: CategoryFilterSelectProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <select name="category" defaultValue={defaultValue} onChange={handleChange}>
      <option value="">All categories</option>
      {categories.map((category) => (
        <option value={category.id} key={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
