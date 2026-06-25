import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/product-form";
import { createProduct } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  async function action(formData: FormData) {
    "use server";
    return createProduct({
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: String(formData.get("price") ?? "0"),
      unit: String(formData.get("unit") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      stockStatus: String(formData.get("stockStatus") ?? "IN_STOCK"),
      stockQty: String(formData.get("stockQty") ?? "0"),
      isActive: formData.get("isActive") === "on",
      isFeatured: formData.get("isFeatured") === "on",
    });
  }

  return (
    <ProductForm
      mode="create"
      initial={{
        name: "",
        slug: "",
        description: "",
        price: 0,
        unit: "",
        imageUrl: "",
        categoryId: categories[0]?.id ?? "",
        stockStatus: "IN_STOCK",
        stockQty: 0,
        isActive: true,
        isFeatured: false,
      }}
      categories={categories}
      action={action}
    />
  );
}
