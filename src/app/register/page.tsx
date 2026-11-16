import Link from "next/link";
export const metadata = { title: "Daftar Riverside Apps" };
export default function Page() {
  return (
    <main id="main" className="content-page container">
      <span className="ecosystem">Dalam persiapan</span>
      <h1>Daftar Riverside Apps</h1>
      <p>
        Pendaftaran akun belum dibuka. Silakan jelajahi katalog terlebih dahulu.
      </p>
      <Link href="/apps" className="button">
        Jelajahi Aplikasi
      </Link>
    </main>
  );
}
