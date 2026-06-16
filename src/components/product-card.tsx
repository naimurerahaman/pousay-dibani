import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatTaka, getCategoryById } from "@/lib/catalog";
import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
};

const stockLabels = {
  in_stock: "In stock",
  limited: "Limited",
  out_of_stock: "Sold out",
};

export async function ProductCard({ product }: ProductCardProps) {
  const category = await getCategoryById(product.categoryId);

  return (
    <article className="product-card">
      <Link className="product-card__image" href={`/products/${product.slug}`}>
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 25vw"
          style={{ objectFit: "cover" }}
        />
      </Link>
      <div className="product-card__body">
        <div>
          {category ? (
            <span className="product-card__category">{category.name}</span>
          ) : null}
          <h3>
            <Link href={`/products/${product.slug}`}>
              {product.name} <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </h3>
          <p>{product.description}</p>
        </div>

        <div className="product-card__meta">
          <span className="price">
            <strong>{formatTaka(product.price)}</strong>
            <span>{product.unit}</span>
          </span>
          <span className="stock-pill" data-status={product.stockStatus}>
            {stockLabels[product.stockStatus]}
          </span>
        </div>

        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
