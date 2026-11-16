import Link from "next/link";
export const metadata = { title: "Mari Wujudkan Aplikasi Anda" };
export default function Page() {
  return (
    <main id="main" className="content-page container">
      <span className="ecosystem">Dalam persiapan</span>
      <h1>Mari Wujudkan Aplikasi Anda</h1>
      <p>
        Riverside Studio mempersiapkan layanan pengembangan aplikasi untuk
        gereja, sekolah, organisasi, dan bisnis. Form permintaan dan kontak
        konsultasi resmi belum diaktifkan. Saat ini belum ada permintaan yang
        dikirim atau disimpan.
      </p>
      <Link href="/apps" className="button">
        Jelajahi Aplikasi
      </Link>
    </main>
  );
}
