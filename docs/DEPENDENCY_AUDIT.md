# Audit dependency — 16 November 2026

## Temuan awal

Tujuh package dilaporkan moderate, berasal dari satu advisory [GHSA-g3hv-75wg-m249 / CVE-2026-118764](https://github.com/advisories/GHSA-g3hv-75wg-m249):

| Package                                | Versi sebelumnya | Hubungan                                              |
| -------------------------------------- | ---------------- | ----------------------------------------------------- |
| `minimatch`                            | 10.2.6           | Akar masalah pada preprocessing glob                  |
| `@typescript-eslint/typescript-estree` | 8.72.2           | Memanggil minimatch                                   |
| `@typescript-eslint/parser`            | 8.72.2           | Bergantung pada typescript-estree                     |
| `@typescript-eslint/utils`             | 8.72.2           | Bergantung pada typescript-estree                     |
| `@typescript-eslint/type-utils`        | 8.72.2           | Bergantung pada typescript-estree/utils               |
| `@typescript-eslint/eslint-plugin`     | 8.72.2           | Bergantung pada type-utils/utils                      |
| `typescript-eslint`                    | 8.72.2           | Membawa parser/plugin/utilities ke eslint-config-next |

Rentang rentan pada advisory: minimatch >=7.0.0 dan <11.0.1; versi perbaikan 11.0.1. Pola glob yang dikendalikan penyerang dengan optimizationLevel >=2 dapat memperbesar pekerjaan preprocessing dan menghabiskan CPU/memori. Ini risiko availability pada tooling/CI ketika memproses konfigurasi/pola tidak tepercaya, bukan bukti kebocoran kredensial atau exploit pada halaman pengunjung.

Di repository ini dependency berada pada tooling development ESLint, bukan jalur request aplikasi. Penggunaan yang ditemukan di typescript-estree adalah `minimatch(filePath, pattern, {dot:true})` pada project service `allowDefaultProject`. Konfigurasi aplikasi saat ini tidak mengaktifkan optimizationLevel >=2. Risiko aktual lebih sempit daripada total tujuh temuan, tetapi dependency rentan tetap perlu diperbaiki.

## Perbaikan lokal

Upstream typescript-eslint terbaru yang diperiksa masih 8.72.2 dan bergantung pada `minimatch: ^10.2.2`; `npm audit fix` tanpa force belum menyelesaikan temuan.

Diterapkan override **khusus parent**:

```json
{
  "overrides": {
    "@typescript-eslint/typescript-estree": {
      "minimatch": "11.0.1"
    }
  }
}
```

Override ini melintasi versi mayor minimatch, tetapi tidak mengganti minimatch 3 milik ESLint/plugin lain dan tidak mengubah mayor Next.js/ESLint. Paket 10.2.6 dan 11.0.1 sama-sama menyediakan named export minimatch untuk CommonJS/ESM dan mendukung Node 22. Pemeriksaan parser nyata `parseForESLint` dengan projectService/allowDefaultProject berhasil setelah override, selain lint/typecheck/build/test proyek.

Ini mitigasi lokal terkontrol, bukan klaim upstream telah mendukung semua perubahan versi 11. Pertahankan pin dan lockfile, monitor rilis typescript-eslint, lalu hapus override ketika upstream memakai versi yang ditambal. Jika ada regresi glob, tinjau perubahan API dan upgrade upstream; jangan mengembalikan versi rentan tanpa penilaian risiko.

`npm audit fix --force` tidak digunakan. Setelah instalasi, audit keseluruhan dan `npm audit --omit=dev` melaporkan 0 vulnerabilities. Audit hanya mencakup advisory yang diketahui registry saat pemeriksaan, bukan jaminan bebas seluruh risiko.
