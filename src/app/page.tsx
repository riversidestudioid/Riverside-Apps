import Link from "next/link";
import { ArrowRight, Rocket, Grid2X2, CodeXml } from "lucide-react";
import { Catalog } from "@/components/catalog";
import { Icon } from "@/components/icon";
import { draftApps } from "@/lib/catalog/data";
const benefits = [
  {
    icon: "zap",
    title: "Berguna & Relevan",
    text: "Dirancang untuk kebutuhan nyata.",
  },
  {
    icon: "layers",
    title: "Mudah Digunakan",
    text: "Antarmuka simpel dan nyaman.",
  },
  {
    icon: "shield",
    title: "Aman & Terpercaya",
    text: "Akses melalui tautan produk resmi.",
  },
  {
    icon: "sliders",
    title: "Bisa Disesuaikan",
    text: "Layanan custom sesuai kebutuhanmu.",
  },
];
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const preview = process.env.NODE_ENV === "development";
  return (
    <main id="main">
      <section className="hero">
        <svg
          className="hero-waves"
          viewBox="0 0 1000 400"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="wave" x1="0" y1="1" x2="1" y2="0">
              <stop stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#15b8ae" stopOpacity=".65" />
            </linearGradient>
            <linearGradient id="soft" x1="0" y1="1" x2=".8" y2="0">
              <stop stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#70d9d4" stopOpacity=".25" />
            </linearGradient>
          </defs>
          <path
            d="M0 400C160 250 160 30 350 80S570 280 740 150S880 0 1000 25V400Z"
            fill="url(#soft)"
          />
          <path
            d="M0 400C140 210 280 75 450 150S650 265 760 130S920 0 1000 15V400Z"
            fill="url(#wave)"
          />
          <path d="M190 400C400 180 590 400 1000 140V400Z" fill="url(#soft)" />
        </svg>
        <div className="container hero-content">
          <span className="ecosystem">
            <Rocket size={15} /> Riverside Digital Ecosystem
          </span>
          <h1>
            Temukan Aplikasi Bermanfaat
            <br className="desktop-break" /> Karya <span>Riverside Studio</span>
          </h1>
          <p>
            Aplikasi, tools, dan web app untuk gereja, pendidikan, bisnis,
            <br className="desktop-break" /> dan kebutuhan digital lainnya.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/apps">
              <Grid2X2 size={20} />
              Jelajahi Aplikasi <ArrowRight size={18} />
            </Link>
            <Link className="button secondary" href="/custom">
              <CodeXml size={22} />
              Pesan Aplikasi Custom
            </Link>
          </div>
        </div>
      </section>
      <Catalog
        apps={preview ? draftApps : []}
        preview={preview}
        initialQuery={params.q}
        initialCategory={params.category}
      />
      <section className="benefits container">
        <h2>Kenapa Riverside Apps?</h2>
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
            Mari wujudkan aplikasi atau web app untuk kebutuhan gereja,
            <br className="desktop-break" /> sekolah, organisasi, maupun bisnis
            Anda.
          </p>
        </div>
        <Link className="button secondary" href="/custom">
          Konsultasi Sekarang <ArrowRight size={19} />
        </Link>
      </section>
    </main>
  );
}
