import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Home,
  MapPinned,
  PackageSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { HomeLocationGate } from "@/components/home-location-gate";
import { HeroSlider, type HeroSlide } from "@/components/hero-slider";
import { ProductCard } from "@/components/product-card";
import { ProductsSlider } from "@/components/products-slider";
import {
  getActiveCategories,
  getFeaturedProducts,
} from "@/lib/catalog";
import { getActiveDeliveryAreas } from "@/lib/order-actions";

const categoryIcons = [PackageSearch, Home, ShieldCheck, Sparkles];

// Hero carousel slides — edit these to change the offers/sales/featured promos.
// Graphics are 3D illustrations stored in /public/hero.
const heroSlides: HeroSlide[] = [
  {
    image: "/hero/leafy-green.png",
    badge: "Fresh today",
    title: "Daily groceries, delivered fast",
    subtitle: "Order now for same-day delivery across Khulna city.",
    href: "/products",
    gradient: "linear-gradient(135deg, #0f3d2e 0%, #176b4a 100%)",
  },
  {
    image: "/hero/delivery-truck.png",
    badge: "Open late",
    title: "Delivering till 11:59 PM",
    subtitle: "Late-night essentials, sorted — we're available now.",
    href: "/products",
    gradient: "linear-gradient(135deg, #1e2a52 0%, #3a4ea0 100%)",
  },
  {
    image: "/hero/money-wings.png",
    badge: "Cash on delivery",
    title: "Pay when it arrives",
    subtitle: "No online payment needed — simple and safe.",
    href: "/products",
    gradient: "linear-gradient(135deg, #5a3210 0%, #b9772a 100%)",
  },
  {
    image: "/hero/shopping-bags.png",
    badge: "Featured",
    title: "Snacks & drinks favourites",
    subtitle: "Stock up on the most-ordered treats.",
    href: "/products?category=snacks-drinks",
    gradient: "linear-gradient(135deg, #4a1340 0%, #9c2c7a 100%)",
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featuredProducts, deliveryAreas] = await Promise.all([
    getActiveCategories(),
    getFeaturedProducts(),
    getActiveDeliveryAreas(),
  ]);

  return (
    <>
      <HomeLocationGate areas={deliveryAreas} />
      <section className="section hero">
        <div>
          <span className="eyebrow">
            <MapPinned size={16} aria-hidden="true" />
            Home delivery inside Khulna city
          </span>
          <h1>Pousay Dibani</h1>
          <p>
            Daily goods delivered from a focused local catalog: groceries,
            household essentials, health basics, and stationery for homes
            across supported Khulna areas.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/products">
              Shop products <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="button-secondary" href="/cart">
              View cart
            </Link>
          </div>
        </div>

        <div className="hero-visual" aria-label="Latest offers and featured items">
          <div className="hero-visual__image">
            <HeroSlider slides={heroSlides} />
          </div>
          <div className="hero-visual__footer">
            <span className="metric">
              <strong>৳60</strong>
              <span>Starting delivery fee</span>
            </span>
            <span className="metric">
              <strong>COD</strong>
              <span>Cash on delivery</span>
            </span>
            <span className="metric">
              <strong>
                <Clock3 size={17} aria-hidden="true" /> Local
              </strong>
              <span>Khulna operations</span>
            </span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Shop by category</h2>
            <p>
              Start with the product groups that matter most for daily home
              delivery.
            </p>
          </div>
          <Link className="button-ghost" href="/products">
            All products <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="category-grid">
          {categories.slice(0, 8).map((category, index) => {
            const Icon = categoryIcons[index % categoryIcons.length] ?? PackageSearch;

            return (
              <Link
                className="category-tile"
                href={`/products?category=${category.id}`}
                key={category.id}
              >
                <Icon size={24} color="#206a4a" aria-hidden="true" />
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Popular right now</h2>
            <p>Most-demanded items our Khulna customers order again and again.</p>
          </div>
          <Link className="button-ghost" href="/products">
            See all <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <ProductsSlider>
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ProductsSlider>
      </section>
    </>
  );
}
