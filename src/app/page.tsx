import Image from "next/image";
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
import { ProductCard } from "@/components/product-card";
import {
  getActiveCategories,
  getFeaturedProducts,
} from "@/lib/catalog";

const categoryIcons = [PackageSearch, Home, ShieldCheck, Sparkles];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    getActiveCategories(),
    getFeaturedProducts(),
  ]);

  return (
    <>
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

        <div className="hero-visual" aria-label="Fresh grocery delivery">
          <div className="hero-visual__image">
            <Image
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
              alt="Fresh vegetables and groceries prepared for delivery"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 46vw"
              style={{ objectFit: "cover" }}
            />
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
          {categories.map((category, index) => {
            const Icon = categoryIcons[index] ?? PackageSearch;

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
            <h2>Featured products</h2>
            <p>Useful goods for the first Khulna delivery catalog.</p>
          </div>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
