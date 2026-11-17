import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CodeXml, LayoutGrid } from "lucide-react";
import { AppCard } from "@/components/app-card";
import { getFeaturedApps } from "@/lib/catalog/queries";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = settings.site_description || undefined;
  return {
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: settings.site_name,
      title: `${settings.site_name} — Solusi Aplikasi & Web App`,
      description,
    },
  };
}

const services = [
  {
    href: "/apps",
    icon: LayoutGrid,
    title: "Jelajahi Aplikasi",
    text: "Temukan aplikasi dan web app siap pakai dari Riverside Studio.",
    action: "Lihat aplikasi",
    tone: "light",
  },
  {
    href: "/custom",
    icon: CodeXml,
    title: "Buat Aplikasi Custom",
    text: "Ceritakan kebutuhan Anda, kami bantu rancang dan bangun aplikasinya.",
    action: "Pesan aplikasi",
    tone: "dark",
  },
] as const;

export default async function Home() {
  const { apps, categories } = await getFeaturedApps(3);
  return (
    <main id="main">
      <section className="hero">
        <div className="container hero-inner">
          <h1>
            Solusi Aplikasi &amp; Web App
            <span>untuk Kebutuhanmu.</span>
          </h1>
          <p className="hero-lead">
            Pilih aplikasi siap pakai atau pesan aplikasi custom untuk gereja,
            sekolah, bisnis, dan organisasi.
          </p>
        </div>
      </section>

      <section className="container services" aria-label="Layanan utama">
        {services.map(({ href, icon: Icon, title, text, action, tone }) => (
          <article className={`service-card service-${tone}`} key={href}>
            <span className="service-icon" aria-hidden="true">
              <Icon size={26} />
            </span>
            <h2>{title}</h2>
            <p>{text}</p>
            {/* The link's ::after overlay makes the whole card clickable. */}
            <Link href={href} className="service-link">
              {action} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </section>

      {apps.length > 0 && (
        <section className="section container" aria-labelledby="featured-title">
          <h2 id="featured-title" className="section-heading">
            Aplikasi Pilihan
          </h2>
          <div className="app-grid">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} categories={categories} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
