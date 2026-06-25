import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/product-form";
import { deleteProduct, updateProduct } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) {
    notFound();
  }

  async function action(formData: FormData) {
    "use server";
    return updateProduct(id, {
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

  async function deleteAction() {
    "use server";
    return deleteProduct(id);
  }

  return (
    <ProductForm
      mode="edit"
      initial={{
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        unit: product.unit,
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
        stockStatus: product.stockStatus,
        stockQty: product.stockQty,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      }}
      categories={categories}
      action={action}
      deleteAction={deleteAction}
    />
  );
}
