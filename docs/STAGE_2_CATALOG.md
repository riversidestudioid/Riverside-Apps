# Tahap 2 — Integrasi katalog dengan Supabase

Branch aktif `feature/catalog-admin`, fondasi `9ca5c65`. Perubahan tetap lokal dan mempertahankan scaffold admin dari tahap sebelumnya. Tidak ada push, merge, deployment, koneksi project remote, atau migration remote dalam tahap ini.

## Verifikasi database sebelum integrasi

`docs/STAGE_1_DATABASE.md` dan seluruh migration dibaca. Supabase CLI tersedia, tetapi executable Docker tidak ada pada PATH maupun lokasi Docker Desktop yang diperiksa. Karena itu stack Supabase lokal tidak dijalankan. Tidak ada instalasi Docker atau akses database production sebagai pengganti.

Migration dijalankan berurutan pada **PostgreSQL PGlite dalam memori**. Role `anon`/`authenticated`, schema Auth/Storage minimal, serta kebijakan SQL benar-benar dieksekusi oleh PostgreSQL. Tidak ada masalah migration yang terdeteksi. Pengujian membuktikan:

- Anonymous dan customer hanya membaca produk published + visible dari kategori aktif.
- Draft, archived, metadata paket/media, dan objek Storage privat mengikuti visibilitas produk.
- Customer tidak dapat mengubah kategori, aplikasi, media, paket atau membership admin, meskipun dapat membaca row published.
- Profil hanya bisa diedit pemilik pada kolom yang diizinkan; perubahan role/ID/timestamp ditolak.
- Admin dapat mengelola katalog; publikasi tidak lengkap dan revisi editor stale ditolak.

**Batas penting:** ini bukan pengujian stack Supabase asli. Auth token verification, PostgREST asli, signed URL Storage asli, bucket migration/privileges bawaan platform dan Supabase advisors belum diuji tanpa Docker. Jangan menganggapnya lulus hanya berdasarkan adapter test.

## Migration baru

Tambahan `20261116090337_public_catalog_search.sql` menyediakan RPC `public.catalog_apps`:

- `SECURITY INVOKER` dan pemeriksaan eksplisit status published/visible/kategori aktif. Cookie admin tidak diteruskan ke client publik.
- Pencarian case-insensitive pada nama, tagline, ringkasan **dan deskripsi lengkap**. Query substring literal, bukan interpolasi SQL atau wildcard dari input.
- Filter kategori dan jenis paket aktif, urutan unggulan/terbaru/nama, pagination (24 default, maksimum 48 per request), total hasil dan urutan deterministik.
- Harga/paket, ikon dan thumbnail berasal dari tabel yang sama, sehingga tidak terpotong oleh default row limit pada query tabel terpisah.
- Page dibatasi 1–1000 dan query maksimum 200 karakter; halaman di luar hasil diarahkan ke halaman terakhir yang valid.

Urutan lokal: `20261116081145_catalog_admin.sql` → `20261116085506_profiles_catalog_constraints.sql` → `20261116090337_public_catalog_search.sql`. Migration ketiga belum diterapkan ke Supabase remote. File `seed.sql` lama tetap berisi draft; **tidak** memublikasikan produk contoh.

## Perilaku halaman

- `/`: mempertahankan hero, warna, komponen kategori, manfaat, banner dan footer. Secara default menampilkan maksimal tiga produk database dengan featured=true. Search/filter dapat mencari produk published lainnya, tanpa fallback produk hardcoded.
- `/apps`: membaca RPC, pencarian/filter/sort di server/database, pagination, URL yang dapat dibagikan dan dipulihkan setelah reload. Input juga bisa dikirim sebagai GET form tanpa JavaScript.
- `/apps/[slug]`: query published/visible di server, kategori aktif, deskripsi, fitur dari paket, screenshot, video upload/YouTube, paket harga aktual dan tautan HTTPS yang tersedia. Draft/arsip/missing menampilkan not-found tanpa memuat konten privat.
- `/kategori/[slug]`: memvalidasi kategori database aktif lalu mengarahkan ke katalog dengan slug kategori, query, model harga, urutan dan page tetap tersimpan. Kategori tidak valid menjadi not-found.
- Dropdown kategori header memakai data database. Bila database gagal, shell header tetap tersedia dan halaman menampilkan error aman.
- Ketiadaan konfigurasi atau produk published menampilkan empty state profesional. Tidak ada lagi fixture `draftApps` pada source publik, bahkan development. Produk contoh hanya terdapat dalam test atau seed database draft.
- Error tidak disamarkan sebagai katalog kosong. Public fetch dibatasi timeout 8 detik dan tanpa retry otomatis berulang; tombol Coba Lagi melakukan refresh server setelah database pulih.
- Harga IDR berasal dari paket database, NULL bukan Rp0, dan tombol demo hanya untuk URL HTTPS yang valid. Tautan aplikasi tidak mengaktifkan pembayaran atau entitlement. Checkout tetap nonaktif.

