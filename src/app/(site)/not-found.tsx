import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main" className="page container status-page">
      <SearchX size={40} aria-hidden="true" />
      <h1>Halaman tidak ditemukan</h1>
      <p>Halaman atau aplikasi ini tidak tersedia.</p>
      <div className="hero-actions">
        <Link href="/" className="button">
          Kembali ke Beranda
        </Link>
        <Link href="/apps" className="button button-outline">
          Lihat Aplikasi
        </Link>
      </div>
    </main>
  );
}
