import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const BULAN_NAMES = [
	'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
	'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function inferTahunTagihan(tahunAjaranNama, bulan, tanggalBayar) {
	const fallbackYear = tanggalBayar ? new Date(tanggalBayar).getFullYear() : new Date().getFullYear();
	if (!bulan) return fallbackYear;

	const monthIndex = BULAN_NAMES.indexOf(bulan);
	const normalizedTahun = String(tahunAjaranNama || '').trim();
	const slashMatch = normalizedTahun.match(/^(\d{4})\s*\/\s*(\d{4})$/);
	if (slashMatch) {
		const startYear = Number(slashMatch[1]);
		const endYear = Number(slashMatch[2]);
		if (monthIndex >= 0 && monthIndex <= 5) return endYear;
		if (monthIndex >= 6) return startYear;
	}

	const directYearMatch = normalizedTahun.match(/(\d{4})/);
	if (directYearMatch) return Number(directYearMatch[1]);

	return fallbackYear;
}

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
	CREATE TABLE IF NOT EXISTS pembayar_lain (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		nama_pembayar TEXT NOT NULL,
		created_at TEXT NOT NULL
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

try {
	sqlite.exec(`ALTER TABLE pembayaran ADD COLUMN keterangan_khusus TEXT`);
} catch (e) {
	// column may already exist
}

try {
	sqlite.exec(`ALTER TABLE pembayaran ADD COLUMN pembayar_lain_id INTEGER REFERENCES pembayar_lain(id)`);
} catch (e) {
	// column may already exist
}

try {
	const pembayaranInfo = sqlite.prepare(`PRAGMA table_info(pembayaran)`).all();
	const santriIdColumn = pembayaranInfo.find((column) => column.name === 'santri_id');
	const hasPembayarLainId = pembayaranInfo.some((column) => column.name === 'pembayar_lain_id');

	if (santriIdColumn?.notnull === 1 || !hasPembayarLainId) {
		sqlite.exec(`
			BEGIN;
			CREATE TABLE pembayaran_migrasi (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				santri_id INTEGER,
				pembayar_lain_id INTEGER,
				jenis_pembayaran_id INTEGER NOT NULL,
				tahun_ajaran_id INTEGER NOT NULL,
				bulan TEXT,
				tahun_tagihan INTEGER,
				tanggal_bayar TEXT NOT NULL,
				nominal_dibayar INTEGER NOT NULL,
				nomor_kwitansi TEXT NOT NULL UNIQUE,
				input_by_id INTEGER,
				keterangan_khusus TEXT,
				FOREIGN KEY (santri_id) REFERENCES santri(id),
				FOREIGN KEY (pembayar_lain_id) REFERENCES pembayar_lain(id),
				FOREIGN KEY (jenis_pembayaran_id) REFERENCES jenis_pembayaran(id),
				FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id),
				FOREIGN KEY (input_by_id) REFERENCES users(id)
			);
			INSERT INTO pembayaran_migrasi (
				id, santri_id, pembayar_lain_id, jenis_pembayaran_id, tahun_ajaran_id, bulan,
				tahun_tagihan, tanggal_bayar, nominal_dibayar, nomor_kwitansi, input_by_id, keterangan_khusus
			)
			SELECT
				id, santri_id, pembayar_lain_id, jenis_pembayaran_id, tahun_ajaran_id, bulan,
				NULL, tanggal_bayar, nominal_dibayar, nomor_kwitansi, input_by_id, keterangan_khusus
			FROM pembayaran;
			DROP TABLE pembayaran;
			ALTER TABLE pembayaran_migrasi RENAME TO pembayaran;
			COMMIT;
		`);
	}
} catch (e) {
	try {
		sqlite.exec('ROLLBACK');
	} catch (rollbackError) {
		// ignore rollback errors
	}
	console.error('Migrasi tabel pembayaran gagal:', e);
}

try {
	sqlite.exec(`ALTER TABLE pembayaran ADD COLUMN tahun_tagihan INTEGER`);
} catch (e) {
	// column may already exist
}

try {
	const rows = sqlite.prepare(`
		SELECT p.id, p.bulan, p.tanggal_bayar, ta.nama AS tahun_ajaran_nama
		FROM pembayaran p
		LEFT JOIN tahun_ajaran ta ON ta.id = p.tahun_ajaran_id
		WHERE p.bulan IS NOT NULL AND p.tahun_tagihan IS NULL
	`).all();

	const updateStmt = sqlite.prepare(`UPDATE pembayaran SET tahun_tagihan = ? WHERE id = ?`);
	const updateMany = sqlite.transaction((items) => {
		for (const row of items) {
			const tahunTagihan = inferTahunTagihan(row.tahun_ajaran_nama, row.bulan, row.tanggal_bayar);
			updateStmt.run(tahunTagihan, row.id);
		}
	});

	if (rows.length > 0) {
		updateMany(rows);
	}
} catch (e) {
	console.error('Backfill tahun_tagihan gagal:', e);
}

export const db = drizzle(sqlite, { schema });
