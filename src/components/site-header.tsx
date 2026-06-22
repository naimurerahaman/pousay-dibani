"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackageCheck } from "lucide-react";
import { CartLink } from "@/components/cart-link";
import { NavAreaButton } from "@/components/nav-area-button";
import type { LocationPickerOption } from "@/components/location-picker";

type SiteHeaderProps = {
  deliveryAreas: LocationPickerOption[];
};

export function SiteHeader({ deliveryAreas }: SiteHeaderProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <div className="top-banner" role="status">
        <span className="top-banner__inner">
          <span className="top-banner__dot" aria-hidden="true" />
          We are available. Delivering till 11:59&nbsp;PM
        </span>
      </div>
      <header className="site-header">
        <div className="site-header__inner">
        <Link className="brand" href="/">
          <span className="brand__mark">
            <PackageCheck size={21} aria-hidden="true" />
          </span>
          <span className="brand__copy">
            <span className="brand__name">Pousay Dibani</span>
            <NavAreaButton areas={deliveryAreas} />
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
    </>
  );
}
