import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const sqlite = new Database('local.db');
sqlite.pragma('journal_mode = WAL');
sqlite.exec(`
	CREATE TABLE IF NOT EXISTS mutasi_saldo_bendahara (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		bendahara_id INTEGER NOT NULL,
		nominal INTEGER NOT NULL,
		catatan TEXT,
		tanggal TEXT NOT NULL,
		input_by_id INTEGER,
		FOREIGN KEY (bendahara_id) REFERENCES users(id),
		FOREIGN KEY (input_by_id) REFERENCES users(id)
	);
	CREATE TABLE IF NOT EXISTS system_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		username TEXT,
		role TEXT,
		aksi TEXT NOT NULL,
		modul TEXT NOT NULL,
		keterangan TEXT,
		ip TEXT,
		created_at TEXT NOT NULL,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);
	CREATE TABLE IF NOT EXISTS santri_smk (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		santri_id INTEGER NOT NULL UNIQUE,
		start_month INTEGER NOT NULL,
		start_year INTEGER NOT NULL,
		end_month INTEGER,
		end_year INTEGER,
		FOREIGN KEY (santri_id) REFERENCES santri(id)
	);
	CREATE TABLE IF NOT EXISTS santri_smp (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		santri_id INTEGER NOT NULL UNIQUE,
		start_month INTEGER NOT NULL,
		start_year INTEGER NOT NULL,
		end_month INTEGER,
		end_year INTEGER,
		FOREIGN KEY (santri_id) REFERENCES santri(id)
	);
	CREATE TABLE IF NOT EXISTS santri_detail (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		santri_id INTEGER NOT NULL UNIQUE,
		tempat_lahir TEXT,
		tanggal_lahir TEXT,
		jenis_kelamin TEXT,
		golongan_darah TEXT,
		nik TEXT,
		no_kk TEXT,
		anak_ke INTEGER,
		jumlah_saudara INTEGER,
		tinggi_cm INTEGER,
		berat_kg INTEGER,
		alamat_lengkap TEXT,
		rt TEXT,
		rw TEXT,
		desa_kelurahan TEXT,
		kecamatan TEXT,
		kabupaten TEXT,
		provinsi TEXT,
		no_kip TEXT,
		no_kis_kps_pkh TEXT,
		kebutuhan_khusus TEXT,
		nama_ayah TEXT,
		tanggal_lahir_ayah TEXT,
		pendidikan_ayah TEXT,
		nik_ayah TEXT,
		alamat_ayah TEXT,
		no_hp_ayah TEXT,
		pekerjaan_ayah TEXT,
		penghasilan_ayah INTEGER,
		nama_ibu TEXT,
		tanggal_lahir_ibu TEXT,
		pendidikan_ibu TEXT,
		nik_ibu TEXT,
		alamat_ibu TEXT,
		pekerjaan_ibu TEXT,
		penghasilan_ibu INTEGER,
		FOREIGN KEY (santri_id) REFERENCES santri(id)
	);
`);

try {
	sqlite.exec(`ALTER TABLE users ADD COLUMN signature_url TEXT`);
} catch (e) {
	// column may already exist
}

try {
	sqlite.exec(`ALTER TABLE pengaturan_pesantren ADD COLUMN stamp_url TEXT`);
} catch (e) {
	// column may already exist
}

try {
	sqlite.exec(`ALTER TABLE pengaturan_pesantren ADD COLUMN telegram_bot_token TEXT`);
} catch (e) {
	// column may already exist
}

try {
	sqlite.exec(`ALTER TABLE pengaturan_pesantren ADD COLUMN telegram_chat_id TEXT`);
} catch (e) {
	// column may already exist
}

export const db = drizzle(sqlite, { schema });
