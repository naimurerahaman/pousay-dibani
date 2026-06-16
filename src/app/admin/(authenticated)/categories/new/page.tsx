import { CategoryForm } from "@/components/category-form";
import { createCategory } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default function NewCategoryPage() {
  async function action(formData: FormData) {
    "use server";
    return createCategory({
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      description: String(formData.get("description") ?? ""),
      isActive: formData.get("isActive") === "on",
    });
  }

  return (
    <CategoryForm
      mode="create"
      initial={{ name: "", slug: "", description: "", isActive: true }}
      action={action}
    />
  );
}
