"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackageCheck, Phone, Mail, Clock3, MapPin } from "lucide-react";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="brand">
            <span className="brand__mark">
              <PackageCheck size={20} aria-hidden="true" />
            </span>
            <span className="brand__name">Pousay Dibani</span>
          </span>
          <p>
            Everyday groceries and home essentials delivered across Khulna city,
            with cash on delivery.
          </p>
        </div>

        <div>
          <h4>Shop</h4>
          <nav className="site-footer__links" aria-label="Footer">
            <Link href="/products">All products</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/checkout">Checkout</Link>
            <Link href="/order-status">Track order</Link>
          </nav>
        </div>

        <div>
          <h4>Contact</h4>
          <div className="site-footer__contact">
            <a className="site-footer__contact-item" href="tel:+8801334186886">
              <Phone size={16} aria-hidden="true" />
              +880 1334-186886
            </a>
            <a
              className="site-footer__contact-item"
              href="mailto:support@pousaydibani.com"
            >
              <Mail size={16} aria-hidden="true" />
              support@pousaydibani.com
            </a>
            <span className="site-footer__contact-item">
              <Clock3 size={16} aria-hidden="true" />
              Open daily — delivery till 11:59 PM
            </span>
            <span className="site-footer__contact-item">
              <MapPin size={16} aria-hidden="true" />
              Khulna City, Bangladesh
            </span>
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="site-footer__bottom-inner">
          © {year} Pousay Dibani · Cash on delivery across Khulna
        </div>
      </div>
    </footer>
  );
}
