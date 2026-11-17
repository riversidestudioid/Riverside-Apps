# Fase 2 — Katalog dan Admin Riverside Apps

Status: implementasi lokal untuk review, belum di-push atau diterapkan ke Supabase/Netlify. Referensi utama: PRD bagian 3–8, FR-01/02/04/08, dan sprint katalog/admin. Fase ini merupakan bagian Fase A PRD, bukan aktivasi Fase B pembayaran.

## Pemeriksaan awal

Branch `feature/foundation-homepage`, dasar commit `9ca5c65`. Dua perubahan dependency audit sudah ada sebelum Fase 2 dan dipertahankan. Remote GitHub benar; akun `ezraanugrah` mempunyai Write dari pemeriksaan sebelumnya. Branch kerja kemudian dipindahkan ke `feature/ui-ux-redesign` sesuai instruksi pemilik, dengan seluruh perubahan lokal dipertahankan. Tidak ada push baru. Homepage production yang diberikan: https://jade-fox-9bf4a7.netlify.app/ (tidak diubah).

Project target yang diberikan pemilik: `qlacgysqrjsgclagrqce`, organisasi RiverSideStudio.id. Connector Supabase saat ini menolak akses. Tidak ada `.env.local`, service role key, koneksi database, atau migrasi remote yang dibuat. Project lain `sagi-journal` tidak digunakan.

## Urutan dan hasil implementasi lokal

1. Migration berversi: `categories`, `apps`, `plans`, `app_media`, `admin_members`, `audit_logs`; foreign keys, index, check constraints, RLS, bucket privat.
2. Data access publik menggunakan Supabase client anon terpisah tanpa cookie admin. Homepage mempertahankan desain; katalog, filter kategori/model akses/urutan, detail dan harga membaca database. Query disimpan dalam URL. Tanpa konfigurasi, production menunjukkan katalog kosong; fixture desain development tetap berlabel draft.
3. Supabase email/password login admin, cookie SSR dan refresh melalui `src/proxy.ts`. `getUser()` memverifikasi sesi; setiap halaman/action admin mengecek tabel keanggotaan. Tidak ada pendaftaran admin publik, pengambilan role dari user_metadata, atau service key dalam aplikasi.
4. Dashboard ringkasan, daftar aplikasi, editor tambah/edit, konfirmasi hapus, draft/published/archived, kategori aktif/nonaktif, harga dan media. RPC `save_catalog_app` menyimpan produk/paket dalam transaksi dengan pemeriksaan revisi agar perubahan editor lama ditolak.
5. Media di-upload langsung dari browser ke bucket privat melalui sesi admin/RLS, path UUID immutable, tanpa upsert. Server memeriksa metadata ukuran/MIME sebelum mendaftarkan media. Gambar JPG/PNG/WebP maksimal 5 MB, video MP4/WebM maksimal 50 MB. URL YouTube diparse menjadi ID dari host yang diizinkan, bukan HTML iframe dari admin.
6. Validasi dan test lokal: unit untuk URL/harga/upload dan normalisasi parameter; PostgreSQL PGlite untuk migration/RLS/RPC; Playwright untuk UI publik dan penolakan akses admin tanpa konfigurasi. Pengujian Auth/Storage sungguhan dengan akun admin masih memerlukan staging.

## Aturan publikasi dan keamanan

- Publik hanya membaca aplikasi `published`, `is_visible=true`, kategori aktif. Paket/media mengikuti visibilitas parent. Query publik tetap anon saat admin login.
- Publikasi membutuhkan deskripsi minimal 20 karakter, kategori aktif, URL aplikasi HTTPS, thumbnail, serta minimal satu paket aktif dengan harga dan lisensi lengkap.
- Harga integer rupiah: free=0, berbayar>0. Harga belum diketahui disimpan NULL saat draft. Bulanan/tahunan tidak menjanjikan debit otomatis.
- Semua record baru dimulai sebagai draft. Menyimpan published dilakukan setelah validasi akhir di transaksi database.
- Ubah status ke draft sebelum mengubah media. Database menolak perubahan paket/media pada published; RPC menurunkan status dalam transaksi lalu memvalidasi ulang publikasi. Storage tidak menyediakan UPDATE/upsert, dan DELETE file published ditolak.
- Bucket tidak publik. Route media memeriksa akses sebelum membuat signed URL 60 detik dengan `Cache-Control: private, no-store`. Signed URL yang sudah dikeluarkan dapat tetap berlaku sampai TTL berakhir setelah unpublish; ini batas eksplisit, bukan pencabutan instan. URL YouTube adalah URL layanan eksternal dan tetap mengikuti privasi video YouTube sendiri.
- Tidak memakai Next image optimizer untuk file privat agar hasilnya tidak masuk cache gambar publik.
- Audit log append-only bagi admin; trigger mencatat actor/operasi/entity pada aplikasi, kategori, paket, dan media. Pelanggan tidak dapat mengedit membership atau audit log. Admin membership hanya dikelola pengelola database tepercaya.
- Auth memakai rate limit bawaan Supabase. Review pengaturan rate limit, kebijakan password, email, dan MFA project sebelum rilis. Tidak menggunakan limiter memori yang tidak konsisten pada fungsi serverless.
- Pembayaran, checkout, webhook, order dan entitlement tetap tidak aktif.

