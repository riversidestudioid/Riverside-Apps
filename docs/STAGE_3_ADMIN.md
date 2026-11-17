# Tahap 3 — Authentication & Admin Dashboard

Implementasi lokal pada `feature/catalog-admin`. Tidak ada push, merge, perubahan Netlify production, akun admin remote, atau migration remote.

## Status Supabase asli

`npm run check:runtime` tidak menemukan Docker, Colima, Podman, nerdctl, atau OrbStack. CLI Supabase 2.121.0 tersedia, tetapi stack Supabase asli **belum diuji**. PGlite menjalankan SQL PostgreSQL/RLS; adapter HTTP dan Auth ES256 dalam test adalah simulasi, bukan PostgREST, GoTrue, atau Storage asli. Aktivasi admin pada lingkungan sungguhan harus menunggu verifikasi berikut.

## Menyiapkan lingkungan lokal

Gunakan [Docker Desktop untuk Mac](https://docs.docker.com/desktop/setup/install/mac-install/) sesuai chip Mac, lalu jalankan aplikasinya. Alternatif [Colima](https://colima.run/docs/installation/):

```bash
brew install colima docker
colima start --runtime docker
```

Setelah runtime siap, dari root repository:

```bash
docker info
npm run check:runtime
supabase start
supabase migration list --local
```

`supabase start` pada database lokal baru menerapkan migration. Untuk database lokal lama, gunakan `supabase migration up --local`. Jangan menjalankan `db push`, `link`, atau perintah remote. `supabase db reset --local` menghapus data lokal; hanya gunakan untuk lingkungan uji yang boleh dibuang. Lihat [panduan lokal resmi](https://supabase.com/docs/guides/local-development/cli/getting-started).

Salin `.env.example` menjadi `.env.local`, lalu isi URL API lokal dan publishable/anon key lokal dari CLI. Jangan masukkan service role key. Restart server setelah mengubah environment. Jangan commit `.env.local` atau menyalin output kredensial ke issue/chat.

Buka Studio lokal pada alamat yang diberikan CLI. Buat pengguna admin dan customer lewat pengelolaan Auth Studio, dengan password pilihan sendiri dan email terkonfirmasi. Pendaftaran publik dinonaktifkan. Jalankan SQL berikut sebagai pemilik database lokal, mengganti UUID dengan ID pengguna admin yang benar:

```sql
insert into public.admin_members(user_id)
values ('UUID-PENGGUNA-ADMIN')
on conflict do nothing;
```

Pengguna biasa tidak memiliki izin menulis tabel ini. Penghapusan membership mencabut akses pada pemeriksaan server/RLS berikutnya. Jangan memberikan role melalui user metadata.

## Migration dan perilaku

Migration baru `20261116092711_admin_features_settings_media.sql` menambahkan `apps.key_features`, pengaturan dasar, RPC pengaturan atomik, RPC penggantian metadata media atomik, dan memperketat policy Storage. Terapkan setelah tiga migration Tahap 1/2. Seluruh migration tetap dipertahankan.

- Login `/login`: email/password, error generik, return URL internal, session expired, logout; tanpa registrasi admin publik.
- Next.js 16 `proxy.ts` melakukan refresh cookie melalui Supabase SSR dan `getClaims()`. Server layout, action, route handler, dan media memverifikasi token serta membership langsung; tidak mengandalkan metadata pengguna atau tampilan UI.
- `/admin`: overview, aplikasi, editor, kategori, media, paket harga, pengaturan. Navigasi sidebar responsif. Hapus membutuhkan konfirmasi.
- `/api/admin/apps`: GET/POST terproteksi; POST memeriksa origin, JSON, ukuran payload, validasi server, membership dan RLS.
- Edit aplikasi published menyimpan melalui transaksi draft → validasi → publish. Katalog dinamis dan revalidasi tidak memerlukan deploy kode. Produk draft/archived tetap tidak tersedia publik.
- Bucket privat `app-media`: upload hanya admin pada produk draft, path unik, owner uploader terverifikasi, tanpa overwrite. Pemeriksaan MIME, ekstensi, ukuran (gambar 5 MB/video 50 MB), dan signature file dilakukan kembali di server. Pemeriksaan signature bukan pemindaian antivirus atau decoder gambar penuh.
- Penggantian media menyimpan metadata atomik sebelum membersihkan berkas lama. Berkas yatim dapat dibersihkan admin; daftar UI dibatasi 100 objek per aplikasi. Ubah produk menjadi draft sebelum mengganti media. Berkas yang masih direferensikan produk published tidak dapat dihapus.
- URL media ditandatangani selama 60 detik. URL yang sudah diterbitkan dapat tetap bekerja sampai kedaluwarsa. Logout lokal menghapus session; access token yang telah terbit tetap berlaku hingga expiry, dengan membership tetap diperiksa saat akses admin.
- Pengaturan tersimpan di database dan digunakan header/footer. Kolom aktor perubahan tidak diberikan kepada publik. Tidak ada pembayaran.

## Verifikasi yang masih wajib pada Supabase asli

1. Jalankan keempat migration pada stack lokal baru; pastikan API, Auth dan Storage sehat.
2. Login admin/customer melalui Auth asli, refresh session, kedaluwarsa session, logout dan cabut membership. Pastikan customer ber-metadata admin tetap ditolak.
3. Dengan anon/customer client, coba baca slug draft/archived dan mutasi categories/apps/app_media/plans/admin_members/site_settings. Pastikan RLS menolak; published + visible saja yang terbaca.
4. Uji CRUD lewat dashboard dan permintaan API langsung. Upload gambar/video yang valid, ekstensi palsu, terlalu besar, ganti gambar, hapus objek yatim, dan pastikan customer ditolak Storage.
5. Pastikan perubahan published langsung muncul di katalog dan URL filter tetap dapat dibagikan. Jalankan pemeriksaan browser terhadap aplikasi yang memakai stack asli.

Test otomatis repository mencakup alur tersebut dengan PostgreSQL PGlite dan adapter simulasi. Keberhasilannya tidak membuktikan kompatibilitas layanan Supabase asli. Hasil akhir tercatat di `docs/VALIDATION.md`.

## Alternatif development remote

Jika container tidak dapat dipasang, gunakan project Supabase development terpisah dengan data uji, bukan project produksi. Sebelum tindakan remote diperlukan persetujuan eksplisit untuk project ref, penerapan migration, konfigurasi Auth/Storage, dan pembuatan akun uji. Siapkan environment development terpisah, terapkan migration berurutan, lakukan matriks pengujian di atas, baru pertimbangkan aktivasi admin. Tidak ada project remote yang dibuat, dihubungkan, atau diubah dalam pekerjaan ini.
