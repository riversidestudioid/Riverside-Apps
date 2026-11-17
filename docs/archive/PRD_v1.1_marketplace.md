# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Riverside Apps — Marketplace Aplikasi Karya Riverside Studio

**Versi:** 1.1 (GitHub + Netlify)
**Tanggal:** 16 November 2026
**Status:** Spesifikasi produk untuk implementasi bertahap menggunakan Codex, GitHub, dan Netlify
**Basis visual:** Screenshot desain beranda Riverside Apps yang diberikan pemilik produk
**Bahasa produk:** Indonesia
**Mata uang:** IDR (Rp)

> **Aturan sumber kebenaran:** Screenshot adalah referensi tampilan, bukan bukti bahwa produk, harga, layanan, video demo, atau integrasi pembayaran sudah tersedia. Data yang belum disediakan harus ditandai sebagai *draft* dan tidak dipublikasikan secara otomatis.

---

## 1. Ringkasan Produk

**Riverside Apps** adalah situs katalog dan toko aplikasi/web app milik **Riverside Studio**. Pengunjung dapat menemukan produk, melihat detail dan video demo, mencoba aplikasi yang menyediakan demo, memilih model akses (gratis, sekali beli, langganan bulanan/tahunan), serta mengajukan pembuatan aplikasi custom. Pemilik dapat mengelola produk, harga, pelanggan, pesanan, langganan, dan permintaan custom dari dashboard admin.

Riverside Apps **bukan hosting atau runtime pengganti semua aplikasi**. Marketplace ini di-host di Netlify, sementara produk lain boleh tetap berjalan di domain/deployment Vercel, Netlify, atau layanan lainnya masing-masing. Riverside Apps berperan sebagai katalog, checkout, akun pelanggan, dan sumber status hak akses (*entitlement*). Aplikasi berbayar yang terpisah harus mengintegrasikan pemeriksaan entitlement agar akses benar-benar bisa diberikan/dicabut saat langganan berubah.

### Tujuan bisnis
1. Menyatukan portofolio Riverside Studio dalam satu situs profesional.
2. Mempermudah calon pengguna memahami produk lewat detail, screenshot, dan video demo.
3. Menawarkan penjualan lisensi sekali beli, langganan, serta penggunaan gratis sesuai pengaturan setiap produk.
4. Menerima prospek untuk jasa pengembangan custom.
5. Memudahkan pemilik mengelola katalog, transaksi, dan hak akses tanpa mengubah kode untuk setiap produk.

### Target pengguna
- **Pengunjung:** mencari aplikasi dan membandingkan manfaatnya.
- **Pelanggan:** mendaftar, membeli, mengakses aplikasi yang dimiliki, melihat status langganan.
- **Admin Riverside Studio:** mengelola data produk, media, paket harga, order, dan pesanan custom.

### Indikator keberhasilan awal
- Pengunjung dapat menemukan aplikasi melalui pencarian/kategori dalam ≤3 interaksi.
- Seluruh tombol utama berfungsi dan tidak mengarah ke halaman kosong.
- Admin dapat memublikasikan satu aplikasi baru tanpa perlu deploy ulang kode.
- Pembelian sukses menghasilkan order, catatan pembayaran, dan entitlement yang sesuai **hanya setelah** konfirmasi terverifikasi.
- Langganan kedaluwarsa mengubah hak akses produk terkait dengan benar.
- Permintaan custom tersimpan dan dapat ditindaklanjuti admin.

## 2. Lingkup Rilis dan Prioritas

### Fase A — MVP Katalog & Permintaan Custom (P0)
- Beranda responsif mengikuti screenshot.
- Katalog, kategori, pencarian, filter model harga, dan halaman detail produk.
- Media produk: ikon, thumbnail, galeri screenshot, dan video demo via URL/embed yang diizinkan.
- Tombol **Coba Demo**, **Gunakan Sekarang**, **Lihat Detail** hanya aktif jika tujuan valid.
- Form pesanan custom masuk database dan dashboard admin.
- Login/registrasi pelanggan dan dashboard dasar.
- Admin CRUD produk, kategori, media, dan paket harga; status draft/published/archived.
- SEO dasar, loading/error/empty state, kebijakan privasi, syarat layanan.

