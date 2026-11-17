import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  ExternalLink,
  MonitorPlay,
} from "lucide-react";
import { AppIcon } from "@/components/app-card";
import { getProduct } from "@/lib/catalog/queries";
import { platformLabels, safeExternalUrl } from "@/lib/catalog/validation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProduct(slug);
  return {
    title: p?.app.name ?? "Aplikasi",
    description: p?.app.short_description || p?.app.tagline || undefined,
  };
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function Product({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const { app, media, category } = product;
  const launchUrl = safeExternalUrl(app.launch_url);
  const demoUrl = safeExternalUrl(app.demo_url);
  const icon =
    media.find((m) => m.kind === "icon") ??
    media.find((m) => m.kind === "thumbnail");
  const screenshots = media.filter((m) => m.kind === "screenshot");
  const videos = media.filter((m) => m.kind === "video" || m.kind === "youtube");
  const features = (app.key_features ?? []).filter(Boolean);
  const summary = app.short_description || app.tagline;

  return (
    <main id="main" className="page container detail">
      <Link className="back-link" href="/apps">
        <ArrowLeft size={17} aria-hidden="true" /> Kembali ke Aplikasi
      </Link>

      <header className="detail-hero">
        <AppIcon
          mediaId={icon?.id ?? null}
          fallbackIcon={category.icon}
          seed={app.slug}
          size={88}
          className="detail-icon"
        />
        <div className="detail-title">
          <div className="chip-row">
            <span className="chip">{category.name}</span>
            <span className="chip chip-muted">{platformLabels[app.platform]}</span>
          </div>
          <h1>{app.name}</h1>
          {summary && <p>{summary}</p>}
        </div>
        <div className="detail-actions">
          {launchUrl && (
            <a
              className="button button-lg"
              href={launchUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buka Aplikasi <ExternalLink size={18} aria-hidden="true" />
            </a>
          )}
          {demoUrl && (
            <a
              className="button button-outline button-lg"
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MonitorPlay size={18} aria-hidden="true" /> Coba Demo
            </a>
          )}
          <small>Harga dan akses dikelola di dalam aplikasi.</small>
        </div>
      </header>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="card" aria-labelledby="about-title">
            <h2 id="about-title">Tentang Aplikasi</h2>
            <p className="prose">{app.description}</p>
          </section>

          {features.length > 0 && (
            <section className="card" aria-labelledby="features-title">
              <h2 id="features-title">Fitur Utama</h2>
              <ul className="feature-list">
                {features.map((f) => (
                  <li key={f}>
                    <CircleCheck size={19} aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {screenshots.length > 0 && (
            <section aria-labelledby="screens-title">
              <h2 id="screens-title" className="section-title">
                Screenshot
              </h2>
              <div className="screenshot-grid">
                {screenshots.map((m) => (
                  <figure key={m.id}>
                    <Image
                      unoptimized
                      src={`/media/${m.id}`}
                      alt={m.alt_text}
                      width={800}
                      height={500}
                      loading="lazy"
                    />
                    <figcaption>{m.alt_text}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {videos.length > 0 && (
            <section aria-labelledby="video-title">
              <h2 id="video-title" className="section-title">
                Video Demo
              </h2>
              <div className="video-grid">
                {videos.map((m) => (
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
        </div>

        <aside className="detail-aside">
          <section className="card" aria-labelledby="info-title">
            <h2 id="info-title">Informasi</h2>
            <dl className="info-list">
              <div>
                <dt>Kategori</dt>
                <dd>{category.name}</dd>
              </div>
              <div>
                <dt>Platform</dt>
                <dd>{platformLabels[app.platform]}</dd>
              </div>
              {launchUrl && (
                <div>
                  <dt>Alamat</dt>
                  <dd>{hostname(launchUrl)}</dd>
                </div>
              )}
            </dl>
          </section>
          <section className="card card-mint" aria-labelledby="custom-aside-title">
            <h2 id="custom-aside-title">Butuh versi khusus?</h2>
            <p>
              Kami dapat menyesuaikan fitur atau membangun aplikasi baru sesuai
              kebutuhan Anda.
            </p>
            <Link href="/custom" className="text-link">
              Konsultasi Sekarang <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
