# Riverside Apps

Katalog aplikasi & web app milik Riverside Studio, sekaligus tempat mengajukan permintaan aplikasi custom, dengan satu dashboard admin. Next.js App Router, TypeScript, Tailwind CSS, Supabase (Auth, PostgreSQL, Storage), target hosting Netlify.

- Spesifikasi: [docs/PRD.md](docs/PRD.md) (v2.0 — bukan marketplace pembayaran)
- Ringkasan perubahan redesign: [docs/REDESIGN_V2.md](docs/REDESIGN_V2.md)
- Hasil pengujian: [docs/VALIDATION.md](docs/VALIDATION.md)

Harga, pembayaran, dan akun pelanggan dikelola di masing-masing aplikasi, bukan di Riverside Apps.

## Menjalankan lokal

Gunakan Node.js 22 (`nvm use`), lalu:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Buka http://localhost:3000. Tanpa konfigurasi Supabase, katalog kosong, form custom dan login admin nonaktif. Tidak ada produk atau kontak hardcoded.

Untuk mengaktifkan integrasi, terapkan migration di `supabase/migrations/` (berurutan) pada **project development/staging yang disetujui**, isi `NEXT_PUBLIC_SUPABASE_URL` dan publishable key di `.env.local`, lalu restart. Jangan pernah menaruh service role key di aplikasi. Admin dibuat lewat Supabase Auth lalu ditambahkan ke tabel `admin_members` oleh pemilik database (lihat [STAGE_3_ADMIN](docs/STAGE_3_ADMIN.md)).

## Fitur

**Publik:** beranda (hero, Aplikasi Pilihan, section custom), `/apps` (search, filter kategori, pagination), `/apps/[slug]` (deskripsi, fitur, screenshot, video, Buka Aplikasi, Coba Demo), `/custom` (form permintaan dengan validasi server, anti-spam, rate limit database), `/privacy`, `/terms`.

**Admin (`/admin`):** dashboard statistik dari database, kelola aplikasi (draft/publish/arsip, ikon, screenshot, video, kategori, URL aplikasi & demo, Aplikasi Pilihan), kelola permintaan custom (status, catatan internal, hapus), pengaturan situs (nama, deskripsi, logo, email, WhatsApp, sosial media).

## Validasi

```sh
npm run lint
npm run typecheck
npm test                 # unit + RLS di PostgreSQL PGlite (in-memory)
npm run test:integration # Supabase SDK → adapter HTTP test → PGlite
npm run build
npx playwright install chromium
npm run test:e2e         # menyalakan dua server Next terisolasi sendiri
npm audit
```

PGlite dan adapter Auth/Storage test **bukan Supabase asli**. Verifikasi layanan asli masih wajib sebelum staging/production — lihat [STAGE_4_REAL_SUPABASE](docs/STAGE_4_REAL_SUPABASE.md). Screenshot QA tersimpan di `artifacts/` (diabaikan Git).

## Netlify

`netlify.toml`: build `npm run build`, publish `.next`, Node 22, adapter OpenNext otomatis. Environment yang dibutuhkan hanya `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Website: https://jade-fox-9bf4a7.netlify.app/.

## Aturan kerja

Tidak ada merge, migration remote, atau deploy production tanpa persetujuan pemilik. Data dan migration lama tidak dihapus secara destruktif.
