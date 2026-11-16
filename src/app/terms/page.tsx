import Link from "next/link";
export const metadata = { title: "Syarat Layanan" };
export default function Page() {
  return (
    <main id="main" className="content-page container">
      <span className="ecosystem">Dalam persiapan</span>
      <h1>Syarat Layanan</h1>
      <p>
        Situs ini masih dalam tahap persiapan. Ketersediaan produk, harga,
        ketentuan lisensi, serta layanan resmi akan dipublikasikan setelah
        dikonfirmasi. Transaksi belum diaktifkan.
      </p>
      <Link href="/apps" className="button">
        Jelajahi Aplikasi
      </Link>
    </main>
  );
}
