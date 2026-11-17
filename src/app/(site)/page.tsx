import Link from "next/link";
import { ArrowRight, CodeXml, LayoutGrid, MessagesSquare } from "lucide-react";
import { AppCard } from "@/components/app-card";
import { BrandMark } from "@/components/brand";
import { getFeaturedApps } from "@/lib/catalog/queries";

export default async function Home() {
  const { apps, categories } = await getFeaturedApps(6);
  return (
    <main id="main">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>
              Solusi Aplikasi &amp; Web App
              <span>untuk Kebutuhanmu.</span>
            </h1>
            <p className="hero-lead">
              Temukan aplikasi siap pakai atau buat aplikasi custom sesuai
              kebutuhan gereja, sekolah, bisnis, dan organisasi.
            </p>
            <div className="hero-actions">
              <Link className="button button-lg" href="/apps">
                <LayoutGrid size={20} aria-hidden="true" />
                Jelajahi Aplikasi
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="button button-outline button-lg" href="/custom">
                <CodeXml size={20} aria-hidden="true" />
                Pesan Aplikasi Custom
              </Link>
            </div>
          </div>
          <div className="hero-accent" aria-hidden="true">
            <BrandMark className="hero-accent-mark" />
          </div>
        </div>
      </section>

      <section className="section container" aria-labelledby="featured-title">
        <div className="section-head">
          <h2 id="featured-title">Aplikasi Pilihan</h2>
          <Link href="/apps" className="text-link">
            Lihat Semua <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        {apps.length > 0 ? (
          <div className="app-grid">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} categories={categories} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <LayoutGrid size={32} aria-hidden="true" />
            <h3>Aplikasi segera hadir</h3>
            <p>
              Aplikasi akan tampil di sini setelah dipublikasikan. Sementara
              itu, ceritakan kebutuhan aplikasi Anda kepada kami.
            </p>
            <Link href="/custom" className="button button-outline">
              Pesan Aplikasi Custom
            </Link>
          </div>
        )}
      </section>

      <section className="section container" aria-labelledby="custom-title">
        <div className="custom-cta">
          <span className="custom-cta-icon" aria-hidden="true">
            <MessagesSquare size={30} />
          </span>
          <div className="custom-cta-copy">
            <h2 id="custom-title">Butuh Aplikasi Sesuai Kebutuhan?</h2>
            <p>
              Ceritakan ide Anda. Tim Riverside Studio membantu merancang dan
              membangun website, web app, aplikasi mobile, atau desktop sesuai
              kebutuhan organisasi Anda.
            </p>
          </div>
          <Link href="/custom" className="button button-lg">
            Konsultasi Sekarang <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
