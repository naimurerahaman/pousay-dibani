import Link from "next/link";
import { MapPin, PackageCheck } from "lucide-react";
import { CartLink } from "@/components/cart-link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/">
          <span className="brand__mark">
            <PackageCheck size={21} aria-hidden="true" />
          </span>
          <span className="brand__copy">
            <span className="brand__name">Pousay Dibani</span>
            <span className="brand__area">
              <MapPin size={13} aria-hidden="true" /> Khulna city
            </span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link className="nav-link" href="/products">
            Products
          </Link>
          <Link className="nav-link" href="/checkout">
            Checkout
          </Link>
          <Link className="nav-link" href="/order-status">
            Order status
          </Link>
          <CartLink />
        </nav>
      </div>
    </header>
  );
}
