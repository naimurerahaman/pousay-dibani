"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Mail, Clock3, MapPin } from "lucide-react";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const year = new Date().getFullYear();

  // Real contact details come from env; fall back to the known phone number.
  const supportPhone =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+880 1334-186886";
  const supportPhoneHref = `tel:${supportPhone.replace(/[^+\d]/g, "")}`;
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Image
            className="brand__logo"
            src="/logo.png"
            alt="Pousay Dibani"
            width={500}
            height={500}
          />
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
            <a className="site-footer__contact-item" href={supportPhoneHref}>
              <Phone size={16} aria-hidden="true" />
              {supportPhone}
            </a>
            {supportEmail ? (
              <a
                className="site-footer__contact-item"
                href={`mailto:${supportEmail}`}
              >
                <Mail size={16} aria-hidden="true" />
                {supportEmail}
              </a>
            ) : null}
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
