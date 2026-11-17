# Riverside Apps v2.0 — Simple Redesign

Tanggal: 17 November 2026
Branch kerja lokal: `feature/ui-ux-redesign` → di-push ke `origin/feature/ui-ux` atas persetujuan pemilik.
Basis: `origin/feature/catalog-admin` (66a6917). Checkpoint aman: branch lokal `checkpoint/pre-simple-redesign` (66a6917).
Spesifikasi: [`docs/PRD.md`](PRD.md) v2.0.

## Audit awal

| Temuan | Tindakan |
|---|---|
| Branch lokal `feature/ui-ux` masih di commit foundation `9ca5c65`; semua fitur auth/admin/PGlite ada di remote `feature/catalog-admin` | Kerja dibangun di atas `feature/catalog-admin` agar fitur yang sudah jadi dipertahankan |
| Trigger `validate_publication` mewajibkan paket harga aktif | Migration tambahan melonggarkan aturan (ikon wajib, harga tidak) |
| `save_catalog_app` menghapus lalu menulis ulang `plans` setiap simpan | Paket hanya diganti bila payload berisi `plans`; editor v2 tidak mengirimnya → data lama aman |
| Tidak ada tabel permintaan custom; `/custom` hanya halaman persiapan | Tabel `custom_requests` + RPC ber-rate-limit + form |
| `site_settings` hanya 4 key | Whitelist diperluas (deskripsi, logo, sosial media) dengan constraint HTTPS/path |
| Baseline sebelum perubahan | lint, typecheck, 14 unit, 4 integration lulus |

## Perubahan database (non-destruktif)

Migration baru: `supabase/migrations/20261117090000_simple_catalog_custom_requests.sql`. Tidak ada `drop table`, `drop column`, atau penghapusan data. Empat migration lama tidak diubah.

- `private.validate_publication`: publish butuh kategori aktif, deskripsi ≥20, `launch_url`, visible, **ikon atau thumbnail**. Tidak lagi butuh paket.
- `public.save_catalog_app`: blok `plans` hanya dijalankan jika `payload ? 'plans'`.
- `public.custom_requests` + RLS admin-only (select, delete, update kolom `status`/`admin_notes` saja). Audit log untuk update/delete admin.
- `private.custom_request_throttle`: hanya hash SHA-256, dibersihkan setelah 24 jam.
- `public.submit_custom_request(jsonb)`: `SECURITY DEFINER`, `search_path=''`, validasi persetujuan & fingerprint, rate limit 5/jam per fingerprint, 3/jam per email, 30/10 menit global; error `PT429` (PostgREST → HTTP 429).
- `site_settings`: key baru `site_description, logo_path, instagram_url, facebook_url, youtube_url, tiktok_url, linkedin_url`; nilai ≤500; URL sosial wajib `https://`; `logo_path` wajib `logo/<uuid>.(png|jpg|webp)`. `save_site_settings` menerima key baru secara opsional (kompatibel dengan payload lama).
- Bucket `site-assets` (public read, 2 MB, PNG/JPG/WebP): insert/delete admin, path terbatas, logo aktif tidak bisa dihapus, tanpa policy UPDATE.

**Belum diterapkan ke Supabase mana pun.** Penerapan remote memerlukan persetujuan pemilik.

## Perubahan aplikasi

### Publik (`src/app/(site)/…`)
- Route group `(site)` memberi header/footer; admin memakai shell sendiri. URL tidak berubah.
- Header: Beranda, Aplikasi, Custom, Masuk (admin). Tanpa Harga/Daftar. Menu mobile.
- Beranda: hero text-first, Aplikasi Pilihan (maks. 6, fallback published terbaru), section custom, footer dari pengaturan.
- `/apps`: search + filter kategori (pill), grid 12/halaman, pagination, empty state, shortcut Ctrl/⌘+K.
- `/apps/[slug]`: ikon, kategori, platform, deskripsi, fitur, screenshot, video, Buka Aplikasi, Coba Demo; tanpa harga. URL eksternal lewat `safeExternalUrl` + `rel="noopener noreferrer"`.
- `/custom`: form dengan validasi Zod server-side, honeypot, waktu isi minimum, rate limit DB, persetujuan privasi, notifikasi sukses/error, fokus ke ringkasan error.
- `/privacy`, `/terms`: draf faktual sesuai perilaku sistem — **perlu ditinjau pemilik**.
- `/harga` → `/apps`, `/register` → `/`.

### Admin (`src/app/admin/…`)
- Shell baru: sidebar teal gelap (Dashboard, Aplikasi, Permintaan Custom, Pengaturan), topbar judul + menu akun (Keluar), drawer mobile.
- Dashboard: 4 statistik dari query `count` database, aksi cepat, 5 permintaan terbaru.
- Aplikasi: tab status, daftar dengan ikon, tombol Kategori & File Media; editor dengan **Simpan Draft / Publish / Arsipkan**, slug otomatis, Aplikasi Pilihan, media (ikon, screenshot, video upload, YouTube), hapus dengan konfirmasi.
- Permintaan Custom: tab status dengan jumlah, detail kebutuhan, kontak (mailto, wa.me manual — tidak ada pesan otomatis), status, catatan internal, hapus dengan konfirmasi.
- Pengaturan: nama, subteks, deskripsi, logo (upload + verifikasi signature di server), email, WhatsApp, 5 sosial media.
- `/admin/plans` → `/admin/apps`. Kategori & File Media tetap tersedia sebagai sub-halaman Aplikasi.

### Dipertahankan
Supabase SSR auth (`proxy.ts`, `getClaims`, `admin_members`), RLS, media privat + signed URL 60 detik, verifikasi upload (MIME/ekstensi/ukuran/signature), audit log, `/api/admin/apps`, pencarian RPC `catalog_apps`, konfigurasi Netlify, seluruh test sebelumnya (diperbarui untuk UI baru).

### Dihapus dari kode (dapat dipulihkan dari `checkpoint/pre-simple-redesign`)
`src/components/site-shell.tsx` (diganti `site-header`, `site-footer`, `brand`), `src/components/hero-laptop.tsx` (ilustrasi laptop tidak dipakai), CSS lama (ditulis ulang). `src/app/login/actions.ts` dipindah ke `src/lib/admin/auth-actions.ts`. PRD v1.1 dipindah ke `docs/archive/`.

## Catatan keamanan

- Fingerprint rate limit memakai `x-nf-client-connection-ip` (Netlify), lalu `x-forwarded-for`/`x-real-ip`. Header forwarded bisa dipalsukan di luar Netlify; batas per-email dan global tetap berlaku. Pemanggil RPC langsung dengan publishable key melewati honeypot/waktu-isi, tetapi tetap terkena validasi constraint dan rate limit database.
- Bucket logo bersifat public-read (memang tampil ke semua orang); tidak ada data pribadi di dalamnya.
- Halaman publik tidak pernah membaca `custom_requests`; client publik memakai role `anon` yang tidak memiliki grant tabel tersebut.

## Yang masih perlu dari pemilik

1. Logo resmi, email/WhatsApp bisnis, akun sosial media (isi lewat Pengaturan).
2. Tinjau teks Kebijakan Privasi dan Syarat Penggunaan.
3. Persetujuan project Supabase (staging/production) dan penerapan migration v2.
4. Verifikasi Supabase asli (lihat `STAGE_4_REAL_SUPABASE.md`), termasuk perilaku `PT429` dan header IP di Netlify.
5. Persetujuan merge/deploy.
