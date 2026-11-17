# Validasi v2.0 Simple Redesign — 17 November 2026

Branch lokal `feature/ui-ux-redesign` (basis `feature/catalog-admin` 66a6917), di-push ke `origin/feature/ui-ux` atas persetujuan pemilik. Tidak ada merge, migration remote, atau deploy production. Detail perubahan: [REDESIGN_V2.md](REDESIGN_V2.md).

| Pemeriksaan | Hasil |
| --- | --- |
| Lint (ESLint) | Lulus |
| Typecheck (`next typegen && tsc`) | Lulus |
| Build Next.js 16.4.6 dengan Node 22.23.5 | Lulus |
| Unit + RLS PostgreSQL (PGlite, 5 migration) | 18/18 lulus (14 lama + 4 baru) |
| Integration SDK/SSR → adapter HTTP test → PGlite | 4/4 lulus |
| Playwright (Chromium) | 21/21 lulus |
| npm audit | 0 vulnerabilities |
| Supabase asli (GoTrue/PostgREST/Storage) | **Belum diuji** — runtime container/staging belum tersedia |

Unit baru (`tests/unit/custom-requests.test.ts`): publish tanpa paket tetapi wajib ikon; simpan tanpa `plans` tidak menghapus paket lama; `custom_requests` tidak dapat dibaca/ditulis langsung oleh anon/customer; RPC submit memvalidasi persetujuan, fingerprint, email, WhatsApp, jenis aplikasi, panjang deskripsi; rate limit per email, per fingerprint, dan global (kode `PT429`); pembersihan throttle 24 jam; admin hanya bisa mengubah `status`/`admin_notes`, update/delete tercatat di audit log; whitelist settings, URL sosial wajib HTTPS, `logo_path` aman; bucket `site-assets` admin-only dan logo aktif tidak bisa dihapus; validasi Zod form custom & URL eksternal.

Playwright baru/diperbarui: beranda 375/768/1024/1440 tanpa overflow; header tanpa Harga/Daftar; `/harga` dan `/register` dialihkan; 404 dengan header; katalog kosong tanpa konfigurasi; form custom nonaktif tanpa database; katalog database (featured, grid, detail tanpa harga, `rel="noopener noreferrer"`, search, filter kategori pill, sort via URL, draft/arsip 404, error + retry, empty state); `custom_requests` ditolak via REST publik (403); admin login, statistik dari database (4/2/1/0), sidebar mobile, logout; keamanan role/origin/revokasi/expiry; CRUD editor (Simpan Draft → publish ditolak tanpa ikon → upload & ganti ikon → Publish → edit → Arsipkan → hapus); alur permintaan custom (validasi error, kirim, admin lihat kontak, ubah status & catatan, filter status, hapus); pengaturan (deskripsi, sosial media, email, penolakan URL http, upload & hapus logo, tampil di header/footer).

Bug yang ditemukan dan diperbaiki selama pengujian: overflow horizontal daftar admin di 375 px (track grid `auto`), nama aksesibel field yang tercampur teks bantuan/error (dipindah ke luar `<label>`), pesan sukses draft baru hilang setelah redirect (`?saved=1`), dan perataan field editor.

**Batasan:** PGlite + adapter Auth/Storage test bukan Supabase asli. Header IP Netlify, perilaku HTTP 429 PostgREST, bucket publik, dan seluruh migration v2 belum diverifikasi pada layanan asli — lihat checklist di `STAGE_4_REAL_SUPABASE.md`. Node lokal adalah v26; build diverifikasi dengan binary Node 22.23.5 dari cache npx.

---

# Validasi Tahap 3 — 16 November 2026

Branch `feature/catalog-admin`, dasar `9ca5c65`. Tidak ada commit baru, push, merge, migration remote, atau deployment production.

| Pemeriksaan | Hasil |
| --- | --- |
| Lint | Lulus |
| Typecheck | Lulus |
| Build Next.js 16.4.6 dengan Node 22 | Lulus |
| Unit dan PostgreSQL RLS | 14/14 lulus |
| Integrasi SDK/SSR → adapter HTTP test → PostgreSQL | 4/4 lulus |
| Playwright: katalog, autentikasi, dashboard, CRUD/media/pengaturan | 18/18 lulus |
| npm audit | 0 vulnerabilities |
| Docker-compatible runtime | Tidak tersedia |
| Supabase asli: PostgREST, Auth, Storage | Belum dijalankan |

Keempat migration dieksekusi berurutan pada PostgreSQL PGlite. Pengujian memeriksa RLS, admin membership, larangan privilege escalation, profil, transaksi publikasi, harga, private media, media replacement, settings column grants, pencarian/filter/urutan/pagination, serta akses langsung slug draft/arsip. Auth adapter menggunakan JWT ES256 bertanda tangan, refresh rotation dan cookie SSR; password fixture dibuat acak pada runtime, tanpa akun remote. Customer dengan metadata admin tetap ditolak. Browser menguji login salah/benar, logout, refresh/expiry, revokasi membership, API langsung, responsivitas, CRUD dan perubahan katalog tanpa deploy.

PGlite dan adapter test **bukan stack Supabase asli**. Tidak ada klaim bahwa GoTrue/PostgREST/Storage production telah tervalidasi. Runtime container dan matriks pengujian sungguhan harus diselesaikan sebelum aktivasi admin di lingkungan nyata. Instruksi dan batasan ada di `STAGE_3_ADMIN.md`.

Log error database/refresh yang sengaja ditolak merupakan bagian dari pengujian negatif. Peringatan development Next Image/aspek rasio dan warna terminal tidak menggagalkan test. Halaman streaming Next dapat memberi HTTP 200 untuk not-found; konten draft/arsip tetap tidak dikirim sebagai produk.

## Pemeriksaan ulang Tahap 4

Lint, typecheck, build Node 22, 14 unit dan 4 integration adapter test kembali lulus; npm audit tetap 0. Putaran Playwright pertama mengalami timeout (11 lulus, 3 gagal, 4 tidak berjalan); rerun terpisah dilakukan untuk investigasi. Jangan menafsirkan hasil Tahap 3 sebagai hasil layanan asli Tahap 4. `supabase start` gagal karena Docker/Podman tidak tersedia. Preflight `npm run test:real` menolak melanjutkan tanpa stack lokal; tidak ada test layanan asli yang lulus. Detail di `STAGE_4_REAL_SUPABASE.md`.

Rerun Playwright terpisah juga belum lulus: 10 lulus, 3 timeout, 5 tidak berjalan. Timeout terjadi pada akses media tanpa konfigurasi, pencarian/filter katalog, dan API admin dalam test keamanan. Penyebab belum dipastikan; tidak ada perubahan timeout/retry untuk menutupi kegagalan. Ini merupakan masalah regresi yang masih perlu diselidiki sebelum staging.

## Pembaruan UI — 17 November 2026

Beranda mengikuti referensi baru: hero dua kolom dengan ilustrasi laptop SVG lokal, navigasi ringkas, kategori pill, kartu produk horizontal berisi harga database, tiga manfaat, dan banner mint. Tampilan diperiksa pada 375/768/1024/1440 px serta menggunakan produk database uji. Lint, typecheck, build Node 22, 14 unit, 4 integration dan 11 Playwright beranda/katalog lulus. Setelah penyesuaian jarak toolbar, satu test katalog tambahan dijalankan ulang dan lulus. Hasil ini tidak menyatakan verifikasi Supabase asli Tahap 4 selesai; hambatan runtime tetap berlaku. Instruksi terbaru pengguna mengizinkan commit/push update ke branch fitur, tanpa merge atau deployment production.
