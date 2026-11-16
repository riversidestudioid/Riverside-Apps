import Link from "next/link";
export const metadata = { title: "Model Akses & Harga" };
export default function Page() {
  return (
    <main id="main" className="content-page container">
      <span className="ecosystem">Dalam persiapan</span>
      <h1>Model Akses & Harga</h1>
      <p>
        Aplikasi dapat menawarkan akses gratis, sekali beli, atau langganan.
        Harga dan ketentuan akan ditampilkan setelah paket resmi dipublikasikan.
        Pembayaran belum tersedia.
      </p>
      <Link href="/apps" className="button">
        Jelajahi Aplikasi
      </Link>
    </main>
  );
}
