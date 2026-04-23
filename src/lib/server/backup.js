import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const UPLOADS_DIR = path.join('static', 'uploads');

const collectUploads = async (dir = UPLOADS_DIR, relativeDir = '') => {
	const files = [];

	try {
		const entries = await readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const nextRelative = relativeDir ? path.posix.join(relativeDir, entry.name) : entry.name;
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				files.push(...await collectUploads(fullPath, nextRelative));
				continue;
			}

			if (!entry.isFile()) continue;

			const buffer = await readFile(fullPath);
			files.push({
				path: `/uploads/${nextRelative}`,
				contentBase64: buffer.toString('base64')
			});
		}
	} catch (e) {
		// ignore missing uploads directory
	}

	return files;
};

export const generateBackup = async () => {
	const pembayaran = await db.select().from(schema.pembayaran);
	const pembayarLain = await db.select().from(schema.pembayarLain);
	const mutasi = await db.select().from(schema.mutasiSaldoBendahara);
	const systemLogs = await db.select().from(schema.systemLogs);
	const users = await db.select().from(schema.users);
	const loginAttempts = await db.select().from(schema.loginAttempts);
	const pengaturan = await db.select().from(schema.pengaturanPesantren);
	const tahunAjaran = await db.select().from(schema.tahunAjaran);
	const jenisPembayaran = await db.select().from(schema.jenisPembayaran);
	const kategoriSantri = await db.select().from(schema.kategoriSantri);
	const kategoriGratis = await db.select().from(schema.kategoriGratis);
	const santri = await db.select().from(schema.santri);
	const santriDetail = await db.select().from(schema.santriDetail);
	const santriSmk = await db.select().from(schema.santriSmk);
	const santriSmp = await db.select().from(schema.santriSmp);
	const santriKategoriTahun = await db.select().from(schema.santriKategoriTahun);
	const tunggakanImport = await db.select().from(schema.tunggakanImport);
	const files = await collectUploads();

	return {
		type: 'pesantren-backup',
		version: 5,
		exportedAt: new Date().toISOString(),
		data: {
			users,
			loginAttempts,
			pengaturan,
			tahunAjaran,
			jenisPembayaran,
			kategoriSantri,
			kategoriGratis,
			santri,
			santriDetail,
			santriSmk,
			santriSmp,
			santriKategoriTahun,
			tunggakanImport,
			pembayarLain,
			pembayaran,
			mutasi,
			systemLogs
		},
		files
	};
};

export const sendBackupToTelegram = async (token, chatId, backupData) => {
	const json = JSON.stringify(backupData, null, 2);
	const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
	
	console.log(`[Backup] Preparing to send backup to Telegram. Chat ID: ${chatId}, Filename: ${filename}`);

	const formData = new FormData();
	formData.append('chat_id', chatId);
	formData.append('caption', `Database Backup - ${new Date().toLocaleString('id-ID')}`);
	
	const blob = new Blob([json], { type: 'application/json' });
	formData.append('document', blob, filename);

	const url = `https://api.telegram.org/bot${token}/sendDocument`;
	
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

	try {
		console.log(`[Backup] Sending request to Telegram API...`);
		const response = await fetch(url, {
			method: 'POST',
			body: formData,
			signal: controller.signal
		});
		clearTimeout(timeout);

		const result = await response.json();
		console.log(`[Backup] Telegram API response:`, result.ok ? 'SUCCESS' : `FAILED: ${result.description}`);
		return result;
	} catch (error) {
		clearTimeout(timeout);
		console.error(`[Backup] Fetch error:`, error.name === 'AbortError' ? 'Timeout after 30s' : error.message);
		throw error;
	}
};

export const sendTelegramTextMessage = async (token, chatId, text) => {
	const url = `https://api.telegram.org/bot${token}/sendMessage`;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10000);

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				chat_id: chatId,
				text
			}),
			signal: controller.signal
		});
		clearTimeout(timeout);
		return await response.json();
	} catch (error) {
		clearTimeout(timeout);
		throw error;
	}
};
