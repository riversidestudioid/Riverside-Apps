import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
export default async function AdminApps() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error("Daftar aplikasi belum dapat dimuat.");
  return (
    <>
      <div className="section-heading">
        <h1>Kelola Aplikasi</h1>
        <Link className="button" href="/admin/apps/new">
          Tambah Aplikasi
        </Link>
      </div>
      <div className="admin-list">
        {data.length === 0 ? (
          <p className="empty-state">
            Belum ada aplikasi. Tambahkan aplikasi pertama sebagai draft.
          </p>
        ) : (
          data.map((a) => (
            <article key={a.id} className="product-card admin-row">
              <div>
                <h2>{a.name}</h2>
                <p>/{a.slug}</p>
                <span className="badge">{a.status}</span>
              </div>
              <Link className="button secondary" href={`/admin/apps/${a.id}`}>
                Kelola
              </Link>
            </article>
          ))
        )}
      </div>
    </>
  );
}
