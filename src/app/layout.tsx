import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getActiveDeliveryAreas } from "@/lib/order-actions";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

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
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="page-shell">
          <SiteHeader deliveryAreas={deliveryAreas} />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
