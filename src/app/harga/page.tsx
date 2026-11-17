import Link from "next/link";
import { getCatalog } from "@/lib/catalog/queries";
import { formatPrice } from "@/lib/catalog/validation";
export const metadata = { title: "Pilihan Harga" };
export default async function Prices() {
  const data = await getCatalog();
  const apps = data.apps.filter(
    (a) => a.status === "published" && a.plans?.length,
  );
  return (
    <main id="main" className="content-page container">
      <h1>Pilihan Harga Aplikasi</h1>
      <p>
        Pilih akses gratis, sekali beli, bulanan, atau tahunan sesuai paket yang
        dipublikasikan. Pembayaran belum tersedia.
      </p>
      {apps.length ? (
        <div className="pricing-grid">
          {apps.map((a) => (
            <article className="product-card" key={a.slug}>
              <h2>{a.name}</h2>
              {a.plans?.map((p) => (
                <p key={p.id}>
                  {p.name}: {formatPrice(p.price_idr, p.billing_type)}
                </p>
              ))}
              <Link className="button secondary" href={`/apps/${a.slug}`}>
                Lihat Detail
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">
          Belum ada paket harga resmi yang dipublikasikan.
        </p>
      )}
    </main>
  );
}
