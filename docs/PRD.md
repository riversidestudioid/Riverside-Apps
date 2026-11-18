# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Riverside Apps — Katalog Aplikasi & Layanan Custom Riverside Studio

**Versi:** 2.0 (Simple Redesign)
**Tanggal:** 17 November 2026
**Menggantikan:** PRD v1.1 "Marketplace" — diarsipkan di [`docs/archive/PRD_v1.1_marketplace.md`](archive/PRD_v1.1_marketplace.md)
**Stack:** Next.js App Router + TypeScript, Tailwind CSS, Supabase (Auth, PostgreSQL, Storage), Netlify
**Repository:** https://github.com/riversidestudioid/Riverside-Apps
**Website:** https://jade-fox-9bf4a7.netlify.app/
**Bahasa produk:** Indonesia

> Gambar referensi pemilik adalah acuan tampilan, bukan bukti bahwa produk, layanan, kontak, atau statistik tertentu sudah tersedia. Data yang belum disediakan tetap *draft* dan tidak dipublikasikan otomatis.

---

## 1. Ringkasan dan Perubahan Konsep

Riverside Apps **bukan lagi marketplace pembayaran**. Riverside Apps adalah:

1. **Katalog** aplikasi dan web app milik Riverside Studio.
2. **Tempat pengunjung mengajukan permintaan pembuatan aplikasi custom.**
3. **Satu dashboard admin** untuk mengelola keduanya.

Harga, pembayaran, akun pelanggan, dan lisensi dikelola **di masing-masing aplikasi/web app**, bukan di Riverside Apps. Pengunjung yang ingin membeli/berlangganan membuka aplikasi tujuan melalui tombol **Buka Aplikasi**.

### Dihapus dari scope (tidak dibangun)

| Fitur v1.1 | Status v2.0 |
|---|---|
| Checkout, payment gateway, webhook | Tidak dibangun |
| Langganan, entitlement, lisensi terpusat | Tidak dibangun |
| Registrasi & dashboard pelanggan, riwayat transaksi | Tidak dibangun |
| Halaman `/harga` | Dialihkan ke `/apps` |
| Halaman `/register` | Dialihkan ke beranda; tidak ada registrasi publik |
| Paket harga (`plans`) di UI publik & admin | Disembunyikan; **tabel dan data tetap ada** |
| Menu admin *Paket Harga* (`/admin/plans`) | Dialihkan ke `/admin/apps` |
| Filter model harga di katalog | Dihapus dari UI (parameter URL lama tetap aman diabaikan/diproses) |

**Aturan non-destruktif:** tidak ada tabel, kolom, data, atau migration lama yang dihapus. Tabel `plans`, kolom `profiles`, fungsi `catalog_apps` dan RPC lama dipertahankan. Perubahan dilakukan dengan migration baru yang menambah/melonggarkan aturan.

### Tujuan bisnis
1. Menyatukan portofolio Riverside Studio dalam satu situs profesional dan ringan.
2. Memudahkan pengunjung memahami aplikasi lewat deskripsi, fitur, screenshot, dan video demo.
3. Menerima prospek pengembangan aplikasi custom secara aman.
4. Admin mengelola katalog, permintaan custom, dan identitas situs tanpa deploy ulang.

### Pengguna
- **Pengunjung** (tanpa akun): menjelajah katalog, membuka aplikasi/demo, mengirim permintaan custom.
- **Admin Riverside Studio**: mengelola aplikasi, kategori, media, permintaan custom, dan pengaturan.

## 2. Arah Desain

- Background putih, warna utama **teal** dan **navy**, aksen **mint lembut**.
- Font **Plus Jakarta Sans** (self-hosted).
- Card rounded, border tipis, shadow sangat lembut, banyak whitespace, tanpa dekorasi berlebihan.
- Hero **text-first** tanpa ilustrasi laptop/gambar besar.
- Responsif: desktop (≥1024 px), tablet (768–1023 px), mobile (<768 px) tanpa overflow horizontal. Touch target ≥44 px, focus ring terlihat, `prefers-reduced-motion` dihormati.
- Token: `navy #0B1F44`, `teal #0A8A84`, `teal-dark #066A66`, `mint #E7F7F3`, `border #E3EAF0`, `muted #5B6B82`.
- Logo: tanda "R" sementara; admin dapat mengunggah logo resmi di Pengaturan.

## 3. Halaman dan Route