Next.js dapat mengirim not-found/error melalui streaming HTTP 200 setelah header terkirim. Test memeriksa UI not-found dan tidak adanya konten privat, bukan menganggap semua respons halaman pasti berstatus HTTP 404. API media tetap mengembalikan 404 saat akses tidak valid.

## File yang diubah/ditambahkan pada Tahap 2

| File/kelompok                                                                                                | Perubahan                                                                          |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `supabase/migrations/20261116090337_public_catalog_search.sql`                                               | RPC publik untuk query/pagination                                                  |
| `src/lib/catalog/repository.ts`                                                                              | Repository SDK yang dapat diuji, validasi bentuk data dan error aman               |
| `src/lib/catalog/queries.ts`, `data.ts`, `validation.ts`                                                     | Wrapper server-only/cache request, hapus fixture publik, normalisasi parameter/URL |
| `src/lib/supabase/database.ts`, `public.ts`                                                                  | Kontrak RPC dan batas waktu fetch publik                                           |
| `src/components/catalog.tsx`                                                                                 | Navigasi filter server, GET search, pagination dan kartu berdasarkan hasil DB      |
| `src/app/page.tsx`, `apps/page.tsx`, `apps/[slug]/page.tsx`, `kategori/[slug]/page.tsx`                      | Integrasi query, featured, detail fitur dan kategori valid                         |
| `src/app/layout.tsx`, `src/components/site-shell.tsx`                                                        | Kategori header dari database                                                      |
| `src/app/error.tsx`, `globals.css`                                                                           | Retry yang mengambil ulang server dan state UI tambahan                            |
| `tests/helpers/*`, `tests/integration/catalog.test.ts`, `tests/catalog.spec.ts`                              | Database/HTTP adapter lokal dan pengujian terintegrasi                             |
| `tests/unit/*`, `tests/home.spec.ts`, `tests/admin.spec.ts`                                                  | RLS writes menyeluruh dan penghapusan asumsi fixture publik                        |
| `playwright.config.ts`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`, `package.json` | Server test terisolasi, folder build/tsconfig test diabaikan, script integration   |
| `.env.example`, `README.md`, `docs/VALIDATION.md`                                                            | Instruksi dan status terbaru                                                       |

## Cara menjalankan dan test

Tanpa Docker, pengujian lokal ini dapat direproduksi tanpa credential atau jaringan remote:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run test:integration
npx playwright install chromium
npm run test:e2e
npm run build
```

Playwright menyalakan dan menghentikan server sendiri pada port 3003/3004, dengan direktori build/tsconfig terpisah. Pastikan port itu kosong. Suite pertama tidak memiliki konfigurasi Supabase dan menguji empty state. Suite kedua memakai **SDK Supabase aktual → adapter HTTP test → PostgreSQL PGlite**, dengan data hanya di `tests/helpers/catalog-fixtures.ts`. Adapter test hanya mendukung operasi repository yang diuji, bukan emulator Supabase lengkap dan bukan route aplikasi. Endpoint pengendali error/empty/reset hanya berada di proses test loopback, tidak tersedia pada website production.

Hasil: lint/typecheck/build Node 22 lulus; 10 unit/RLS test, 2 integration test, dan 14 Playwright test lulus. Audit dependency 0 vulnerabilities. Gangguan database yang sengaja disimulasikan menghasilkan log error aman yang diharapkan pada server test.

Dengan Docker tersedia nanti, ikuti runbook Tahap 1 untuk `supabase start`, migration lokal dan `.env.local` berisi URL/publishable key lokal. Verifikasi ketiga migration pada stack asli dan generate ulang tipe database. Jangan menggunakan service role key pada frontend. Tidak ada kebutuhan credential production untuk Tahap 2.

## Persiapan Tahap 3 — Login dan Dashboard Admin

Scaffold SSR login/admin sudah ada dari pekerjaan sebelumnya, tetapi perlu verifikasi terhadap layanan Supabase asli. Prioritas berikut:

1. Jalankan stack lokal atau lingkungan nonproduction yang mendapat persetujuan, lalu ulangi RLS melalui Data API asli.
2. Buat akun Auth admin/customer lokal; membership admin diberikan pengelola tepercaya, bukan registrasi publik atau user_metadata.
3. Uji login email/password, cookie refresh, logout, sesi kedaluwarsa, akses langsung route/action admin dan pencabutan membership.
4. Lengkapi alur profil dan upload ikon pada dashboard; uji create/edit/publish/archive/delete serta upload Storage asli dengan role berbeda.
5. Periksa konfigurasi Auth/rate limits, MIME/ukuran bucket, signed URL TTL, advisors dan deploy preview Netlify hanya setelah persetujuan.

Tidak ada sistem pembayaran, perubahan database remote, push/merge atau deploy production yang diaktifkan pada tahap ini.
