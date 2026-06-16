import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Categories</h1>
          <p className="muted">Manage product groups shown to customers.</p>
        </div>
        <Link className="button-link button-link--primary" href="/admin/categories/new">
          <Plus size={16} aria-hidden="true" /> New category
        </Link>
      </div>

      <div className="admin-card">
        {categories.length === 0 ? (
          <p className="muted">No categories yet. Create one to get started.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <strong>{category.name}</strong>
                    <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                      {category.description}
                    </p>
                  </td>
                  <td>
                    <code>{category.slug}</code>
                  </td>
                  <td>{category._count.products}</td>
                  <td>
                    <span className={`status-pill ${category.isActive ? "status-pill--success" : ""}`}>
                      {category.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <Link
                      className="button-link"
                      href={`/admin/categories/${category.id}`}
                    >
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
