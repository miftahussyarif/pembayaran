import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const resolveUploadPath = (url) => {
	if (!url || typeof url !== 'string') return null;
	if (!url.startsWith('/uploads/')) return null;
	const filename = url.replace('/uploads/', '');
	if (!filename) return null;
	return path.join('static', 'uploads', filename);
};

const collectUploads = async (urls) => {
	const files = [];
	for (const url of urls) {
		const filePath = resolveUploadPath(url);
		if (!filePath) continue;
		try {
			await access(filePath);
			const buffer = await readFile(filePath);
			files.push({
				path: url,
				contentBase64: buffer.toString('base64')
			});
		} catch (e) {
			// ignore missing files
		}
	}
	return files;
};

export const generateBackup = async () => {
	const pembayaran = await db.select().from(schema.pembayaran);
	const mutasi = await db.select().from(schema.mutasiSaldoBendahara);
	const systemLogs = await db.select().from(schema.systemLogs);
	const users = await db.select().from(schema.users);
	const pengaturan = await db.select().from(schema.pengaturanPesantren);
	const tahunAjaran = await db.select().from(schema.tahunAjaran);
	const jenisPembayaran = await db.select().from(schema.jenisPembayaran);
	const kategoriSantri = await db.select().from(schema.kategoriSantri);
	const santri = await db.select().from(schema.santri);
	const santriDetail = await db.select().from(schema.santriDetail);
	const santriSmk = await db.select().from(schema.santriSmk);
	const santriSmp = await db.select().from(schema.santriSmp);
	const uploadUrls = [
		...pengaturan.map((p) => p.logoUrl).filter(Boolean),
		...pengaturan.map((p) => p.stampUrl).filter(Boolean),
		...users.map((u) => u.signatureUrl).filter(Boolean)
	];
	const files = await collectUploads(uploadUrls);

	return {
		type: 'pesantren-backup',
		version: 2,
		exportedAt: new Date().toISOString(),
		data: {
			users,
			pengaturan,
			tahunAjaran,
			jenisPembayaran,
			kategoriSantri,
			santri,
			santriDetail,
			santriSmk,
			santriSmp,
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