### Fase B — Pembayaran & Hak Akses (P0 untuk monetisasi)
- Checkout untuk sekali beli, bulanan, dan tahunan (IDR).
- Integrasi **satu** payment gateway yang mendukung Indonesia (pilih setelah akun merchant siap; contoh Midtrans atau Xendit), sandbox dahulu.
- Webhook terverifikasi dan idempoten untuk pembaruan pembayaran.
- Riwayat order, langganan, dan dashboard **Aplikasi Saya**.
- Endpoint entitlement terlindungi untuk integrasi aplikasi-aplikasi berbayar.
- Pembatasan akses berdasarkan status entitlement, bukan hanya kondisi tombol di frontend.
- Flow gagal bayar, pending, kedaluwarsa, pembatalan/perpanjangan sesuai kapabilitas gateway.

### Fase C — Pengembangan Lanjutan (P1/P2)
- Kupon diskon, review terverifikasi, wishlist, rating, affiliate, email otomatis, analitik mendalam.
- SSO lintas aplikasi, manajemen seat/tim, lisensi perangkat, pencabutan perangkat.
- Pembuatan invoice PDF, pajak, refund otomatis, rekomendasi produk personalisasi.

**Batasan:** Fase A tidak boleh berpura-pura menerima pembayaran. Sebelum gateway aktif, tombol beli dapat berstatus **Segera Hadir** atau flow pemesanan manual yang secara eksplisit menyebut **belum dibayar**.

## 3. Arah Desain (Mengikuti Screenshot)

### Identitas visual
- Nama utama **Riverside Apps**, subteks **by Riverside Studio**.
- Nuansa modern, bersih, minimal, ramah, premium, dengan ruang kosong luas.
- Warna dasar putih/off-white; navy gelap untuk teks; teal/toska untuk CTA dan aksen; mint transparan untuk elemen aktif; border abu kebiruan lembut.
- Estimasi token visual (boleh disesuaikan saat menyamakan gambar): `navy #0B1F44`, `teal #008A87`, `teal-dark #006C6A`, `mint #DDF8F2`, `surface #FFFFFF`, `border #DDE7EF`.
- Font usulan: **Plus Jakarta Sans** atau sans-serif sejenis.
- Card rounded ±16–20 px, bayangan tipis; tombol rounded ±12–14 px; animasi halus 150–250 ms.
- Motif hero: bentuk gelombang gradien teal transparan di sisi kanan, dibuat via CSS/SVG, **bukan** gambar laptop.
- Gunakan aset logo resmi jika tersedia. Jangan membuat logo yang dianggap resmi tanpa aset/konfirmasi.

### Struktur beranda desktop (urut persis secara konseptual)
1. **Header:** logo kiri; Beranda, Jelajahi Aplikasi, Kategori (dropdown), Harga, Pesan Custom; kanan ikon cari, notifikasi (hanya bila login dan tersedia), Masuk/Daftar atau avatar akun.
2. **Hero:** badge “Riverside Digital Ecosystem”; judul “Temukan Aplikasi Bermanfaat Karya Riverside Studio”; subjudul tentang gereja, pendidikan, bisnis, dan kebutuhan digital; CTA **Jelajahi Aplikasi** dan **Pesan Aplikasi Custom**; dekorasi gelombang abstrak di kanan.
3. **Pencarian besar** dengan placeholder “Cari aplikasi, tools, atau solusi...” dan shortcut `⌘K` di Mac / `Ctrl+K` di Windows.
4. **Kartu kategori:** Semua, Church Tools, Pendidikan, Bisnis, Produktivitas, Utilitas, Developer, Custom App. Ikon garis senada, kategori aktif mint.
5. **Aplikasi Unggulan:** judul, deskripsi singkat, tautan “Lihat Semua Aplikasi”, tiga kartu unggulan dalam satu baris desktop. Tiap kartu memiliki ikon, nama, badge jenis akses, tagline, deskripsi, tombol detail, dan tombol demo/gunakan.
6. **Kenapa Riverside Apps?:** empat manfaat: Berguna & Relevan; Mudah Digunakan; Aman & Terpercaya; Bisa Disesuaikan. Jangan mengklaim audit keamanan, SLA, atau update berkala yang belum tersedia.
7. **Banner Pesan Custom:** panel teal gelap, ikon kode, judul “Butuh Aplikasi Khusus?”, ringkasan, CTA “Konsultasi Sekarang”.
8. **Footer:** logo, navigasi penting, kontak resmi, kebijakan privasi, syarat layanan, copyright.

### Responsive
- **≥1280 px:** header penuh; kategori horizontal; featured 3 kolom; alasan 4 kolom.
- **768–1279 px:** grid featured 2 kolom; kategori bisa wrap/scroll; hero tetap terbaca.
- **<768 px:** menu hamburger/drawer, hero satu kolom, CTA bertumpuk, pencarian full width, kategori grid 2–4 kolom atau geser horizontal, produk 1 kolom, banner CTA bertumpuk; tidak ada overflow horizontal.
- Touch targets ≥44×44 px; teks kontras; keyboard focus terlihat; mendukung `prefers-reduced-motion`.

