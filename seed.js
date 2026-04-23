import 'dotenv/config';
import fs from 'node:fs/promises';
import { db } from './src/lib/server/db/index.js';
import * as schema from './src/lib/server/db/schema.js';

const DEFAULT_BACKUP_PATH = '/backupdb.json';

function getBackupPath() {
	return process.env.SEED_BACKUP_PATH || process.argv[2] || DEFAULT_BACKUP_PATH;
}

function ensureArray(value) {
	return Array.isArray(value) ? value : [];
}

function sanitizeRecords(records, omittedKeys = []) {
	return ensureArray(records).map((record) => {
		const next = { ...record };

		for (const key of omittedKeys) {
			delete next[key];
		}

		return next;
	});
}

async function safeDelete(table, label) {
	try {
		await db.delete(table);
	} catch (error) {
		console.log(`Skip delete ${label}: ${error.message}`);
	}
}

async function insertIfAny(table, records, label, omittedKeys = []) {
	const sanitized = sanitizeRecords(records, omittedKeys);

	if (!sanitized.length) {
		console.log(`- ${label}: 0 data`);
		return;
	}

	await db.insert(table).values(sanitized);
	console.log(`- ${label}: ${sanitized.length} data`);
}

async function loadBackup(backupPath) {
	const raw = await fs.readFile(backupPath, 'utf8');
	const parsed = JSON.parse(raw);

	if (parsed?.type !== 'pesantren-backup' || !parsed?.data) {
		throw new Error('Format backup tidak valid.');
	}

	return parsed;
}

async function seed() {
	const backupPath = getBackupPath();
	console.log(`🌱 Seeding database from ${backupPath}`);

	const backup = await loadBackup(backupPath);
	const data = backup.data ?? {};

	const normalized = {
		users: ensureArray(data.users),
		pengaturanPesantren: ensureArray(data.pengaturanPesantren ?? data.pengaturan),
		tahunAjaran: ensureArray(data.tahunAjaran),
		jenisPembayaran: ensureArray(data.jenisPembayaran),
		kategoriSantri: ensureArray(data.kategoriSantri),
		santri: ensureArray(data.santri),
		santriDetail: ensureArray(data.santriDetail),
		santriSmk: ensureArray(data.santriSmk),
		santriSmp: ensureArray(data.santriSmp),
		kategoriGratis: ensureArray(data.kategoriGratis),
		pembayarLain: ensureArray(data.pembayarLain),
		tunggakanImport: ensureArray(data.tunggakanImport),
		pembayaran: ensureArray(data.pembayaran),
		mutasiSaldoBendahara: ensureArray(data.mutasiSaldoBendahara ?? data.mutasi),
		systemLogs: ensureArray(data.systemLogs),
		loginAttempts: ensureArray(data.loginAttempts)
    santriKategoriTahun: ensureArray(data.santriKategoriTahun),
	};

	await safeDelete(schema.loginAttempts, 'login_attempts');
	await safeDelete(schema.systemLogs, 'system_logs');
	await safeDelete(schema.mutasiSaldoBendahara, 'mutasi_saldo_bendahara');
	await safeDelete(schema.tunggakanImport, 'tunggakan_import');
	await safeDelete(schema.pembayaran, 'pembayaran');
	await safeDelete(schema.pembayarLain, 'pembayar_lain');
	await safeDelete(schema.santriSmk, 'santri_smk');
	await safeDelete(schema.santriSmp, 'santri_smp');
	await safeDelete(schema.santriDetail, 'santri_detail');
	await safeDelete(schema.kategoriGratis, 'kategori_gratis');
	await safeDelete(schema.santri, 'santri');
	await safeDelete(schema.kategoriSantri, 'kategori_santri');
	await safeDelete(schema.jenisPembayaran, 'jenis_pembayaran');
	await safeDelete(schema.tahunAjaran, 'tahun_ajaran');
	await safeDelete(schema.users, 'users');
	await safeDelete(schema.pengaturanPesantren, 'pengaturan_pesantren');

  // Hapus tabel relasi baru
  await safeDelete(schema.santriKategoriTahun, 'santri_kategori_tahun');

	await insertIfAny(schema.users, normalized.users, 'users');
	await insertIfAny(schema.pengaturanPesantren, normalized.pengaturanPesantren, 'pengaturan_pesantren');
	await insertIfAny(schema.tahunAjaran, normalized.tahunAjaran, 'tahun_ajaran');
	await insertIfAny(schema.jenisPembayaran, normalized.jenisPembayaran, 'jenis_pembayaran');
	await insertIfAny(schema.kategoriSantri, normalized.kategoriSantri, 'kategori_santri');
	await insertIfAny(schema.santri, normalized.santri, 'santri');
	await insertIfAny(schema.santriDetail, normalized.santriDetail, 'santri_detail');
	await insertIfAny(schema.santriSmk, normalized.santriSmk, 'santri_smk');
	await insertIfAny(schema.santriSmp, normalized.santriSmp, 'santri_smp');
	await insertIfAny(schema.kategoriGratis, normalized.kategoriGratis, 'kategori_gratis');
	await insertIfAny(schema.pembayarLain, normalized.pembayarLain, 'pembayar_lain');
	await insertIfAny(schema.tunggakanImport, normalized.tunggakanImport, 'tunggakan_import');
	await insertIfAny(schema.pembayaran, normalized.pembayaran, 'pembayaran');
	await insertIfAny(schema.mutasiSaldoBendahara, normalized.mutasiSaldoBendahara, 'mutasi_saldo_bendahara');
	await insertIfAny(schema.systemLogs, normalized.systemLogs, 'system_logs');
	await insertIfAny(schema.loginAttempts, normalized.loginAttempts, 'login_attempts');

  // Insert tabel relasi baru
  await insertIfAny(schema.santriKategoriTahun, normalized.santriKategoriTahun, 'santri_kategori_tahun');

	console.log('✅ Database seeded!');
	process.exit(0);
}

seed().catch((error) => {
	console.error('Seed error:', error);
	process.exit(1);
});
