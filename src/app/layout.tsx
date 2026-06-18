import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getActiveDeliveryAreas } from "@/lib/order-actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pousay Dibani | Khulna Home Delivery",
  description:
    "Order groceries, household essentials, health basics, and stationery for home delivery in Khulna city.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const deliveryAreas = await getActiveDeliveryAreas();

  return (
    <html lang="en">
      <body>
        <div className="page-shell">
          <SiteHeader deliveryAreas={deliveryAreas} />
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
