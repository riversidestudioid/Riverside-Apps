import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { formatPrice } from "@/lib/catalog/validation";
export default async function Plans() {
  const { supabase } = await requireAdmin("/admin/plans");
  const [apps, plans] = await Promise.all([
    supabase.from("apps").select("*").order("name"),
    supabase.from("plans").select("*").order("price_idr"),
  ]);
  if (apps.error || plans.error)
    throw new Error("Paket harga belum dapat dimuat.");
  return (
    <>
      <h1>Kelola Paket Harga</h1>
      <p>
        Kelola paket melalui editor aplikasi agar perubahan harga dan publikasi
        tersimpan bersama.
      </p>
      <div className="admin-list">
        {apps.data.length === 0 ? (
          <p className="empty-state">Belum ada aplikasi untuk diberi paket.</p>
        ) : (
          apps.data.map((a) => (
            <article className="product-card" key={a.id}>
              <div className="section-heading">
                <h2>{a.name}</h2>
                <Link
                  className="button secondary"
                  href={`/admin/apps/${a.id}#pricing`}
                >
                  Kelola Paket
                </Link>
              </div>
              {plans.data
                .filter((p) => p.app_id === a.id)
                .map((p) => (
                  <div className="plan-summary" key={p.id}>
                    <strong>{p.name}</strong>
                    <span>{formatPrice(p.price_idr, p.billing_type)}</span>
                    <small>{p.is_active ? "Aktif" : "Nonaktif"}</small>
                  </div>
                ))}
              {!plans.data.some((p) => p.app_id === a.id) && (
                <p>Belum ada paket.</p>
              )}
            </article>
          ))
        )}
      </div>
    </>
  );
}
