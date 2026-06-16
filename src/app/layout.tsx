import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pousay Dibani | Khulna Home Delivery",
  description:
    "Order groceries, household essentials, health basics, and stationery for home delivery in Khulna city.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="page-shell">
          <SiteHeader />
          <main>{children}</main>
          <footer className="site-footer">
            <div className="section">
              Pousay Dibani delivers selected goods across supported Khulna city
              areas with cash on delivery.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
