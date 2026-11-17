import { catalogParams } from "@/lib/catalog/validation";
import Link from "next/link";
import { ArrowRight, Sparkles, Grid2X2, CodeXml, Pencil } from "lucide-react";
import { HeroLaptop } from "@/components/hero-laptop";
import { Catalog } from "@/components/catalog";
import { Icon } from "@/components/icon";
import { getCatalog } from "@/lib/catalog/queries";
const benefits = [
  {
    icon: "zap",
    title: "Mudah Digunakan",
    text: "Antarmuka simpel dan ramah pengguna.",
  },
  {
    icon: "shield",
    title: "Terpercaya",
    text: "Dikembangkan oleh Riverside Studio.",
  },
  {
    icon: "headphones",
    title: "Dukungan Responsif",
    text: "Siap membantu kebutuhan aplikasimu.",
  },
];
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = catalogParams(await searchParams);
  const catalog = await getCatalog(
    { ...params, page: "1" },
    {
      featured: !params.q && params.category === "semua" && !params.billing,
      pageSize: 3,
    },
  );
  return (
    <main id="main" className="home-redesign">
      <section className="hero">
        <div className="container hero-content">
          <span className="ecosystem">
            <Sparkles size={15} /> Solusi Digital
          </span>
          <h1>
            Aplikasi Digital
            <br />
            <span>untuk Kebutuhanmu.</span>
          </h1>
          <p>
            Temukan, coba, dan gunakan berbagai aplikasi karya Riverside Studio
            untuk gereja, pendidikan, dan lainnya.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/apps">
              <Grid2X2 size={20} />
              Jelajahi Aplikasi <ArrowRight size={18} />
            </Link>
            <Link className="button secondary" href="/custom">
              <Pencil size={22} />
              Pesan Aplikasi Custom
            </Link>
          </div>
          <HeroLaptop />
        </div>
      </section>
      <Catalog
        apps={catalog.apps}
        categoryOptions={catalog.categories}
        total={catalog.total}
        pageSize={3}
        initialQuery={params.q}
        initialCategory={params.category}
        initialBilling={params.billing}
        initialSort={params.sort}
      />
      <section className="benefits container">
        <div className="benefit-grid">
          {benefits.map((b) => (
            <div className="benefit" key={b.title}>
              <span className="benefit-icon">
                <Icon name={b.icon} size={30} />
              </span>
              <div>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="custom-banner container">
        <span className="code-tile">
          <CodeXml size={42} />
        </span>
        <div>
          <h2>Butuh Aplikasi Khusus?</h2>
          <p>
            Kami siap membantu membuat aplikasi sesuai kebutuhan gereja,
            sekolah, bisnis, atau organisasimu.
          </p>
        </div>
        <Link className="button secondary" href="/custom">
          Konsultasi Sekarang <ArrowRight size={19} />
        </Link>
      </section>
    </main>
  );
}