## 4. Halaman & Route

| Route | Akses | Keterangan |
|---|---|---|
| `/` | Publik | Beranda sesuai screenshot |
| `/apps` | Publik | Semua aplikasi + pencarian, kategori, model harga, urutan |
| `/apps/[slug]` | Publik | Detail aplikasi, demo, media, paket, FAQ, CTA |
| `/kategori/[slug]` | Publik | Daftar aplikasi berdasarkan kategori |
| `/harga` | Publik | Perbandingan model harga/paket yang tersedia, bukan harga fiktif |
| `/custom` | Publik | Form permintaan custom |
| `/login`, `/register`, `/forgot-password` | Publik | Autentikasi |
| `/checkout/[planId]` | Login | Ringkasan order dan proses pembayaran |
| `/dashboard` | Login | Ringkasan akun pelanggan |
| `/dashboard/apps` | Login | Aplikasi Saya dan tombol Buka Aplikasi |
| `/dashboard/orders` | Login | Riwayat transaksi |
| `/dashboard/subscriptions` | Login | Status, masa aktif, tindakan langganan |
| `/dashboard/profile` | Login | Profil dan preferensi |
| `/admin` | Admin | Overview admin |
| `/admin/apps` | Admin | CRUD aplikasi + media + pricing |
| `/admin/categories` | Admin | Kelola kategori |
| `/admin/orders` | Admin | Pembayaran/order dan penyelidikan status |
| `/admin/custom-requests` | Admin | Daftar permintaan custom |
| `/admin/customers` | Admin | Daftar pelanggan dan entitlement |
| `/admin/settings` | Admin | Identitas publik, kontak, gateway config nonsecret, tautan legal |
| `/privacy`, `/terms` | Publik | Kebijakan privasi dan syarat penggunaan |

## 5. Kebutuhan Fungsional

### FR-01 — Katalog dan Pencarian (P0)
- Cari secara case-insensitive pada nama, tagline, deskripsi singkat, dan tag.
- Pilih kategori, jenis akses (`gratis`, `sekali_beli`, `langganan`, `custom`), dan urutkan (unggulan/terbaru/nama).
- Query tercermin pada URL agar bisa dibagikan.
- Hanya `published` dan `is_visible=true` yang muncul publik.
- Tampilkan empty state dengan saran menghapus filter.
- Keyboard shortcut pencarian membuka/menyorot input, tidak mengganggu saat pengguna sedang mengetik.

**AC:** Mengetik “sertifikat” menampilkan produk terkait bila dipublikasikan; mengganti kategori memfilter hasil; reload halaman mempertahankan parameter filter.

### FR-02 — Halaman Detail (P0)
Wajib menampilkan: nama, ikon, tagline, penjelasan fungsi, target pengguna, fitur utama, galeri/preview, video demo **bila ada**, kategori, platform (web/desktop/mobile), model harga, status ketersediaan, FAQ opsional, CTA yang sesuai. Tampilkan status “Segera Hadir” untuk produk belum diluncurkan; jangan tampilkan link rusak.

**AC:** Tombol **Coba Demo** hanya muncul jika `demo_url` valid; video menggunakan URL video yang diizinkan, tidak autoplay dengan suara.

### FR-03 — Akun Pelanggan (P0)
- Registrasi email/password, verifikasi email bila diaktifkan, login, logout, lupa kata sandi.
- Role default `customer`; role `admin` hanya boleh diberikan oleh proses terproteksi.
- Dashboard menunjukkan aplikasi gratis yang diakses, aplikasi dibeli, langganan aktif/kedaluwarsa, serta pesanan.

**AC:** Customer tidak dapat membuka `/admin` atau mengakses data customer lain meskipun memodifikasi request.

### FR-04 — Paket dan Harga (P0)
- Satu aplikasi bisa punya nol atau beberapa paket: `free`, `one_time`, `monthly`, `yearly`.
- Harga disimpan dalam **integer rupiah**, bukan float; judul, deskripsi manfaat, periode, status aktif, fitur, dan kebijakan akses ditentukan admin.
- Harga yang belum disetel tidak ditampilkan sebagai `Rp0` kecuali benar-benar paket gratis.
- Kebijakan sekali beli harus eksplisit: apakah hak akses selamanya untuk versi tersebut, fitur tertentu, atau batas dukungan tertentu.
- Untuk langganan, tampilkan masa aktif, apakah otomatis diperpanjang, dan cara berhenti sesuai kemampuan gateway.

