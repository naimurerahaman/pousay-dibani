import { CartView } from "@/components/cart-view";

export default function CartPage() {
  return (
    <section className="section">
      <h1 className="page-title">Cart</h1>
      <p className="page-intro">
        Review items and delivery total before placing a cash on delivery order.
      </p>
      <CartView />
    </section>
  );
}
