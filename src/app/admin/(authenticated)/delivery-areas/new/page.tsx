import { DeliveryAreaForm } from "@/components/delivery-area-form";
import { createDeliveryArea } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default function NewDeliveryAreaPage() {
  async function action(formData: FormData) {
    "use server";
    return createDeliveryArea({
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      deliveryFee: String(formData.get("deliveryFee") ?? "0"),
      isActive: formData.get("isActive") === "on",
    });
  }

  return (
    <DeliveryAreaForm
      mode="create"
      initial={{ name: "", slug: "", deliveryFee: 60, isActive: true }}
      action={action}
    />
  );
}
