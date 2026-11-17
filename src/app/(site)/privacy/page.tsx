import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";

export const metadata = { title: "Kebijakan Privasi" };

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  return (
    <main id="main" className="page container legal">
      <header className="page-head">
        <h1>Kebijakan Privasi</h1>
        <p>Terakhir diperbarui: 17 November 2026</p>
      </header>
      <article className="card prose-block">
        <p>
          Kebijakan ini menjelaskan data yang dikumpulkan {settings.site_name}{" "}
          (dikelola oleh Riverside Studio) dan cara kami menggunakannya.
        </p>
        <h2>Data yang kami kumpulkan</h2>
        <p>
          Pengunjung dapat menjelajahi katalog tanpa membuat akun. Data pribadi
          hanya dikumpulkan ketika Anda mengirim formulir{" "}
          <Link href="/custom">Pesan Aplikasi Custom</Link>, yaitu nama, email,
          nomor WhatsApp, jenis aplikasi, nama proyek, dan deskripsi kebutuhan,
          beserta waktu persetujuan Anda.
        </p>
        <p>
          Untuk mencegah spam, server membuat sidik jari satu arah (hash) dari
          alamat jaringan pengirim. Alamat jaringan asli tidak disimpan, dan
          hash tersebut dihapus otomatis setelah 24 jam.
        </p>
        <h2>Tujuan penggunaan</h2>
        <p>
          Data formulir hanya digunakan untuk meninjau dan menindaklanjuti
          permintaan Anda, termasuk menghubungi Anda melalui email atau
          WhatsApp. Kami tidak menjual data Anda dan tidak mengirim pesan
          otomatis.
        </p>
        <h2>Penyimpanan dan akses</h2>
        <p>
          Data disimpan di database Supabase dengan pembatasan akses sehingga
          hanya admin Riverside Studio yang dapat membacanya. Data disimpan
          selama diperlukan untuk menindaklanjuti permintaan dan dapat dihapus
          admin kapan saja.
        </p>
        <h2>Cookie</h2>
        <p>
          Pengunjung tidak diberi cookie pelacakan. Cookie sesi hanya dipakai
          saat admin masuk ke dashboard.
        </p>
        <h2>Hak Anda</h2>
        <p>
          Anda dapat meminta salinan, koreksi, atau penghapusan data permintaan
          Anda
          {settings.support_email ? (
            <>
              {" "}
              melalui{" "}
              <a href={`mailto:${settings.support_email}`}>
                {settings.support_email}
              </a>
              .
            </>
          ) : (
            " melalui kontak resmi Riverside Studio yang tercantum di situs ini."
          )}
        </p>
        <h2>Layanan aplikasi lain</h2>
        <p>
          Aplikasi di katalog berjalan di layanan masing-masing. Pendaftaran,
          harga, dan pembayaran di aplikasi tersebut mengikuti kebijakan
          aplikasi yang bersangkutan.
        </p>
      </article>
    </main>
  );
}
