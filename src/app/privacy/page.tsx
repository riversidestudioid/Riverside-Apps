import Link from "next/link";
export const metadata = { title: "Kebijakan Privasi" };
export default function Page() {
  return (
    <main id="main" className="content-page container">
      <span className="ecosystem">Dalam persiapan</span>
      <h1>Kebijakan Privasi</h1>
      <p>
        Kebijakan privasi resmi sedang disiapkan sebelum fitur akun dan form
        permintaan dibuka. Pada tahap ini situs tidak menyediakan formulir
        pengumpulan data pelanggan atau pembayaran.
      </p>
      <Link href="/apps" className="button">
        Jelajahi Aplikasi
      </Link>
    </main>
  );
}
