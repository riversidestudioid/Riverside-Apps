import Link from "next/link";

export const metadata = { title: "Syarat Penggunaan" };

export default function TermsPage() {
  return (
    <main id="main" className="page container legal">
      <header className="page-head">
        <h1>Syarat Penggunaan</h1>
        <p>Terakhir diperbarui: 17 November 2026</p>
      </header>
      <article className="card prose-block">
        <h2>Tentang situs ini</h2>
        <p>
          Riverside Apps adalah katalog aplikasi dan web app milik Riverside
          Studio, sekaligus tempat mengajukan permintaan pembuatan aplikasi
          custom. Situs ini tidak memproses pembelian, langganan, atau
          pembayaran.
        </p>
        <h2>Aplikasi di katalog</h2>
        <p>
          Tombol &ldquo;Buka Aplikasi&rdquo; dan &ldquo;Coba Demo&rdquo;
          mengarahkan Anda ke aplikasi terkait. Harga, akun, dan ketentuan
          penggunaan setiap aplikasi diatur di aplikasi masing-masing.
        </p>
        <h2>Permintaan aplikasi custom</h2>
        <p>
          Mengirim permintaan melalui formulir{" "}
          <Link href="/custom">Pesan Aplikasi Custom</Link> tidak menimbulkan
          kewajiban bagi kedua pihak. Ruang lingkup, biaya, dan jadwal
          pengerjaan disepakati terpisah setelah diskusi.
        </p>
        <h2>Penggunaan yang wajar</h2>
        <p>
          Jangan mengirim data palsu, spam, atau konten yang melanggar hukum.
          Kami dapat menolak atau menghapus permintaan yang tidak sesuai.
        </p>
        <h2>Privasi</h2>
        <p>
          Pengelolaan data pribadi dijelaskan dalam{" "}
          <Link href="/privacy">Kebijakan Privasi</Link>.
        </p>
      </article>
    </main>
  );
}
