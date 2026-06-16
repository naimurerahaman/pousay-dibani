import Link from "next/link";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { getActiveCategories, searchProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const selectedCategory = params.category ?? "";

  const [categories, products] = await Promise.all([
    getActiveCategories(),
    searchProducts({ query, categoryId: selectedCategory }),
  ]);

  return (
    <section className="section">
      <h1 className="page-title">Products</h1>
      <p className="page-intro">
        Browse the first Pousay Dibani catalog for Khulna home delivery.
      </p>

      <form className="checkout-panel" action="/products">
        <div className="form-grid">
          <label className="field">
            <span>Search</span>
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Rice, detergent, notebook"
            />
          </label>
          <label className="field">
            <span>Category</span>
            <select name="category" defaultValue={selectedCategory}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="button" type="submit">
          <Search size={17} aria-hidden="true" />
          Search
        </button>
      </form>

      <div className="section-heading">
        <div>
          <h2>{products.length} items available</h2>
          <p>
            Prices are listed in Bangladeshi taka and checkout uses cash on
            delivery.
          </p>
        </div>
        <Link className="button-ghost" href="/products">
          Reset
        </Link>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