**AC:** Produk dapat menawarkan sekali beli dan langganan sekaligus; checkout memakai harga yang disimpan saat order dibuat (*price snapshot*).

### FR-05 — Checkout dan Pembayaran (Fase B, P0)
- Login wajib sebelum checkout berbayar.
- Buat order server-side berstatus `pending`; server memverifikasi harga, produk, dan paket aktif.
- Pembuatan pembayaran menggunakan payment gateway di backend. Browser tidak mengirim status sukses sebagai sumber kebenaran.
- Webhook diverifikasi tanda tangan/secret, disimpan dengan ID event unik, idempoten, dan memperbarui order serta entitlement secara transaksional.
- Status minimal: `pending`, `paid`, `failed`, `expired`, `refunded`, `cancelled`.
- Webhook berulang tidak memberi akses ganda; callback gagal tidak membuat order tercatat paid.
- Refund/reversal harus menyesuaikan entitlement menurut aturan kebijakan.

**AC:** Pembayaran sandbox sukses → order `paid` dan entitlement aktif; pembayaran gagal → tidak ada entitlement berbayar; replay webhook → tidak ada duplikasi.

### FR-06 — Langganan dan Pembatasan Akses (Fase B, P0)
- Entitlement per pengguna–aplikasi–paket memuat `status`, `starts_at`, `expires_at`, dan asal order.
- Model langganan mendukung bulanan dan tahunan; renewal mengikuti gateway yang dipilih. Jangan menjanjikan debit otomatis bila gateway/merchant tidak mendukungnya.
- Aplikasi terpisah memanggil **endpoint pemeriksaan entitlement server-to-server** atau memvalidasi token tertandatangani berumur singkat.
- Setiap akses fitur berbayar wajib diperiksa **di backend aplikasi tujuan**, bukan hanya menyembunyikan tombol di Riverside Apps.
- Ketika langganan habis: ubah menjadi `expired`, hentikan fitur berbayar di aplikasi tujuan, tetapi pertahankan data pengguna selama kebijakan retensi; tampilkan halaman perpanjangan.
- Grace period opsional harus eksplisit dan dapat dikonfigurasi.
- **Catatan:** APK/desktop/offline tidak bisa dijamin berhenti tepat waktu tanpa pemeriksaan lisensi online atau mekanisme token kedaluwarsa.

**AC:** Pelanggan A yang kedaluwarsa ditolak oleh API entitlement untuk produk langganan; pelanggan B yang aktif tetap diterima; pembelian sekali bayar tetap mengikuti kebijakan lifetime yang ditentukan.

### FR-07 — Pesanan Custom (P0)
- Form: nama, email, WhatsApp (opsional), jenis organisasi, judul kebutuhan, kategori, deskripsi proyek, perkiraan anggaran (opsional), tenggat yang diharapkan (opsional), persetujuan kebijakan privasi.
- Validasi server, antispam/rate limit, dan konfirmasi setelah berhasil disimpan.
- Admin dapat mengubah status: `new`, `contacted`, `discovery`, `quoted`, `accepted`, `rejected`, `completed` dan menambahkan catatan internal.
- Tombol WhatsApp konsultasi hanya muncul bila nomor bisnis resmi sudah diisi di pengaturan.

**AC:** Permintaan yang valid tersimpan dan dapat terlihat di admin; tidak memerlukan login pelanggan; tidak mengirim data ke nomor placeholder.

### FR-08 — Admin Dashboard (P0)
- CRUD produk, kategori, tag, gambar, video URL, FAQ, paket harga, prioritas featured, dan pengaturan tautan produk.
- Workflow `draft → published → archived`; setiap perubahan penting dilog siapa/kapan.
- Daftar order, status langganan, permintaan custom, dan jumlah produk.
- Akses admin dijaga di server dan database (RLS/RBAC), tidak cukup dengan menyembunyikan menu.
- Admin tidak dapat mengubah order menjadi paid lewat UI biasa tanpa jejak audit dan alasan operasi manual yang terdokumentasi.

**AC:** Mengubah nama produk di admin langsung tercermin di katalog tanpa deploy ulang; akun customer ditolak dari operasi admin.

### FR-09 — Notifikasi (P1)
- Ikon lonceng pada screenshot hanya ditampilkan sebagai fitur nyata saat telah ada inbox notifikasi; untuk Fase A, sembunyikan atau jadikan menu noninteraktif yang **tidak** tampak bisa diklik.
- Fase B bisa menambah notifikasi pembayaran, langganan hampir habis, dan balasan custom.

