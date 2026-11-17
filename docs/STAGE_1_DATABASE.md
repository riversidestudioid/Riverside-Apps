# Tahap 1 — Database lokal

Branch: `feature/catalog-admin`, dibuat dari `origin/feature/foundation-homepage` pada commit `9ca5c65`. Perubahan lokal tahap sebelumnya dipertahankan. Tidak ada commit baru, push, merge, koneksi database production atau deployment dalam pekerjaan ini.

## Migration yang disiapkan

Jalankan berurutan pada database lokal atau staging **yang sudah disetujui**:

1. `20261116081145_catalog_admin.sql`: kategori, aplikasi, media, paket, membership admin, audit log; transaksi penyimpanan, validasi publikasi, RLS dan bucket Storage privat.
2. `20261116085506_profiles_catalog_constraints.sql`: profil pelanggan, hak akses per kolom, RLS profil, dukungan ikon, constraint teks/urutan/YouTube dan index tambahan.

Kedua migration belum diterapkan ke project Supabase remote mana pun. Test menjalankannya pada PostgreSQL PGlite dalam memori dengan schema Auth/Storage minimal. Ini membuktikan SQL dan RLS lokal, belum menggantikan pengujian layanan Supabase asli.

## Struktur

| Tabel           | Fungsi dan relasi                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `categories`    | UUID, slug unik, nama, ikon, urutan, status aktif                                                                |
| `apps`          | UUID, kategori FK, slug unik, konten, status, visibilitas, URL, featured, revisi dan timestamp                   |
| `app_media`     | UUID, aplikasi FK cascade; icon/thumbnail/screenshot/video/YouTube; path Storage atau ID video, alt text, urutan |
| `plans`         | UUID, aplikasi FK cascade; free/one_time/monthly/yearly, integer IDR, fitur, lisensi dan status aktif            |
| `profiles`      | `id` FK ke `auth.users` cascade, `full_name`, `created_at`, `updated_at`                                         |
| `audit_logs`    | UUID, aktor FK, operasi, jenis/ID entitas, timestamp; perubahan katalog dicatat trigger                          |
| `admin_members` | UUID user Auth sebagai PK/FK; hanya pengelola database tepercaya dapat memberi/mencabut membership               |

PRD memuat contoh role pada profil dan mengizinkan penyesuaian model selama relasi konsisten. Implementasi menormalisasi otorisasi ke `admin_members`, bukan menduplikasi `profiles.role`. Admin = memiliki baris membership; pengguna tanpa membership = customer. Dengan begitu, edit profil atau `user_metadata` tidak pernah memberikan akses admin. Pemeriksaan server dan RLS menggunakan sumber yang sama, dan pencabutan membership berlaku pada request berikutnya.

Profil tidak dibuat lewat trigger Auth yang memerlukan privilege tinggi. Pada tahap integrasi akun, aplikasi dapat membuat/memperbarui profil sendiri menggunakan sesi pengguna. `INSERT` hanya mengizinkan `id` sendiri dan nama; `UPDATE` hanya memberi privilege pada `full_name`. ID, timestamp, membership, dan hak akses tidak dapat diubah pelanggan. Tidak ada password/email atau secret yang disalin ke profil.

## Hak akses

| Sumber           | Anonymous                                 | Customer                    | Admin                                             |
| ---------------- | ----------------------------------------- | --------------------------- | ------------------------------------------------- |
| Kategori         | Baca yang aktif                           | Baca yang aktif             | CRUD                                              |
| Aplikasi         | Baca published + visible + kategori aktif | Sama dengan anonymous       | CRUD                                              |
| Media/paket      | Baca yang mengikuti produk published      | Sama dengan anonymous       | CRUD dengan validasi status                       |
| Profil           | Tidak ada akses                           | Baca/buat/edit nama sendiri | Baca seluruh profil; edit nama sendiri            |
| Membership admin | Tidak ada baris terlihat                  | Tidak ada baris terlihat    | Baca membership sendiri; tanpa grant mutasi       |
| Audit log        | Tidak ada akses                           | Tidak ada akses             | Baca, append operasi sendiri; tanpa update/delete |
| Storage privat   | Hanya file produk published               | Sama dengan anonymous       | Baca, upload ke draft, hapus file nonpublished    |

