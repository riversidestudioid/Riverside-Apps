# Tahap 4 — Verifikasi Supabase asli

Tanggal pemeriksaan: 16 November 2026. Branch `feature/catalog-admin`.

## Status runtime dan startup

OrbStack tidak ditemukan di `/Applications/OrbStack.app`, `~/.orbstack/bin`, atau PATH. Docker dan Podman juga tidak ditemukan. Supabase CLI **2.121.0** tersedia; tidak di-upgrade otomatis karena CLI 3 mempunyai perubahan perilaku. Konfigurasi lokal yang sudah ada digunakan, tanpa `supabase init` atau `link`.

Percobaan `supabase start` menghasilkan:

```text
DockerLifecycleInspectError: docker: command not found (podman also not found)
```

CLI memerlukan izin menulis telemetry lokal di luar workspace; setelah pemeriksaan dijalankan dengan izin tersebut, kegagalan tetap disebabkan runtime container yang tidak tersedia.

**Tahap 4 belum selesai. Admin belum dinyatakan siap untuk staging/production.**

## Hasil layanan asli

| Bagian                                       | Status                                                 |
| -------------------------------------------- | ------------------------------------------------------ |
| PostgreSQL dan migration berurutan           | Terblokir runtime; belum dijalankan pada Supabase asli |
| PostgREST dan RLS                            | Belum diuji pada layanan asli                          |
| Auth: login, password salah, refresh, logout | Belum diuji pada layanan asli                          |
| Session expired dan route `/admin`           | Belum diuji pada layanan asli                          |
| Storage upload, replace, delete, ukuran/tipe | Belum diuji pada layanan asli                          |
| CRUD dashboard dan published/draft/archived  | Belum diuji pada layanan asli                          |

Tidak ada migration baru pada tahap ini. Keempat migration sebelumnya dipertahankan. Tidak ada SQL error Supabase asli yang bisa dinilai sebelum layanan hidup. Hasil PGlite sebelumnya tidak digunakan untuk menyatakan migration asli lulus.

## Pengujian yang disiapkan

`npm run test:real` menjalankan `scripts/test-real-supabase.ts` menggunakan SDK Supabase terhadap layanan lokal asli. Script mengambil konfigurasi dari `supabase status -o json` secara internal, menolak hostname selain localhost/127.0.0.1, HTTP port 54321, dan tidak membaca URL database production dari environment aplikasi.

Akun admin/customer uji memakai email unik dan password acak. Membership admin diberikan melalui SQL owner lokal, bukan customer API. Key administratif hanya dipakai proses test Node, tidak dimasukkan ke frontend atau dicetak. Script menghapus fixture berdasarkan UUID unik dalam `finally`; tidak mereset database. Jika proses terputus paksa, fixture unik mungkin tertinggal dan perlu dibersihkan secara selektif.

Cakupan script: password salah/benar, claims, refresh dan logout/revokasi refresh, metadata admin palsu, penolakan self-assignment, CRUD PostgREST, customer write denial, upload Storage asli, tipe SVG ditolak, signed URL, proteksi media published, penghapusan media, dan isolasi draft/published/archived. Script **belum dieksekusi sukses**, sehingga kompatibilitas test dengan layanan asli juga belum diverifikasi.

Session expired berdasarkan waktu nyata, cookie SSR/redirect, seluruh form dashboard, penggantian media, serta batas ukuran file masih harus diuji lewat browser terhadap server Next yang menggunakan Supabase lokal. Suite Playwright yang sudah ada memakai adapter simulasi; itu tidak memenuhi bagian pengujian browser Supabase asli.

## Melanjutkan setelah OrbStack tersedia

1. Pasang [OrbStack](https://docs.orbstack.dev/install) dan buka aplikasinya. Pastikan `docker info` berhasil. Jika instalasi berada di lokasi lain, sesuaikan PATH.
2. Jalankan `npm run check:runtime`, kemudian `supabase start`. Jangan menjalankan reset pada database yang menyimpan data penting.
3. Periksa `supabase migration list --local`; jika stack lama memerlukan migration, gunakan `supabase migration up --local` setelah meninjau daftar pending. Jangan gunakan `db push` atau target remote.
4. Jalankan `npm run test:real`. Test membutuhkan Docker CLI pada PATH dan nama container dari project lokal `riverside-apps-local`.
5. Isi `.env.local` dengan `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` dan public/anon key lokal sesuai nama pada `.env.example`. Jangan menaruh service role key dalam environment frontend. Restart Next.
6. Buat akun browser uji via Studio lokal dengan password pilihan sendiri; berikan membership admin melalui SQL owner sesuai panduan Tahap 3. Uji seluruh matriks Auth/dashboard/media di atas, termasuk customer dan akses langsung API. Jangan mengaktifkan registrasi admin publik.
7. Catat hasil asli, koreksi migration dengan migration tambahan jika diperlukan, kemudian ulangi pemeriksaan sebelum persetujuan staging.

## Kesiapan Netlify staging

Belum siap dinyatakan tervalidasi. Setelah pengujian lokal asli lulus, staging harus menggunakan project Supabase development terpisah dengan persetujuan untuk tindakan remote. Environment Netlify hanya memerlukan public URL dan publishable/anon key sesuai `.env.example`; jangan memasukkan service role key. Konfigurasi Auth site URL/redirect harus mengikuti URL staging, cookie secure menggunakan HTTPS, dan admin_members diberikan pemilik database. Tidak ada pembayaran atau perubahan production.

## Hasil regresi

Hasil lint, typecheck, build Node 22, unit, integration adapter, Playwright adapter dan audit pada pekerjaan ini dicatat terpisah di `docs/VALIDATION.md`. Itu tidak menggantikan tabel layanan asli di atas.

Tidak ada push, merge, reset database, migration remote, deploy, atau perubahan Netlify production. Instruksi push pada awal pesan bertentangan dengan batasan akhir pesan; persetujuan spesifik branch/commit masih diperlukan sebelum push.

### Masalah regresi yang masih terbuka

Dua putaran Playwright mengalami timeout. Rerun terpisah: 10 lulus, 3 timeout, 5 tidak berjalan; akses media tanpa konfigurasi, filter katalog, dan API admin terdampak. Penyebab belum terkonfirmasi. Tidak ada klaim seluruh pengujian lulus; perbaikan dan rerun masih diperlukan sebelum staging. Lint/typecheck/build/unit/integration adapter dan audit lulus.
