import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTaka } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryAreasPage() {
  const areas = await prisma.deliveryArea.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Delivery areas</h1>
          <p className="muted">Configure supported Khulna neighborhoods and their fees.</p>
        </div>
        <Link className="button-link button-link--primary" href="/admin/delivery-areas/new">
          <Plus size={16} aria-hidden="true" /> New area
        </Link>
      </div>

      <div className="admin-card">
        {areas.length === 0 ? (
          <p className="muted">No delivery areas yet. Add at least one to start taking orders.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Fee</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => (
                <tr key={area.id}>
                  <td>
                    <strong>{area.name}</strong>
                  </td>
                  <td>
                    <code>{area.slug}</code>
                  </td>
                  <td>{formatTaka(area.deliveryFee)}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        area.isActive ? "status-pill--success" : "status-pill--danger"
                      }`}
                    >
                      {area.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <Link className="button-link" href={`/admin/delivery-areas/${area.id}`}>
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