## 6. Produk Awal dan Konten

Ketiga item berikut adalah **contoh seed/draft berdasarkan screenshot**, bukan klaim tersedia atau telah terjual:

| Nama | Kategori awal | Model dalam mockup | Deskripsi awal | Aturan publikasi |
|---|---|---|---|---|
| Sagi Worship | Church Tools | Langganan | Software presentasi lirik, ayat, dan media untuk ibadah | Publikasikan setelah URL produk/demo dan ketentuan paket diisi |
| RSCertio | Pendidikan / Produktivitas | Sekali Beli | Generator sertifikat berbasis template dan daftar nama | Publikasikan setelah app siap, harga/lisensi dan demo valid |
| ResizeFoto | Utilitas | Gratis | Pengubah ukuran/kompresi foto | Contoh visual saja; jangan nyatakan tersedia sebelum produknya benar-benar ada |

Admin harus dapat membuat produk tambahan tanpa hardcode. Bila aset sebenarnya belum ada, pakai placeholder grafis netral dan tandai produk `draft`.

## 7. Model Data Minimal

Rekomendasi: PostgreSQL melalui Supabase; **Auth** dari Supabase Auth; file media pada Supabase Storage bila diperlukan. Nama tabel dapat disesuaikan implementasi tetapi relasinya harus konsisten.

- `profiles`: `id (auth.users FK)`, `full_name`, `role ('customer'|'admin')`, `created_at`.
- `categories`: `id`, `slug UNIQUE`, `name`, `icon`, `sort_order`, `is_active`.
- `apps`: `id`, `slug UNIQUE`, `name`, `tagline`, `description`, `short_description`, `icon_url`, `category_id`, `platform`, `status`, `is_visible`, `is_featured`, `featured_order`, `demo_url`, `launch_url`, `created_at`, `updated_at`.
- `app_media`: `id`, `app_id`, `type ('image'|'video')`, `url`, `alt_text`, `sort_order`.
- `app_tags`: `app_id`, `tag_id` (atau `tags` array bila sederhana).
- `plans`: `id`, `app_id`, `name`, `billing_type ('free'|'one_time'|'monthly'|'yearly')`, `price_idr INTEGER`, `currency='IDR'`, `features JSONB`, `license_policy`, `is_active`, `gateway_plan_ref` (opsional).
- `orders`: `id`, `user_id`, `plan_id`, `app_id`, `amount_idr`, `currency`, `status`, `gateway`, `gateway_order_id UNIQUE`, `paid_at`, `created_at`.
- `payment_events`: `id`, `gateway`, `event_id UNIQUE`, `order_id`, `event_type`, `payload JSONB`, `processed_at`, `created_at`.
- `subscriptions`: `id`, `user_id`, `plan_id`, `gateway_subscription_id`, `status`, `current_period_start`, `current_period_end`, `cancel_at_period_end`.
- `entitlements`: `id`, `user_id`, `app_id`, `plan_id`, `source_order_id`, `status`, `starts_at`, `expires_at`, `created_at`.
- `custom_requests`: `id`, `name`, `email`, `whatsapp`, `organization_type`, `project_title`, `category`, `description`, `budget_range`, `target_date`, `status`, `admin_notes`, `created_at`.
- `site_settings`: `key`, `value` untuk pengaturan nonsecret dan konten yang bisa diedit.
- `audit_logs`: `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`.

**Aturan data:** buat migration SQL berversi, indexes untuk `slug`, `user_id`, `status` dan pencarian, foreign key, constraints enum/check, serta RLS di semua tabel yang memuat data pelanggan. Secret API/payment **tidak pernah** disimpan di `site_settings` yang bisa dibaca client.

## 8. Aturan Akses dan Integrasi Aplikasi

### Hak akses dasar
- Publik: read aplikasi `published`, kategori aktif, paket aktif, halaman legal.
- Customer: read/edit profil sendiri; read order/subscription/entitlement sendiri; submit custom request; **tidak** boleh menentukan status pembayaran.
- Admin: CRUD katalog/kategori dan baca data operasional sesuai izin admin.
- Gateway/service: hanya backend tepercaya yang menulis status pembayaran dan entitlement.

