import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTaka } from "@/lib/format";
import { stockStatusLabels } from "@/lib/admin-constants";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { category: true },
  });

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Products</h1>
          <p className="muted">Add, edit, and retire items in the catalog.</p>
        </div>
        <Link className="button-link button-link--primary" href="/admin/products/new">
          <Plus size={16} aria-hidden="true" /> New product
        </Link>
      </div>

      <div className="admin-card">
        {products.length === 0 ? (
          <p className="muted">No products yet. Add your first product to get started.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Flags</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                      {product.unit} · <code>{product.slug}</code>
                    </p>
                  </td>
                  <td>{product.category.name}</td>
                  <td>{formatTaka(product.price)}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        product.stockStatus === "IN_STOCK"
                          ? "status-pill--success"
                          : product.stockStatus === "OUT_OF_STOCK"
                            ? "status-pill--danger"
                            : ""
                      }`}
                    >
                      {stockStatusLabels[product.stockStatus]}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      {product.isFeatured ? (
                        <span className="status-pill status-pill--info">Featured</span>
                      ) : null}
                      {!product.isActive ? (
                        <span className="status-pill status-pill--danger">Hidden</span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <Link className="button-link" href={`/admin/products/${product.id}`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
