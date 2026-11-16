import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="content-page container">
      <h1>Halaman tidak ditemukan</h1>
      <p>Halaman atau aplikasi ini belum tersedia.</p>
      <Link href="/" className="button">
        Kembali ke Beranda
      </Link>
    </main>
  );
}
