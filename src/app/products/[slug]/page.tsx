import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import {
  formatTaka,
  getCategoryById,
  getProductBySlug,
} from "@/lib/catalog";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const category = await getCategoryById(product.categoryId);

  return (
    <section className="section product-detail">
      <div className="product-detail__image">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          priority
          sizes="(max-width: 900px) 100vw, 48vw"
          style={{ objectFit: "cover" }}
        />
      </div>

      <div className="product-detail__content">
        <Link className="button-ghost" href="/products">
          <ArrowLeft size={16} aria-hidden="true" />
          Products
        </Link>
        {category ? (
          <p className="eyebrow" style={{ marginTop: 22 }}>
            {category.name}
          </p>
        ) : null}
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="product-card__meta" style={{ margin: "24px 0" }}>
          <span className="price">
            <strong>{formatTaka(product.price)}</strong>
            <span>{product.unit}</span>
          </span>
          <span className="stock-pill" data-status={product.stockStatus}>
            {product.stockStatus === "limited"
              ? "Limited"
              : product.stockStatus === "out_of_stock"
                ? "Sold out"
                : "In stock"}
          </span>
        </div>
        <AddToCartButton product={product} variant="primary" />
      </div>
    </section>
  );
}