### Pola integrasi dengan aplikasi terpisah (Vercel, Netlify, dan lainnya)
1. Pengguna membeli paket di Riverside Apps.
2. Setelah gateway terverifikasi, database mencatat entitlement aktif.
3. Pengguna membuka app dari halaman **Aplikasi Saya**.
4. Aplikasi tujuan melakukan autentikasi pengguna (SSO nantinya; untuk MVP dapat memakai login masing-masing plus pengaitan akun yang aman).
5. Backend aplikasi tujuan memverifikasi entitlement untuk kombinasi `user_id + app_id` menggunakan kunci service server-side atau token pendek ber-scope.
6. Jika expired, tampilkan pesan dan tombol perpanjang; hindari menghapus data secara otomatis.

**Keputusan arsitektur wajib sebelum Fase B:** tentukan bagaimana akun di aplikasi terpisah dipetakan ke user Riverside Apps (SSO terpusat atau account linking). Jangan menyamakan email tanpa proses verifikasi. Tidak pernah mengekspos `SUPABASE_SERVICE_ROLE_KEY` di browser.

## 9. Rekomendasi Teknologi

- **Frontend & backend web:** Next.js (App Router), TypeScript, Tailwind CSS.
- **Komponen:** shadcn/ui atau komponen aksesibel setara, Lucide Icons.
- **Database & auth:** Supabase PostgreSQL + Supabase Auth + RLS.
- **Penyimpanan media:** Supabase Storage atau URL CDN yang diizinkan.
- **Hosting marketplace:** Netlify (integrasi GitHub; dukungan Next.js App Router melalui adapter otomatis Netlify/OpenNext). Produk lain boleh tetap punya deployment sendiri di platform apa pun.
- **Pembayaran:** satu gateway Indonesia yang dipilih setelah onboarding merchant, **sandbox → staging → produksi**.
- **Validasi:** Zod (server dan client); **forms:** React Hook Form bila membantu.
- **Pengujian:** Vitest/unit, React Testing Library, Playwright E2E; lint, typecheck, build wajib.
- **Monitoring:** error logging server tanpa PII/secret; healthcheck serta audit log event penting.

Jangan mengunci versi paket sebelum memeriksa kompatibilitas saat pengembangan. Hindari integrasi yang mensyaratkan paket berbayar jika alternatif gratis mencukupi MVP.

## 10. Ketentuan Nonfungsional

**Performa:** target Lighthouse ≥90 untuk Performance, Accessibility, Best Practices, SEO pada halaman publik dalam kondisi pengukuran wajar; optimasi gambar, lazy-load media, skeleton, cache publik yang aman.

**Keamanan:** RLS dan server-side authorization, verifikasi webhook, idempotensi, CSRF/security headers sesuai framework, validasi URL dan input, rate limiting form/auth, captcha hanya bila diperlukan, sanitasi embed video, penyimpanan password oleh Auth provider saja, tidak pernah commit `.env`.

**Privasi:** minimalkan PII, tampilkan kebijakan privasi sebelum mengumpulkan data, jelaskan tujuan penggunaan WhatsApp/email, akses/hapus data sesuai kebijakan yang dipublikasikan, jangan tampilkan data pelanggan di halaman publik.

**SEO:** metadata per produk, Open Graph, sitemap, robots, canonical URL, slug human-friendly, data structured Product/SoftwareApplication hanya bila field lengkap/benar.

**Aksesibilitas:** semantic HTML, form berlabel, error mudah dimengerti, navigasi keyboard, aria sesuai kebutuhan, focus ring, kontras memadai, reduced motion.

**Operasional:** deployment preview dan production terpisah, migration yang bisa dilacak, backup database, logging secukupnya, environment variable validation, seed data aman.

## 11. Alur Pengguna Utama

### A. Menemukan dan mencoba aplikasi
Beranda → cari/kategori → klik kartu → halaman detail → tonton demo/galeri → klik **Coba Demo** bila ada URL aktif → demo dibuka aman di tab baru atau route internal yang benar.

### B. Membeli sekali bayar
Detail → pilih paket sekali beli → login/register → checkout → payment gateway → webhook valid `paid` → entitlement aktif sesuai `license_policy` → tampil di **Aplikasi Saya**.

### C. Berlangganan
Detail → pilih bulanan/tahunan → checkout → pembayaran terkonfirmasi → entitlement aktif hingga `current_period_end` → renewal/cancellation gateway → entitlement diperpanjang atau kedaluwarsa → aplikasi tujuan mengikuti status backend.

### D. Memesan custom app
Klik **Pesan Custom/Konsultasi Sekarang** → form kebutuhan → validasi dan persetujuan → kirim → halaman sukses → admin melihat lead berstatus `new` → admin menghubungi melalui kontak yang diberikan.

## 12. Kriteria Penerimaan & Pengujian

