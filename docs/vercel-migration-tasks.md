# Task Migrasi Vercel

Dokumen ini menjadi backlog kerja untuk branch `versivercel`. Targetnya bukan mengganti SvelteKit, tetapi menyesuaikan runtime, database, storage, dan proses background agar aplikasi bisa berjalan stabil di Vercel.

## Status Awal

- Framework saat ini: SvelteKit.
- Adapter saat ini: `@sveltejs/adapter-auto`.
- Database saat ini: SQLite lokal via `better-sqlite3` dan file `local.db`.
- Upload saat ini: file lokal di `static/uploads`.
- Backup otomatis saat ini: `setInterval` di `src/hooks.server.js`.
- Deploy target: GitHub repository terhubung ke Vercel.

## Phase 1 - Fondasi Deploy Vercel

- [ ] Pasang `@sveltejs/adapter-vercel`.
- [ ] Ubah `svelte.config.js` dari `adapter-auto` ke `adapter-vercel`.
- [ ] Tambahkan konfigurasi runtime Node.js bila diperlukan oleh dependency server.
- [ ] Jalankan `npm run build` untuk memastikan build SvelteKit tetap lolos.
- [ ] Dokumentasikan environment variable minimum untuk Vercel.

## Phase 2 - Migrasi Database SQLite ke PostgreSQL

- [ ] Pilih provider PostgreSQL: Vercel Postgres, Neon, Supabase, atau provider lain yang kompatibel `DATABASE_URL`.
- [ ] Ganti dependency DB dari `better-sqlite3` ke driver PostgreSQL.
- [ ] Ubah Drizzle schema dari `drizzle-orm/sqlite-core` ke `drizzle-orm/pg-core`.
- [ ] Ubah `src/lib/server/db/index.js` agar koneksi memakai `DATABASE_URL`.
- [ ] Ubah `drizzle.config.js` ke dialect PostgreSQL.
- [ ] Pindahkan migrasi runtime manual dari `src/lib/server/db/index.js` ke file migration Drizzle.
- [ ] Buat migration awal PostgreSQL.
- [ ] Jalankan migration ke database development.
- [ ] Uji query utama: login, dashboard, input pembayaran, riwayat, rekap, master data.

## Phase 3 - Migrasi Data Existing

- [ ] Buat backup JSON dari database lokal sebelum perubahan.
- [ ] Buat script import backup JSON ke PostgreSQL.
- [ ] Pastikan urutan insert mengikuti relasi foreign key.
- [ ] Validasi jumlah row per tabel sebelum dan sesudah import.
- [ ] Validasi data transaksi dan nomor kwitansi tidak berubah.
- [ ] Simpan catatan prosedur rollback.

## Phase 4 - Storage Upload Persisten

- [ ] Pilih object storage: Vercel Blob, Supabase Storage, Cloudflare R2, atau S3-compatible.
- [ ] Buat helper server untuk upload file dan menghasilkan URL publik.
- [ ] Migrasikan upload profil pesantren: logo dan stempel.
- [ ] Migrasikan upload tanda tangan user.
- [ ] Ubah backup agar membaca file dari storage, bukan `static/uploads`.
- [ ] Ubah restore agar menulis file ke storage, bukan filesystem lokal.
- [ ] Migrasikan file existing di `static/uploads` ke storage.

## Phase 5 - Backup Otomatis dan Cron

- [ ] Hapus scheduler `setInterval` dari `src/hooks.server.js`.
- [ ] Buat endpoint internal untuk menjalankan backup Telegram.
- [ ] Lindungi endpoint cron dengan secret token.
- [ ] Tambahkan `vercel.json` untuk Vercel Cron.
- [ ] Uji backup manual dari UI tetap berjalan.
- [ ] Uji endpoint cron di lokal atau preview dengan token.

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
