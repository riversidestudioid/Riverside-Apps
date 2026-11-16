import Link from "next/link";
export const metadata = { title: "Masuk ke Riverside Apps" };
export default function Page() {
  return (
    <main id="main" className="content-page container">
      <span className="ecosystem">Dalam persiapan</span>
      <h1>Masuk ke Riverside Apps</h1>
      <p>
        Login pelanggan sedang dipersiapkan. Anda dapat menjelajahi katalog
        tanpa akun. Form autentikasi akan diaktifkan setelah konfigurasi
        Supabase selesai.
      </p>
      <Link href="/apps" className="button">
        Jelajahi Aplikasi
      </Link>
    </main>
  );
}
