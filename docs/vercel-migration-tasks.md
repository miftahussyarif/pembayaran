# Task Migrasi Vercel

Dokumen ini menjadi backlog kerja untuk branch `versivercel`. Targetnya bukan mengganti SvelteKit, tetapi menyesuaikan runtime, database, storage, dan proses background agar aplikasi bisa berjalan stabil di Vercel.

## Status Awal

- Framework saat ini: SvelteKit.
- Adapter saat ini: `@sveltejs/adapter-auto`.
- Database saat ini: SQLite lokal via `better-sqlite3` dan file `local.db`.
- Upload saat ini: file lokal di `static/uploads`.
- Backup otomatis saat ini: `setInterval` di `src/hooks.server.js`.
- Deploy target: GitHub repository terhubung ke Vercel.

## Environment Variable Minimum

- `DATABASE_URL`: koneksi PostgreSQL target, wajib setelah Phase 2.
- `CRON_SECRET`: secret untuk endpoint Vercel Cron, wajib setelah Phase 5.
- Storage credentials: mengikuti provider storage yang dipilih di Phase 4.

## Phase 1 - Fondasi Deploy Vercel

- [x] Pasang `@sveltejs/adapter-vercel`.
- [x] Ubah `svelte.config.js` dari `adapter-auto` ke `adapter-vercel`.
- [x] Tambahkan konfigurasi runtime Node.js bila diperlukan oleh dependency server.
- [x] Jalankan `npm run build` untuk memastikan build SvelteKit tetap lolos.
- [x] Dokumentasikan environment variable minimum untuk Vercel.

## Phase 2 - Migrasi Database SQLite ke PostgreSQL

- [x] Pilih provider PostgreSQL: Vercel Postgres (gratis dan paling mudah untuk deploy Vercel) sebagai opsi utama; Neon tetap menjadi alternatif jika ingin portabilitas.
- [x] Ganti dependency DB dari `better-sqlite3` ke driver PostgreSQL dan `pg` telah ditambahkan.
- [x] Ubah Drizzle schema dari `drizzle-orm/sqlite-core` ke `drizzle-orm/pg-core`.
- [x] Ubah `src/lib/server/db/index.js` agar koneksi memakai `DATABASE_URL`.
- [x] Ubah `drizzle.config.js` ke dialect PostgreSQL.
- [x] Pindahkan migrasi runtime manual dari `src/lib/server/db/index.js` ke file migration Drizzle.
- [x] Buat migration awal PostgreSQL dan terapkan menggunakan `drizzle-kit push`.
- [x] Jalankan migration ke database development.
- [x] Uji query utama: login, dashboard, input pembayaran, riwayat, rekap, master data (smoke tests sebagian selesai).

Catatan revisi: untuk deploy yang mudah di Vercel, variabel ENV yang diprioritaskan adalah `DATABASE_URL` yang diisi dari Vercel Postgres free tier. Ini lebih sederhana daripada mengandalkan SQLite lokal atau Neon yang memerlukan setup tambahan di luar Vercel.

## Phase 3 - Migrasi Data Existing

- [x] Buat backup JSON dari database lokal sebelum perubahan.
- [x] Buat script import backup JSON ke PostgreSQL (`seed.js`) dan sesuaikan format JSON.
- [x] Pastikan urutan insert mengikuti relasi foreign key.
- [x] Validasi jumlah row per tabel sebelum dan sesudah import.
- [x] Validasi data transaksi dan nomor kwitansi tidak berubah.
- [x] Simpan catatan prosedur rollback.

_Catatan_: Backup asli (`backupdb.json`) telah dihapus dari repo workspace setelah seed lokal selesai. Gunakan `pembayaran_neon_import.sql` untuk import ke Neon.

## Phase 4 - Storage Upload Persisten

- [x] Pilih object storage: Vercel Blob, Supabase Storage, Cloudflare R2, atau S3-compatible.
- [x] Buat helper server untuk upload file dan menghasilkan URL publik.
- [x] Migrasikan upload profil pesantren: logo dan stempel.
- [x] Migrasikan upload tanda tangan user.
- [x] Ubah backup agar membaca file dari storage, bukan `static/uploads` ketika blob storage aktif.
- [x] Ubah restore agar menulis file ke storage, bukan filesystem lokal.
- [x] Migrasikan file existing di `static/uploads` ke storage bila konfigurasi blob aktif.

## Phase 5 - Backup Otomatis dan Cron

- [x] Hapus scheduler `setInterval` dari `src/hooks.server.js`.
- [x] Buat endpoint internal untuk menjalankan backup Telegram.
- [x] Lindungi endpoint cron dengan secret token.
- [x] Tambahkan `vercel.json` untuk Vercel Cron.
- [x] Uji backup manual dari UI tetap berjalan.
- [x] Uji endpoint cron di lokal atau preview dengan token.

Catatan implementasi: project sudah siap untuk deployment Vercel dengan PostgreSQL gratis dan Vercel Blob, dengan fallback lokal hanya untuk development.

## Phase 6 - Session dan OTP

- [ ] Pertahankan session utama di database PostgreSQL.
- [ ] Pindahkan pending OTP dari in-memory `Map` ke database dengan expiry.
- [ ] Tambahkan cleanup OTP expired bila diperlukan.
- [ ] Uji login normal, 2FA, logout, dan pembatasan role.

## Phase 7 - Import, Export, dan Restore

- [ ] Uji import santri CSV/XLSX di serverless runtime.
- [ ] Uji import tunggakan CSV/XLSX di serverless runtime.
- [ ] Pastikan ukuran file import aman untuk Vercel Functions.
- [ ] Uji download backup JSON.
- [ ] Uji restore backup ke PostgreSQL dan object storage.

## Phase 8 - GitHub dan Vercel Deployment

- [ ] Push branch `versivercel` ke GitHub.
- [ ] Buat Vercel Project dari repository GitHub.
- [ ] Set environment variables di Vercel.
- [ ] Jalankan preview deployment dari branch `versivercel`.
- [ ] Jalankan migration database production.
- [ ] Uji smoke test di preview: login, input pembayaran, cetak kwitansi, rekap, upload, backup.
- [ ] Setelah stabil, merge ke `main` atau jadikan branch ini sebagai production deployment.

## Risiko Yang Harus Dijaga

- SQLite file tidak dapat menjadi database production di Vercel.
- File di luar `/tmp` tidak bisa dijadikan storage permanen di Vercel.
- `setInterval` tidak cocok untuk serverless karena function tidak hidup terus.
- In-memory OTP bisa hilang antar cold start atau instance.
- Restore database full-delete perlu diuji hati-hati di PostgreSQL karena foreign key dan transaction behavior berbeda dari SQLite.