Semua tabel public menggunakan RLS dan grant eksplisit. Schema `private` tidak diekspos melalui Data API. Privilege per kolom pada profil melengkapi RLS per baris, sesuai [panduan Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Constraint dan index

- UUID, FK dan aturan cascade/restrict melindungi relasi. Index tersedia untuk FK, slug unik, status/revisi katalog, urutan kategori, model paket, media per aplikasi, dan katalog published terbaru/unggulan.
- Seluruh produk baru harus mulai sebagai draft. Publikasi membutuhkan kategori aktif, deskripsi lengkap, thumbnail, URL aplikasi HTTPS, dan paket aktif dengan harga serta lisensi lengkap.
- Harga NULL boleh untuk draft yang belum ditentukan; free harus 0 jika diisi, dan paket berbayar harus integer positif. NULL tidak boleh lolos publikasi paket aktif.
- Satu ikon dan satu thumbnail per aplikasi. YouTube memerlukan ID 11 karakter yang valid; path upload dibatasi folder UUID aplikasi dan format raster/video yang diizinkan.
- Snapshot revisi editor diperiksa pada transaksi agar penyimpanan dari editor lama ditolak.
- Seed contoh tetap draft dan invisible; menjalankan seed dua kali tidak menggandakan aplikasi.

## Konfigurasi development

`supabase/config.toml` dibuat oleh CLI dan dikonfigurasi untuk development terisolasi: project ID lokal, PostgreSQL 17, grant API eksplisit, tanpa signup publik atau seed otomatis. Tidak ada project ref remote atau secret di file ini. Minimum password lokal 12 karakter; akun admin dibuat melalui Studio, bukan pendaftaran admin publik.

Jika Docker dan Supabase CLI tersedia:

```sh
supabase start
supabase migration list --local
```

Untuk membuat ulang **database lokal disposable saja**, setelah memastikan tidak ada data lokal penting:

```sh
supabase db reset --local --no-seed
```

Perintah reset ini menghapus data lokal. Jangan mengganti `--local` dengan `--linked`, `--db-url` atau project production. Tidak ada reset atau Supabase stack Docker yang dijalankan dalam pekerjaan ini karena Docker tidak tersedia.

Seed opsional dapat dipakai saat reset lokal disposable:

```sh
supabase db reset --local --sql-paths ./seed.sql
```

Setelah stack lokal siap, isi `.env.local` dari konfigurasi lokal:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key-lokal>
```

Jangan memasukkan service role key, password atau token ke source/chat. Untuk project remote, URL wajib HTTPS; minta persetujuan dan periksa schema/advisors sebelum migrasi. Project ref yang pernah disebutkan (`qlacgysqrjsgclagrqce`) belum dapat diakses oleh connector, dan belum dikonfirmasi sebagai staging.

## Pengujian dan langkah berikutnya

- `npm test`: 9 pengujian validasi/PostgreSQL lulus, termasuk RLS, CRUD, transaksi publikasi, profil, privilege escalation, media privat dan seed.
- Lint, typecheck, build Node 22 dan 9 test Playwright lulus; audit dependency 0 vulnerabilities.
- Homepage dan UI tidak diubah dalam Tahap 1 ini. Kode katalog/admin dari pekerjaan sebelumnya tetap ada di working tree.

Selanjutnya: validasi schema terhadap Supabase lokal/staging yang disetujui, generate ulang tipe dari schema aktual, hubungkan katalog dan detail ke data uji, lalu verifikasi Auth/Storage sungguhan. Lengkapi upload ikon pada UI dashboard pada tahap admin; Tahap 1 baru menyiapkan kontrak database ikon. Tidak mengaktifkan pembayaran.

Pembaruan berikutnya: Tahap 2 menambahkan migration `20261116090337_public_catalog_search.sql` dan menghapus fallback fixture publik. Lihat `STAGE_2_CATALOG.md` untuk status dan runbook terbaru.
