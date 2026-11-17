import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct } from "@/lib/catalog/queries";
import { formatPrice } from "@/lib/catalog/validation";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProduct(slug);
  return {
    title: p?.app.name ?? "Aplikasi",
    description: p?.app.short_description,
  };
}
export default async function Product({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const { app, media, plans, category } = product;
  const features = [
    ...new Set([
      ...(app.key_features ?? []),
      ...plans.flatMap((p) => p.features),
    ]),
  ];
  return (
    <main id="main" className="product-detail container">
      <Link className="text-link" href="/apps">
        ← Kembali ke Katalog
      </Link>
      <header className="product-detail-header">
        {media.find((m) => m.kind === "thumbnail") && (
          <Image
            unoptimized
            className="detail-icon"
            src={`/media/${media.find((m) => m.kind === "thumbnail")!.id}`}
            alt=""
            width={100}
            height={100}
          />
        )}
        <div>
          <span className="ecosystem">
            {category?.name} · {app.platform}
          </span>
          <h1>{app.name}</h1>
          <p>{app.tagline}</p>
        </div>
      </header>
      {app.launch_url && (
        <a
          className="button secondary"
          href={app.launch_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Kunjungi Aplikasi
        </a>
      )}
      <section>
        <h2>Tentang Aplikasi</h2>
        <p className="description-text">{app.description}</p>
      </section>
      {features.length > 0 && (
        <section>
          <h2>Fitur Aplikasi</h2>
          <p>Fitur tersedia sesuai paket yang dipilih.</p>
          <ul className="feature-list">
            {features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      )}
      {media.some((m) => m.kind === "screenshot") && (
        <section>
          <h2>Screenshot Produk</h2>
          <div className="screenshots">
            {media
              .filter((m) => m.kind === "screenshot")
              .map((m) => (
                <figure key={m.id}>
                  <Image
                    unoptimized
                    src={`/media/${m.id}`}
                    alt={m.alt_text}
                    width={800}
                    height={450}
                    loading="lazy"
                  />
                  <figcaption>{m.alt_text}</figcaption>
                </figure>
              ))}
          </div>
        </section>
      )}
      {media.some((m) => ["video", "youtube"].includes(m.kind)) && (
        <section>
          <h2>Video Demo</h2>
          <div className="media-grid">
            {media
              .filter((m) => ["video", "youtube"].includes(m.kind))
              .map((m) => (
                <figure key={m.id}>
                  {m.kind === "youtube" ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${m.youtube_id}`}
                      title={m.alt_text}
                      loading="lazy"
                      allow="fullscreen; picture-in-picture"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={`/media/${m.id}`}
                      controls
                      preload="metadata"
                      aria-label={m.alt_text}
                    />
                  )}
                  <figcaption>{m.alt_text}</figcaption>
                </figure>
              ))}
          </div>
        </section>
      )}
      <section>
        <h2>Pilihan Harga</h2>
        {plans.length === 0 && (
          <p className="empty-state">Paket harga belum tersedia.</p>
        )}
        <div className="pricing-grid">
          {plans.map((p) => (
            <article className="product-card" key={p.id}>
              <h3>{p.name}</h3>
              <strong className="price">
                {formatPrice(p.price_idr, p.billing_type)}
              </strong>
              <ul>
                {p.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <p>{p.license_policy}</p>
              {p.billing_type === "free" && app.launch_url ? (
                <a
                  href={app.launch_url}
                  className="button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Gunakan Sekarang
                </a>
              ) : (
                <button className="button secondary" disabled>
                  Pembayaran Belum Tersedia
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
      {app.demo_url && (
        <a
          className="button"
          href={app.demo_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Coba Demo
        </a>
      )}
    </main>
  );
}
