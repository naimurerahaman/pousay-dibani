"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
        <div className="brand-group">
          <Link className="brand" href="/" aria-label="Pousay Dibani — home">
            <Image
              className="brand__logo"
              src="/logo.png"
              alt="Pousay Dibani"
              width={500}
              height={500}
              priority
            />
          </Link>
          <NavAreaButton areas={deliveryAreas} />
        </div>

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
