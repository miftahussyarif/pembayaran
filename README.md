# Sistem Pembayaran Pesantren

Aplikasi pembayaran pesantren berbasis web untuk input transaksi, cetak kwitansi, rekap pembayaran (global dan individu), serta manajemen data master (santri, kategori, jenis pembayaran, tahun ajaran). Cocok untuk operasional bendahara/petugas pembayaran.

## Review Singkat

### Teknologi (Backend & Infrastruktur)
- **SvelteKit** sebagai framework fullstack (SSR + form actions).
- **Drizzle ORM** untuk akses database.
- **SQLite** (via `better-sqlite3`) sebagai database lokal (`local.db`).
- **Node.js** runtime (server aplikasi + SvelteKit).

### Teknologi (Frontend)
- **Svelte** (komponen), routing berbasis file.
- **Tailwind + DaisyUI** untuk UI (kelas utilitas dan komponen).

### Fitur Utama
- **Input transaksi pembayaran** dengan validasi dan cetak kwitansi.
- **Kwitansi** siap print, termasuk **terbilang**.
- **Riwayat pembayaran** dan **rekapitulasi** (filter bulan/tahun/jenis).
- **Rekap individu** per santri (syahriyah bulanan + non-bulanan: tahunan/sekali/insidental).
- **Aturan syahriyah gratis** untuk santri kategori tertentu (mis. yatim).
- **Manajemen master**: santri, kategori santri, jenis pembayaran, tahun ajaran.
- **Pengaturan profil pesantren** + **upload logo** (ditampilkan di sidebar).
- **Role user** (admin/guru/pengawas) dan menu admin.

---

## Struktur & Konfigurasi Penting

- Database: `local.db`
- Seeder: `seed.js`
- Skema DB: `src/lib/server/db/schema.js`
- Aplikasi SvelteKit: `src/routes/(app)`

---

## Instalasi (Ubuntu Server)

### 1. Persiapan
```bash
sudo apt update
sudo apt install -y git curl
```

### 2. Install Node.js (LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 3. Clone & Install Dependency
```bash
git clone <repo-anda> pembayaran
cd pembayaran
npm install
```

### 4. Jalankan Development (opsional)
```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

### 5. Build & Run Production
```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

> Untuk production yang lebih stabil gunakan process manager (PM2) + reverse proxy (Nginx), lihat panduan VPS di bawah.

---

## Instalasi (VPS)

### Rekomendasi Stack
- **Node.js LTS**
- **PM2** untuk menjalankan service
- **Nginx** sebagai reverse proxy

### 1. Install PM2
```bash
sudo npm install -g pm2
```

### 2. Jalankan App
```bash
npm run build
pm2 start "npm run preview -- --host 0.0.0.0 --port 4173" --name pembayaran
pm2 save
```

### 3. Konfigurasi Nginx
Buat file `/etc/nginx/sites-available/pembayaran`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Aktifkan:
```bash
sudo ln -s /etc/nginx/sites-available/pembayaran /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

> Jika ingin HTTPS, gunakan Certbot (Let’s Encrypt).

---

## Instalasi di aaPanel

Panduan singkat deploy dengan aaPanel (Nginx + Node.js Manager).

### 1. Siapkan Site di aaPanel
1. Login aaPanel → **Website** → **Add site**.
2. Masukkan domain/subdomain.
3. Pilih **Nginx**.
4. Selesai.

### 2. Install Node.js Manager
1. aaPanel → **App Store**.
2. Install **Node.js Manager** (atau “Node Project Manager”).

### 3. Upload / Clone Project
Opsi A (Upload ZIP):
1. aaPanel → **File** → buka folder site, upload zip project.
2. Extract di folder site (mis. `/www/wwwroot/domain`).

Opsi B (Git):
1. aaPanel → **Terminal**.
2. `cd /www/wwwroot/domain`
3. `git clone <repo-anda> .`

### 4. Install Dependency & Build
Jalankan via Terminal aaPanel:
```bash
cd /www/wwwroot/domain
npm install
npm run build
```

### 5. Jalankan Node Project
1. aaPanel → **Node Project** → **Add Project**.
2. Pilih folder project.
3. Node Version: **LTS**.
4. Start Command:
```bash
npm run preview -- --host 0.0.0.0 --port 4173
```
5. Start Project.

### 6. Reverse Proxy (Wajib)
1. aaPanel → **Website** → **Settings** (domain) → **Reverse Proxy**.
2. Tambahkan proxy ke:
```
http://127.0.0.1:4173
```
3. Simpan.

### 7. Permission Folder Upload
Pastikan folder `static/uploads/` dan file `local.db` bisa ditulis:
```bash
cd /www/wwwroot/domain
chmod -R 755 static/uploads
chmod 664 local.db
```

> Jika memakai port berbeda, sesuaikan di **Start Command** dan **Reverse Proxy**.

---

## Kompilasi ke Aplikasi Windows (Desktop)

Aplikasi ini adalah **web app**. Untuk dijadikan aplikasi Windows, Anda perlu **membungkus** web app menggunakan **Tauri** atau **Electron**.

### Opsi A: Tauri (Ringan)
**Kelebihan:** ukuran kecil, cepat. **Kekurangan:** butuh Rust toolchain.

1. Install Rust
```powershell
winget install Rustlang.Rustup
rustup default stable
```

2. Install Tauri CLI
```powershell
cargo install tauri-cli
```

3. Tambahkan Tauri ke proyek
```powershell
npm install
npx tauri init
```

4. Build Windows
```powershell
npm run build
npx tauri build
```
Output ada di `src-tauri/target/release/bundle`.

### Opsi B: Electron (Paling Mudah)
**Kelebihan:** setup mudah. **Kekurangan:** ukuran app besar.

1. Install Electron
```powershell
npm install --save-dev electron
```

2. Buat `electron/main.js` untuk memuat `npm run preview` atau static build.
3. Jalankan `electron` dan build dengan `electron-builder`.

> Opsi desktop ini **tidak dikonfigurasi** secara default. Jika Anda ingin saya siapkan konfigurasi Tauri/Electron, beri tahu opsi yang dipilih.

---

## Seed Database
```bash
node seed.js
```

---

## Catatan
- Logo lembaga disimpan di `static/uploads/`.
- Pastikan backup `local.db` secara berkala untuk keamanan data.

# pembayaran