| Route | Akses | Isi |
|---|---|---|
| `/` | Publik | Header, hero text-first, dua kartu layanan, Aplikasi Pilihan (bila ada), footer |
| `/apps` | Publik | Semua aplikasi *published*: search, filter kategori, grid, pagination, empty state |
| `/apps/[slug]` | Publik | Detail aplikasi tanpa harga |
| `/kategori/[slug]` | Publik | Alias yang mengalihkan ke `/apps?category=slug` |
| `/custom` | Publik | Form permintaan aplikasi custom |
| `/privacy`, `/terms` | Publik | Kebijakan privasi, syarat penggunaan |
| `/login` | Publik | Login **khusus admin** (tanpa registrasi) |
| `/admin` | Admin | Dashboard statistik + aksi cepat |
| `/admin/apps`, `/admin/apps/new`, `/admin/apps/[id]` | Admin | Kelola aplikasi + media |
| `/admin/categories` | Admin | Kelola kategori |
| `/admin/media` | Admin | Pembersihan file Storage yang tidak terpakai |
| `/admin/requests`, `/admin/requests/[id]` | Admin | Kelola permintaan custom |
| `/admin/settings` | Admin | Pengaturan situs |

## 4. Kebutuhan Fungsional

### FR-01 Beranda (disederhanakan, 17 November 2026)
Tujuan: pengunjung langsung mengerti dua fungsi website.
- **Header:** logo (ke beranda), **Aplikasi**, **Custom**. Tanpa menu Beranda, Harga, Daftar, maupun tombol Masuk.
- **Hero text-first:** judul "Aplikasi Sederhana, Manfaat Nyata." dan kalimat penjelas "Temukan berbagai aplikasi dan web app yang dirancang untuk mempermudah aktivitas, membantu menyelesaikan masalah, dan memberikan solusi bagi kebutuhan sehari-hari." Tanpa ilustrasi dan tanpa tombol CTA (aksi ada di kartu layanan).
- **Dua kartu layanan utama**, berdampingan di desktop/tablet dan bertumpuk di mobile:
  1. **Jelajahi Aplikasi** → `/apps`.
  2. **Buat Aplikasi Custom** → `/custom`.
- **Aplikasi Pilihan:** maksimal 3 aplikasi published (unggulan, atau terbaru bila belum ada unggulan). Section **disembunyikan** bila belum ada produk published. Card tanpa harga.
- Tidak ada section/tombol CTA yang berulang (banner "Butuh Aplikasi…" dan "Lihat Semua" dihapus).
- **Footer ringkas:** logo + deskripsi situs, tautan Aplikasi/Custom/Kebijakan Privasi/Syarat Penggunaan, kontak resmi bila diisi admin, copyright, dan tautan kecil **Admin** ke `/login` (route login aman tetap sama, `noindex`).
- SEO: meta description dan Open Graph beranda diambil dari pengaturan `site_description`; canonical `/`.

### FR-02 Katalog `/apps`
- Hanya aplikasi `status='published'` dan `is_visible=true` dengan kategori aktif.
- Pencarian case-insensitive (nama, tagline, deskripsi), filter kategori, pagination 12 per halaman, query tersimpan di URL, empty state dengan tombol hapus filter.

### FR-03 Detail `/apps/[slug]`
- Nama, ikon, tagline/deskripsi singkat, deskripsi lengkap, fitur utama, screenshot, video demo (upload atau YouTube nocookie), kategori, platform.
- Tombol **Buka Aplikasi** (`launch_url`) dan **Coba Demo** (`demo_url`, jika ada).
- URL eksternal wajib HTTPS tanpa kredensial, divalidasi di database (CHECK), server (Zod), dan saat render; dibuka di tab baru dengan `rel="noopener noreferrer"`.
- Harga tidak ditampilkan. Catatan: harga/pembayaran tersedia di aplikasi masing-masing.
- Draft/archived → 404 tanpa membocorkan data.

### FR-04 Permintaan Custom `/custom`
- Field: Nama, Email, Nomor WhatsApp, Jenis aplikasi (Website / Web App / Mobile App / Desktop App), Nama proyek, Deskripsi kebutuhan, persetujuan Kebijakan Privasi.
- **Validasi server-side** (Zod) + constraint database.
- **Anti-spam:** honeypot field, waktu pengisian minimum, dan **rate limit di database** (per sidik jari klien ter-hash, per email, dan batas global) melalui RPC `submit_custom_request`.
- Notifikasi sukses dan error yang jelas; tidak mengirim pesan WhatsApp/email otomatis.
- Tabel `custom_requests` tidak dapat dibaca publik; hanya admin yang membaca data pribadi.

