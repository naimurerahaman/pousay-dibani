import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DeliveryAreaForm } from "@/components/delivery-area-form";
import { deleteDeliveryArea, updateDeliveryArea } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

type EditDeliveryAreaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDeliveryAreaPage({ params }: EditDeliveryAreaPageProps) {
  const { id } = await params;
  const area = await prisma.deliveryArea.findUnique({ where: { id } });
  if (!area) {
    notFound();
  }

  async function action(formData: FormData) {
    "use server";
    return updateDeliveryArea(id, {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      deliveryFee: String(formData.get("deliveryFee") ?? "0"),
      isActive: formData.get("isActive") === "on",
    });
  }

  async function deleteAction() {
    "use server";
    return deleteDeliveryArea(id);
  }

  return (
    <DeliveryAreaForm
      mode="edit"
      initial={{
        name: area.name,
        slug: area.slug,
        deliveryFee: area.deliveryFee,
        isActive: area.isActive,
      }}
      action={action}
      deleteAction={deleteAction}
    />
  );
}
