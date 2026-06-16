import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/category-form";
import { deleteCategory, updateCategory } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    notFound();
  }

  async function action(formData: FormData) {
    "use server";
    return updateCategory(id, {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      description: String(formData.get("description") ?? ""),
      isActive: formData.get("isActive") === "on",
    });
  }

  async function deleteAction() {
    "use server";
    return deleteCategory(id);
  }

  return (
    <CategoryForm
      mode="edit"
      initial={{
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: category.isActive,
      }}
      action={action}
      deleteAction={deleteAction}
    />
  );
}