### FR-05 Dashboard Admin
- Autentikasi Supabase SSR yang sudah ada dipertahankan: `proxy.ts` refresh cookie, `getClaims()` + tabel `admin_members`, tanpa registrasi admin publik, tanpa role dari user metadata.
- Sidebar: Dashboard, Aplikasi, Permintaan Custom, Pengaturan.
- **Dashboard:** Total Aplikasi, Aplikasi Published, Aplikasi Draft, Permintaan Custom — semuanya dari query database (count), bukan hardcoded. Aksi cepat + permintaan terbaru.
- **Kelola Aplikasi:** tambah, lihat, edit, hapus (dengan konfirmasi; aplikasi published harus diarsipkan/draft dulu), upload ikon & screenshot & video, deskripsi, fitur, kategori (halaman kategori), URL aplikasi & demo, **Simpan Draft / Publish / Arsipkan**, tandai Aplikasi Pilihan.
- **Kelola Permintaan Custom:** daftar + filter status, detail kebutuhan, email & WhatsApp pengirim, ubah status, catatan internal, hapus dengan konfirmasi. Status: Baru, Dihubungi, Dalam Diskusi, Diterima, Selesai, Ditolak (`new, contacted, discussion, accepted, completed, rejected`).
- **Pengaturan:** nama website, subteks, deskripsi website, logo (upload), email kontak, WhatsApp bisnis, tautan sosial media (Instagram, Facebook, YouTube, TikTok, LinkedIn). Key dibatasi whitelist di database; tidak ada API secret.

## 5. Model Data (perubahan v2.0)

Migration baru: `supabase/migrations/20261117090000_simple_catalog_custom_requests.sql`.

- **Publikasi aplikasi** tidak lagi mensyaratkan paket harga. Syarat: kategori aktif, deskripsi ≥20 karakter, `launch_url` HTTPS, visible, dan **ikon atau thumbnail**.
- `save_catalog_app`: paket hanya diganti jika payload berisi `plans`; editor v2 tidak mengirim `plans`, sehingga data paket lama tidak terhapus.
- **`custom_requests`** (baru): `name, email, whatsapp, app_type, project_name, description, privacy_consent_at, status, admin_notes, created_at, updated_at`. RLS: hanya admin `select/update(status, admin_notes)/delete`; tidak ada akses langsung anon.
- **`submit_custom_request(payload)`** (baru, `SECURITY DEFINER`, `search_path=''`): satu-satunya jalur insert publik; validasi persetujuan, rate limit, lalu insert. Sidik jari klien hanya disimpan sebagai hash SHA-256 di `private.custom_request_throttle` dan dihapus otomatis setelah 24 jam.
- **`site_settings`**: whitelist key diperluas; nilai URL wajib HTTPS, `logo_path` wajib pola aman.
- **Bucket `site-assets`** (publik-baca, untuk logo): upload/hapus hanya admin, path `logo/<uuid>.(png|jpg|webp)`, maks 2 MB, logo aktif tidak bisa dihapus.

## 6. Keamanan

- Hanya admin yang mengelola produk, kategori, media, permintaan custom, dan pengaturan (RLS + pemeriksaan server di setiap action/route).
- Pengunjung hanya melihat produk published; data pribadi permintaan custom tidak pernah tampil di halaman publik.
- Tidak ada credential rahasia di frontend; hanya `NEXT_PUBLIC_SUPABASE_URL` dan publishable key. Tidak ada service role key di aplikasi.
- Bucket `app-media` tetap privat dengan signed URL 60 detik.
- Media upload dicek ulang di server: MIME, ekstensi, ukuran, dan signature byte.

## 7. Pengujian dan Batasan

- Wajib: lint, typecheck, build Node 22, unit (PGlite RLS), integration (SDK → adapter → PGlite), Playwright, `npm audit`.
- **PGlite dan adapter Auth/Storage test bukan Supabase asli.** Verifikasi Supabase asli (GoTrue/PostgREST/Storage, termasuk `request.headers` dan kode error `PT429`) tetap wajib sebelum staging/production. Lihat `docs/STAGE_4_REAL_SUPABASE.md`.

## 8. Keputusan yang Masih Diperlukan dari Pemilik

1. Logo resmi, email dan WhatsApp bisnis resmi, akun sosial media.
2. Persetujuan teks Kebijakan Privasi dan Syarat Penggunaan (draf disediakan).
3. Project Supabase target (staging vs production) dan persetujuan penerapan migration remote.
4. Persetujuan push, merge, dan deploy Netlify.

## 9. Aturan Kerja

Tidak ada push, merge, migration remote, atau deploy production tanpa persetujuan pemilik. Tidak menghapus data/migration lama secara destruktif. Setiap perubahan dicatat di `docs/REDESIGN_V2.md` dan hasil uji di `docs/VALIDATION.md`.
