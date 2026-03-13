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

export const GET = async ({ locals }) => {
	if (locals.user?.role !== 'admin') {
		return new Response('Forbidden', { status: 403 });
	}

	const payload = await db.transaction(async (tx) => {
		const pembayaran = await tx.select().from(schema.pembayaran);
		const mutasi = await tx.select().from(schema.mutasiSaldoBendahara);
		const systemLogs = await tx.select().from(schema.systemLogs);
		const users = await tx.select().from(schema.users);
		const pengaturan = await tx.select().from(schema.pengaturanPesantren);
		const tahunAjaran = await tx.select().from(schema.tahunAjaran);
		const jenisPembayaran = await tx.select().from(schema.jenisPembayaran);
		const kategoriSantri = await tx.select().from(schema.kategoriSantri);
		const santri = await tx.select().from(schema.santri);
		const santriDetail = await tx.select().from(schema.santriDetail);
		const santriSmk = await tx.select().from(schema.santriSmk);
		const santriSmp = await tx.select().from(schema.santriSmp);
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
	});

	const json = JSON.stringify(payload, null, 2);

	return new Response(json, {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': 'attachment; filename="backup-transaksi.json"'
		}
	});
};
