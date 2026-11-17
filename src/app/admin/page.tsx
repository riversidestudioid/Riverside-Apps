import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const counts = await Promise.all([
    supabase.from("apps").select("id", { count: "exact", head: true }),
    ...(["draft", "published", "archived"] as const).map((status) =>
      supabase
        .from("apps")
        .select("id", { count: "exact", head: true })
        .eq("status", status),
    ),
  ]);
  if (counts.some((r) => r.error))
    throw new Error("Ringkasan belum dapat dimuat.");
  const cards = ["Total Aplikasi", "Draft", "Dipublikasikan", "Diarsipkan"];
  return (
    <>
      <span className="ecosystem">Workspace Riverside Studio</span>
      <h1>Overview</h1>
      <p>Semua aplikasi dan kebutuhan katalog Anda, dalam satu tempat.</p>
      <div className="admin-stats admin-stats-four">
        {cards.map((label, i) => (
          <div className="product-card" key={label}>
            <span>{label}</span>
            <strong>{counts[i].count ?? 0}</strong>
            <small>
              {i === 2
                ? "Tersedia untuk katalog publik"
                : "Data katalog saat ini"}
            </small>
          </div>
        ))}
      </div>
      <div className="admin-welcome">
        <div>
          <h2>Siap menambahkan karya berikutnya?</h2>
          <p>
            Mulai dari draft, lengkapi media dan harga, lalu publikasikan saat
            siap.
          </p>
        </div>
        <Link className="button" href="/admin/apps/new">
          Tambah Aplikasi
        </Link>
      </div>
      <p className="notice">
        Harga yang ditampilkan adalah informasi paket. Pembayaran belum
        diaktifkan.
      </p>
    </>
  );
}
