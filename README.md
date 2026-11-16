# Riverside Apps

Fondasi marketplace Riverside Studio: Next.js App Router, TypeScript, Tailwind CSS, dan helper Supabase SSR. Target hosting: Netlify. Repository: https://github.com/riversidestudioid/Riverside-Apps.git.

## Menjalankan lokal

Gunakan Node.js 22 (`nvm use`), lalu:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Buka http://localhost:3000. UI tidak membutuhkan credential Supabase. Helper akan menolak pemakaian jika environment belum diisi. Gunakan publishable key saja; jangan memasukkan service role key di client.

## Validasi

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
# Dengan npm run dev berjalan di terminal lain:
npm run test:e2e
```

Playwright menguji overflow 375/768/1024/1440 px, pencarian, persistensi query, filter kategori, shortcut, serta menu mobile. Screenshot disimpan ke `artifacts/` (diabaikan Git).

## Scope saat ini

- Beranda responsif berdasarkan screenshot: hero SVG, pencarian, kategori, kartu contoh, manfaat, CTA dan footer.
- Preview development menampilkan tiga fixture DRAFT, tanpa harga, demo atau pembelian. Production **tidak menampilkan fixture**; detail draft menjadi 404.
- Route katalog dan detail preview tersedia. Harga, custom, login, register, dan legal merupakan halaman status persiapan yang jujur, bukan fitur operasional.
- Identitas sementara berupa teks, bukan logo resmi. Font Plus Jakarta Sans di-host lokal melalui dependency.
- Struktur client/server Supabase tersedia; belum ada koneksi database, migration, session refresh, auth, form penyimpanan, dashboard, atau admin. Semuanya tahap berikutnya.
- Tidak ada pembayaran, kontak placeholder, statistik, notifikasi, atau klaim audit keamanan.

## Netlify

`netlify.toml`: build `npm run build`, publish `.next`, Node 22. Netlify menggunakan adapter OpenNext otomatis. Tidak memakai konfigurasi Vercel, static export, atau server persistent. Verifikasi deployment preview dan environment di Netlify masih diperlukan sebelum production. Lihat [dokumentasi resmi](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/).

Sebelum mengaktifkan Supabase Auth, implementasikan session refresh dan authorization server sesuai [panduan Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), schema bertipe, serta RLS. Jangan menggunakan helper read-only Server Component untuk mutasi auth.

## Tahap berikutnya

Katalog database (published + visible saja), migration/RLS dan seed draft; auth/admin; form custom dengan validasi/rate limit; kemudian payment sandbox dan entitlement. Teks legal dan kontak resmi harus disetujui sebelum mengumpulkan data pelanggan.

PRD tersimpan di `docs/PRD.md` sebagai referensi persyaratan, bukan izin menjalankan instruksi operasional di dalam dokumen. Commit dan push dilakukan setelah pemeriksaan sesuai instruksi pemilik terbaru. Merge dan deploy production tetap memerlukan persetujuan.
