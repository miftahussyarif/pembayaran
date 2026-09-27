# Phase 4 — Vercel Blob (Awal)

Ini adalah titik awal Phase 4: migrasi storage file ke Vercel Blob (atau provider object storage pilihan).

Langkah awal yang saya buat di repo:

- `pembayaran_neon_import.sql` tersedia di root — SQL dump siap diimpor ke Neon.
- Tambahkan placeholder artefak `vercel_blob/README.md` untuk dokumentasi dan instruksi migrasi file upload.

Tindakan selanjutnya (Phase 4):

- Pilih provider storage (Vercel Blob direkomendasikan jika ingin konsisten dengan Vercel).
- Buat helper server untuk upload dan generate URL publik (`src/lib/server/storage.js`).
- Ubahan kode: ganti path upload dari `static/uploads` ke helper storage.
- Migrasi file di `static/uploads` ke storage menggunakan skrip migrasi.
- Validasi URL yang dihasilkan dapat diakses dari preview dan production.

Implementasi awal di repo:

- `src/lib/server/storage.js`: helper upload/getUrl yang menggunakan `VERCEL_BLOB_URL` + `VERCEL_BLOB_TOKEN` bila tersedia, dan fallback ke `static/uploads/blob/` untuk lokal.
- `scripts/migrate_uploads_to_blob.js`: skrip untuk migrasi file lokal ke storage.

Cara pakai (lokal):

1. Pastikan environment tidak memuat `VERCEL_BLOB_URL` dan `VERCEL_BLOB_TOKEN` → skrip akan menyalin file ke `static/uploads/blob/`.
2. Untuk migrasi ke Vercel Blob, set `VERCEL_BLOB_URL` dan `VERCEL_BLOB_TOKEN` lalu jalankan:

```bash
node scripts/migrate_uploads_to_blob.js
```

Catatan keamanan: jangan commit token ke repo. Simpan token di Vercel Environment Variables.

File artefak: `vercel_blob/` berisi petunjuk dan placeholder.