### Visual dan interaksi
- [ ] Beranda desktop mereplikasi komposisi screenshot: header, hero/gelombang, pencarian, kategori, 3 kartu, empat alasan, banner custom, footer.
- [ ] Tidak ada overflow pada 375 px, 768 px, 1024 px, dan 1440 px.
- [ ] Semua navigasi, badge kategori interaktif, CTA, pencarian, tombol demo, dan detail memiliki perilaku benar.
- [ ] Loading, error, 404, empty state dan fokus keyboard disediakan.
- [ ] Placeholder pada aset belum tersedia tidak dibuat seolah-olah aplikasi sudah diluncurkan.

### Data & admin
- [ ] Admin dapat create/edit/draft/publish/archive produk, mengelola gambar, kategori, URL demo, dan paket.
- [ ] Pengunjung tidak dapat melihat produk draft atau informasi internal.
- [ ] Nonadmin ditolak dari admin route serta API/database admin.
- [ ] Submit custom request valid tersimpan; spam/input invalid ditolak.

### Pembayaran & lisensi (Fase B)
- [ ] Checkout memvalidasi harga di server dan tidak menerima nominal dari client sebagai otoritas.
- [ ] Webhook palsu ditolak; webhook valid dapat direplay tanpa duplikasi.
- [ ] Status gagal/expired tidak memberikan akses berbayar.
- [ ] Entitlement aktif diterima dan expired ditolak oleh API dari aplikasi lain.
- [ ] Data pelanggan A tak bisa dilihat pelanggan B; tidak ada credential server dalam bundle frontend.
- [ ] Alur refund/cancel/pending dipastikan pada sandbox sebelum live.

## 13. Rencana Pengerjaan untuk Codex

**Sprint 1 — Fondasi proyek:** inisialisasi Next.js + TS + Tailwind, struktur folder, design tokens, header/footer, responsif, placeholder logo/aset, README, `.env.example`, kualitas kode.

**Sprint 2 — UI sesuai screenshot:** hero gradien CSS/SVG, search, kategori, kartu unggulan, manfaat, CTA custom, responsive QA dengan screenshot visual desktop/mobile. Fokus pixel-close tanpa mengorbankan aksesibilitas.

**Sprint 3 — Katalog terhubung database:** Supabase schema + migration + RLS, list/detail/search/filter, media, seed draft, route `apps/[slug]`, loading/error/empty states.

**Sprint 4 — Auth, dashboard pelanggan, dan admin:** login/register, role checking, CRUD katalog, settings, form custom, dashboard lead.

**Sprint 5 — Checkout & entitlement:** payment sandbox, order, webhook, subscription, entitlement API, integrasi minimal satu produk, E2E seluruh status. Baru aktifkan penjualan di production setelah kunci merchant dan legal/bisnis siap.

**Sprint 6 — Hardening & rilis:** performance, security review, accessibility, analytics minimum, error monitoring, backup, staging QA, deployment Netlify.

**Definition of Done setiap sprint:** fitur berfungsi, route tidak rusak, loading/error tertangani, typecheck/lint/test/build lulus, perubahan didokumentasi, tidak ada secret di git, dan tidak ada commit/push/deploy production tanpa instruksi pemilik.

## 14. Keputusan dan Data yang Masih Harus Diisi

1. Domain resmi dan file logo asli Riverside Apps.
2. Kebijakan branch GitHub dan izin deploy (repository ditetapkan: `riversidestudioid/Riverside-Apps`).
3. URL produk, demo, dokumentasi, video, ikon dan screenshot asli tiap aplikasi.
4. Harga asli, paket, manfaat, masa berlaku, dan cakupan lisensi sekali bayar.
5. Payment gateway yang telah disetujui serta merchant keys (via env, tidak dikirim di chat publik).
6. Metode akun lintas aplikasi: SSO atau account linking.
7. Nomor WhatsApp bisnis, email support, dan teks legal resmi.
8. Apakah ada renewal otomatis, grace period, refund, dan pajak/invoice sesuai aturan bisnis.

**Default aman sementara:** harga kosong, pembayaran nonaktif, app tanpa URL tetap `draft`, notifikasi belum ditampilkan, tidak ada statistik/testimoni/review palsu.

---

## 15. GitHub, Netlify, dan Deployment

