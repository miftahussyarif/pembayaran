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
`);

export const db = drizzle(sqlite, { schema });
