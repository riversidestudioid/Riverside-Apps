import { notFound } from "next/navigation";
import Link from "next/link";
import { draftApps } from "@/lib/catalog/data";
import { Icon } from "@/components/icon";
export default async function AppDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app =
    process.env.NODE_ENV === "development"
      ? draftApps.find((a) => a.slug === slug)
      : undefined;
  if (!app) notFound();
  return (
    <main id="main" className="content-page container">
      <span className="badge">Draft · preview development</span>
      <div style={{ marginBlock: 20 }}>
        <Icon name={app.icon} size={48} />
      </div>
      <h1>{app.name}</h1>
      <p>{app.tagline}</p>
      <p>{app.description}</p>
      <p>
        Produk ini masih berupa contoh konten desain. URL aplikasi, demo, harga,
        dan ketentuan akses belum tersedia.
      </p>
      <Link className="button secondary" href="/apps">
        Kembali ke Katalog
      </Link>
    </main>
  );
}

export const dynamicParams = false;
export function generateStaticParams() {
  return process.env.NODE_ENV === "development"
    ? draftApps.map((app) => ({ slug: app.slug }))
    : [];
}
