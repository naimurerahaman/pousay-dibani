"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Route } from "next";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Package,
  Tag,
} from "lucide-react";
import { useTransition, type ReactNode } from "react";

type NavItem = {
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/delivery-areas", label: "Delivery areas", icon: MapPinned },
];

type AdminShellProps = {
  adminName: string;
  adminEmail: string;
  children: ReactNode;
};

export function AdminShell({ adminName, adminEmail, children }: AdminShellProps) {
  const pathname = usePathname();
  const [isSigningOut, startSignOut] = useTransition();

  function handleSignOut() {
    startSignOut(() => {
      void signOut({ callbackUrl: "/admin/login" });
    });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <Link className="brand" href="/admin">
          <span className="brand__mark">
            <BarChart3 size={21} aria-hidden="true" />
          </span>
          <span className="brand__copy">
            <span className="brand__name">Admin</span>
            <span className="brand__area">Pousay Dibani</span>
          </span>
        </Link>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav__link${isActive ? " is-active" : ""}`}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <div>
            <strong>{adminName}</strong>
            <p className="muted">{adminEmail}</p>
          </div>
          <button
            className="button-ghost"
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut size={16} aria-hidden="true" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
