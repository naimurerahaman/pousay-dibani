import { CheckoutForm } from "@/components/checkout-form";
import { getActiveDeliveryAreas } from "@/lib/order-actions";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const areas = await getActiveDeliveryAreas();

  return (
    <section className="section">
      <h1 className="page-title">Checkout</h1>
      <p className="page-intro">
        Enter delivery details for a Khulna city cash on delivery order.
      </p>
      <CheckoutForm areas={areas} />
    </section>
  );
}
