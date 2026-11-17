# Riverside Apps

Marketplace Riverside Studio menggunakan Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL/Storage, dengan target hosting Netlify.

## Menjalankan lokal

Gunakan Node.js 22 (`nvm use`), lalu:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Buka http://localhost:3000. Tanpa konfigurasi Supabase, katalog kosong dan login dinonaktifkan pada development maupun production. Tidak ada fallback produk hardcoded. Tidak ada harga, demo, atau pembayaran fiktif.

Untuk mengaktifkan integrasi, siapkan schema di **project development/staging yang disetujui**, isi URL Supabase dan publishable key di `.env.local`, lalu restart server. Jangan kirim credential di chat dan jangan menambahkan service role key ke client. Ikuti [runbook Fase 2](docs/PHASE_2.md); migration belum diterapkan ke project mana pun.

Tahap 2 katalog sudah memakai query database untuk pencarian/filter/urutan/pagination. Lihat [laporan Tahap 2](docs/STAGE_2_CATALOG.md).

## Fitur lokal Fase 2

- Homepage mempertahankan desain, dengan sumber data katalog dari Supabase saat dikonfigurasi.
- Katalog, pencarian, kategori, model harga, urutan, URL filter, detail, galeri screenshot, video upload/YouTube, halaman harga.
- Login admin dan cookie refresh SSR; otorisasi server dan RLS melalui tabel `admin_members` yang dikelola pengelola database.
- `/admin`, `/admin/apps`, `/admin/apps/new`, `/admin/apps/[id]`, `/admin/categories` untuk tambah/lihat/edit/hapus/publish aplikasi dan mengelola kategori.
- Paket gratis/sekali beli/bulanan/tahunan dengan integer IDR dan ketentuan lisensi, **tanpa checkout atau pembayaran**.
- Media privat, upload langsung browser ke Storage; thumbnail/screenshot JPG/PNG/WebP 5 MB, video MP4/WebM 50 MB; URL YouTube tervalidasi.
- Draft/archived tidak dibaca publik, termasuk metadata media dan objek Storage. Signed URL yang sudah dikeluarkan memiliki TTL 60 detik.
- Transaksi editor dengan pemeriksaan revisi dan audit log, validasi publikasi di database, empty/error/loading state.

Identitas masih teks sementara, bukan logo resmi. Font Plus Jakarta Sans di-host lokal. Custom request, registrasi pelanggan, serta legal resmi masih tahap persiapan dan tidak mengumpulkan data melalui formulir.

Tahap 1 sekarang juga mencakup `profiles`, constraint ikon dan konfigurasi Supabase lokal. Lihat [schema dan panduan Tahap 1](docs/STAGE_1_DATABASE.md).

## Validasi

```sh
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm test` menjalankan validasi input dan migration/RLS/RPC dengan PostgreSQL PGlite dalam memori. Schema auth/storage yang dimock digunakan hanya dalam test. Playwright menguji 375/768/1024/1440 px, pencarian/filter, navigasi dan penolakan akses admin tanpa konfigurasi. Playwright menyalakan dua server terisolasi sendiri; integrasi katalog memakai SDK aktual dan PostgreSQL lokal melalui adapter test. Test dengan layanan Auth/Storage Supabase asli masih memerlukan Docker atau staging yang disetujui; lihat [hasil validasi](docs/VALIDATION.md). Gambar QA di `artifacts/` diabaikan Git.

## Netlify

`netlify.toml`: build `npm run build`, publish `.next`, Node 22. Adapter OpenNext disediakan Netlify otomatis, tanpa static export atau konfigurasi Vercel. Upload tidak melewati body server action Netlify. Tautan production yang diberikan pemilik: https://jade-fox-9bf4a7.netlify.app/.

Set environment build/runtime dengan Supabase URL/publishable key, gunakan environment preview terpisah, serta review Auth URL/rate limit dan Storage pada project. [Dokumentasi Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

## Status dan workflow

Dasar kode: commit `9ca5c65`, branch `feature/foundation-homepage`, repository https://github.com/riversidestudioid/Riverside-Apps.git. Branch kerja terbaru: `feature/catalog-admin` (dibuat dari remote foundation sesuai instruksi pemilik). Perubahan Fase 2 tetap lokal, belum di-commit/push. Instruksi terbaru pemilik: **tidak push, merge, migrasi database production atau deploy production tanpa persetujuan**. PRD tersimpan di `docs/PRD.md` sebagai referensi persyaratan.

Perbaikan audit development memakai scoped override minimatch, tanpa `npm audit fix --force`. Lihat [audit dependency](docs/DEPENDENCY_AUDIT.md) untuk risiko, kompatibilitas, dan rencana melepas override.

### Tahap 3: admin lokal

Autentikasi Supabase SSR (`getClaims` + `admin_members`), dashboard, editor produk, media, paket harga, dan pengaturan sudah tersedia. Baca [panduan konfigurasi dan validasi Supabase asli](docs/STAGE_3_ADMIN.md) sebelum mengaktifkan admin. Runtime container belum tersedia pada mesin pengembangan ini; pengujian otomatis menggunakan PGlite dan adapter Auth/Storage test, bukan stack Supabase asli. Hasil terbaru ada di [VALIDATION](docs/VALIDATION.md).
