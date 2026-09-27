# Catatan Deploy Vercel

## Root cause error build

Build sempat gagal dengan error berikut:

```bash
EACCES: permission denied, rmdir '/home/dell/Downloads/pembayaran/.svelte-kit/output/client'
```

Akar masalahnya bukan kode aplikasi, melainkan folder `.svelte-kit` yang sebelumnya dibuat/diubah kepemilikannya oleh proses `root` dari perintah `sudo`. Saat Vite/SvelteKit mencoba membersihkan folder build, proses user normal `dell` tidak punya hak menulis ke folder tersebut, sehingga build gagal.

Solusi yang terbukti:

```bash
cd /home/dell/Downloads/pembayaran
rm -rf .svelte-kit
npm run build
```

Jika folder masih owned oleh root, gunakan:

```bash
sudo chown -R $(whoami):$(id -gn) .svelte-kit
chmod -R u+rwX .svelte-kit
rm -rf .svelte-kit
npm run build
```

Catatan: setelah langkah di atas, build berhasil dengan output `✓ built in 2.85s`.

---

## Checklist environment Vercel

Isi semua variabel berikut pada dashboard Vercel > Project > Settings > Environment Variables.

### Wajib

```env
NODE_ENV=production
DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/<db>
CRON_SECRET=<random-secret-string>
```

### Vercel Blob

```env
BLOB_URL=https://<your-store>.public.blob.vercel-storage.com
BLOB_READ_WRITE_TOKEN=<blob-token>
```

### Telegram backup

```env
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_CHAT_ID=<chat-id>
```

### Alias lama (opsional)

```env
VERCEL_BLOB_URL=https://<your-store>.public.blob.vercel-storage.com
VERCEL_BLOB_TOKEN=<blob-token>
```

---

## Langkah deploy GitHub ke Vercel

### 1. Pastikan repo siap

```bash
git status
git add .
git commit -m "Prepare Vercel deployment"
git push origin versivercel
```

### 2. Buat project di Vercel

- Login ke Vercel
- Klik `Add Project`
- Import repository GitHub
- Pilih repo yang sudah dipush
- Framework preset: `SvelteKit`
- Root directory: `.`
- Build command: `npm run build`
- Output directory: biarkan default jika framework autodetect

### 3. Isi environment variables

Masukkan semua variabel di bagian checklist di atas.

### 4. Deploy

Klik `Deploy`.

### 5. Jalankan migrasi database production

Setelah deployment sukses, jalankan migrasi pada database production:

```bash
npx drizzle-kit push
```

Atau:

```bash
npm run db:push
```

### 6. Uji smoke test

Setelah deploy berhasil:

- login
- dashboard terbuka
- input transaksi pembayaran
- rekap data
- cetak kwitansi
- upload logo/stempel pesantren
- upload tanda tangan user
- backup manual
- endpoint cron backup

---

## Endpoint cron

Endpoint cron yang dibuat:

```text
/api/cron/backup
```

Panggil dengan header:

```bash
Authorization: Bearer <CRON_SECRET>
```

Contoh curl:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://<domain-anda>/api/cron/backup
```

---

## Catatan penting

- SQLite lokal tidak cocok untuk production Vercel.
- File upload lokal di `static/uploads` tidak aman untuk serverless.
- Gunakan Vercel Postgres dan Vercel Blob untuk deployment production.
- Jangan menaruh token di repo; simpan di Vercel Environment Variables.
- Jika build gagal karena `EACCES`, hapus folder `.svelte-kit` dan pastikan ownership benar.