### Repository & workflow
- **Repository yang dituju:** `https://github.com/riversidestudioid/Riverside-Apps.git`.
- **Akun pemilik repository:** `riversidestudioid`.
- **Pengembangan:** OpenAI Codex pada working copy/branch pengembangan; buat commit yang jelas per perubahan.
- **Branch rekomendasi:** `main` untuk kode siap rilis; `develop` atau `feature/*` untuk perubahan sebelum review (hanya jika disetujui pemilik).
- Jangan otomatis menjalankan push, merge PR, menghapus history, atau deploy production tanpa instruksi pemilik.
- Jika repository belum dapat diakses atau kosong, **jangan** mengasumsikan bahwa branch/berkas sudah tersedia; periksa remote dan izin lalu lakukan inisialisasi secara aman.

### Deploy Netlify dari GitHub
1. Setelah kode berhasil di-push atas izin pemilik, buka Netlify → **Add new project** → **Import an existing project** → pilih **GitHub**.
2. Pilih repository **`riversidestudioid/Riverside-Apps`** dan izinkan akses repo pada Netlify.
3. Biarkan Netlify mendeteksi Next.js secara otomatis. Konfigurasi umum: `npm run build` (yang memanggil `next build`) dan output `.next`; bila autodetect berbeda, ikuti panduan resmi versi framework yang terpasang.
4. Tambahkan variabel lingkungan Supabase **pada Site configuration → Environment variables** sesuai kebutuhan build/runtime; jangan commit isi `.env.local` atau kunci rahasia.
5. Uji preview deploy, fungsi auth, form custom, rute dinamis, server actions/route handlers, gambar, dan error; siapkan domain kustom nanti bila sudah tersedia.
6. Aktifkan production deploy dari `main` hanya setelah pengujian dan persetujuan pemilik. Perubahan yang di-push ke production branch dapat memicu deployment otomatis.

### Batasan teknis Netlify
- Untuk Next.js modern, gunakan integrasi **OpenNext** yang disediakan Netlify secara otomatis; **jangan** memaksakan `output: 'export'` untuk aplikasi yang membutuhkan SSR, auth server, checkout, webhook, atau Route Handlers.
- Jangan membangun server Node persistent sendiri atau menyimpan upload/database di filesystem function yang ephemeral. Gunakan Supabase Storage dan database terkelola.
- Endpoint payment webhook kelak harus memakai URL domain Netlify yang stabil dan memvalidasi signature; uji sandbox sebelum production.
- Periksa limit paket gratis Netlify dan Supabase (build, bandwidth, compute, database, storage) sebelum rilis dan sebelum memperluas video/media.
- Cek CORS, callback OAuth/login redirect, domain/email allowlist, dan redirect URL Supabase ketika alamat Netlify berubah.

### Checklist release
- [ ] Git remote benar: `riversidestudioid/Riverside-Apps.git`.
- [ ] Tidak ada `.env*` berisi secret, service role key, token, dan credentials dalam Git.
- [ ] Lint, typecheck, test, `npm run build` lulus.
- [ ] Netlify preview deploy berhasil; semua route yang dibutuhkan bukan 404.
- [ ] Environment Netlify disetel dan tidak terpapar browser.
- [ ] Supabase auth redirect URL dan RLS sudah diuji.
- [ ] Tombol berbayar tetap nonaktif sampai webhook/gateway lolos sandbox.
- [ ] Persetujuan pemilik diperoleh sebelum push/merge/deploy production.

---

## 16. Instruksi Awal untuk Codex (Copy–Paste)

> Bangun web app **Riverside Apps** menggunakan file `PRD_Riverside_Apps_Codex.md` sebagai sumber persyaratan. Screenshot desain yang saya lampirkan adalah acuan visual beranda. Gunakan Next.js App Router, TypeScript, Tailwind, komponen aksesibel, Supabase Auth + PostgreSQL + RLS, dan siapkan deployment di Netlify dari repository GitHub `riversidestudioid/Riverside-Apps`. **Kerjakan Fase A dulu**, mulai dari fondasi UI yang sangat mendekati screenshot, responsif untuk desktop/tablet/mobile, lalu katalog dinamis, halaman detail, pencarian, custom request, auth, dan admin. Buat kode modular, migrations, seed sebagai DRAFT, `.env.example`, README, unit/E2E tests dasar. Jangan menaruh data palsu sebagai produk tersedia, jangan mengaktifkan checkout palsu, jangan menaruh API secret di client. Untuk Fase B, buat rencana teknis dan kontrak entitlement terlebih dahulu; jangan integrasikan pembayaran produksi sebelum merchant gateway tersedia. Setelah tiap sprint, jalankan lint, typecheck, test, build, dan laporkan hasil beserta daftar file berubah. **Jangan push, merge, menghapus file penting, atau deploy produksi tanpa izin saya. Pastikan build di Netlify siap tanpa mengubah backend aplikasi lain yang sudah berjalan.**