## Persiapan staging — belum dijalankan

1. Hubungkan connector Supabase dengan akun yang mempunyai akses `qlacgysqrjsgclagrqce`; konfirmasi apakah project ini staging atau production. Periksa schema/Storage/advisors sebelum migrasi. Jangan menerapkan file ini ke database yang sudah memiliki schema bertabrakan.
2. Siapkan project development terisolasi atau Supabase lokal. Jalankan migration di lingkungan yang disetujui, bukan `db push` ke production. `supabase/seed.sql` opsional, semuanya draft. PGlite test menggunakan mock schema `auth`/`storage` hanya di memori, bukan menggantikan test layanan Supabase.
3. Generate ulang tipe database dari schema hasil migration dan cocokkan dengan kontrak TypeScript lokal. Tipe sekarang ditulis berdasarkan migration karena project belum dapat diakses.
4. Buat pengguna admin melalui Supabase Auth Dashboard. Melalui SQL Editor sebagai pengelola tepercaya, tambahkan UUID pengguna yang sudah diverifikasi:

```sql
insert into public.admin_members (user_id) values ('UUID_ADMIN_YANG_VALID');
```

Tidak ada password di SQL/seed. Mencabut baris membership menolak akses admin pada request berikutnya, tanpa menunggu klaim role JWT diperbarui.

5. Isi `.env.local` dengan project URL dan publishable key melalui lingkungan lokal (bukan chat); restart dev server. Untuk Netlify, atur environment build/runtime dan preview secara terpisah. Tidak perlu service role key.
6. Jalankan smoke test dengan admin, customer biasa, dan anonymous: create draft → upload thumbnail/screenshot/video/YouTube → isi empat model paket → save → publish → buka katalog/detail dari browser anonymous → ubah draft → pastikan hilang dari katalog dan data API/Storage → arsip/hapus → cek audit log.
7. Uji upload gagal, duplikasi slug/thumbnail, revisi editor stale, harga invalid, logout, sesi kedaluwarsa, pencabutan role, URL media draft, kategori nonaktif, HTTP response/cache, serta pengaturan bucket pada layanan asli.
8. Jalankan Supabase advisors, lint, typecheck, unit/RLS test, E2E dan build. Review deployment preview Netlify setelah persetujuan. Production migration, push, merge dan production deployment memerlukan persetujuan terpisah.

## Batas scope

Dashboard pelanggan, transaksi, custom request, password recovery, admin MFA UI dan entitlement bukan bagian implementasi ini. Login hanya untuk admin; registrasi publik masih halaman persiapan. Pengelolaan kategori meliputi tambah/edit/nonaktif; penghapusan permanen kategori tidak disediakan agar relasi produk tetap utuh. File yang gagal dibersihkan setelah penghapusan metadata tetap privat dan perlu dibersihkan lewat Storage; pesan UI menjelaskan kondisi ini. Tidak ada klaim integrasi live selesai sebelum staging lulus.

## Pembaruan Tahap 1

Branch aktif kini `feature/catalog-admin`, dibuat dari fondasi remote `9ca5c65`, tanpa menghapus pekerjaan lokal sebelumnya. Migration tambahan menyediakan `profiles`, dukungan media `icon`, constraint data, serta index katalog. Role admin tetap dinormalisasi ke `admin_members` agar tidak mempunyai dua sumber otorisasi. Konfigurasi Supabase lokal tersedia dengan signup dan seed otomatis nonaktif. Seluruh migration dieksekusi berurutan dalam test PostgreSQL lokal. Lihat `STAGE_1_DATABASE.md` untuk konfigurasi dan urutan penerapan.

Pembaruan Tahap 2: katalog sekarang memakai RPC database, kategori dinamis dan pagination tanpa produk hardcoded, termasuk development. Laporan ini mencatat scaffold awal; status terbaru dan batas pengujian ada pada `STAGE_2_CATALOG.md`.
