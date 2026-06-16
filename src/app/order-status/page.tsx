import { OrderStatusForm } from "@/components/order-status-form";
import { lookupOrder } from "@/lib/order-actions";
import { formatPhone } from "@/lib/orders";

export const dynamic = "force-dynamic";

type OrderStatusPageProps = {
  searchParams: Promise<{
    orderNumber?: string;
    phone?: string;
  }>;
};

export default async function OrderStatusPage({
  searchParams,
}: OrderStatusPageProps) {
  const params = await searchParams;
  const rawOrder = params.orderNumber?.trim() ?? "";
  const rawPhone = formatPhone(params.phone ?? "");

  let initialResult = null;
  let initialError: string | null = null;

  if (rawOrder && rawPhone) {
    const response = await lookupOrder({
      orderNumber: rawOrder,
      customerPhone: rawPhone,
    });

    if (response.ok) {
      initialResult = response.order;
    } else {
      initialError = response.error;
    }
  }

  return (
    <section className="section">
      <h1 className="page-title">Order status</h1>
      <p className="page-intro">
        Check a Pousay Dibani delivery using the order number and customer
        phone number.
      </p>
      <OrderStatusForm
        initialOrderNumber={rawOrder}
        initialPhone={params.phone ?? ""}
        initialResult={initialResult}
        initialError={initialError}
      />
    </section>
  );
}
