import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const resolveUploadPath = (url) => {
	if (!url || typeof url !== 'string') return null;
	if (!url.startsWith('/uploads/')) return null;
	const filename = url.replace('/uploads/', '');
	if (!filename) return null;
	return path.join('static', 'uploads', filename);
};

export const load = async ({ locals }) => {
	if (locals.user?.role !== 'admin') {
		throw redirect(303, '/');
	}
	return {};
};

export const actions = {
	restore: async ({ request, locals, getClientAddress }) => {
		if (locals.user?.role !== 'admin') {
			throw redirect(303, '/');
		}

		const data = await request.formData();
		const password = data.get('password')?.toString() || '';
		const file = data.get('backup');

		if (!password) {
			return { type: 'error', message: 'Password admin wajib diisi.' };
		}
		if (!file || typeof file === 'string') {
			return { type: 'error', message: 'File backup wajib dipilih.' };
		}

		const [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.id, locals.user.id));
		if (!user) {
			return { type: 'error', message: 'User admin tidak ditemukan.' };
		}

		const isValid = await bcrypt.compare(password, user.passwordHash);
		if (!isValid) {
			return { type: 'error', message: 'Password admin salah.' };
		}

		let payload;
		try {
			const text = await file.text();
			payload = JSON.parse(text);
		} catch (e) {
			return { type: 'error', message: 'File backup tidak valid.' };
		}

		if (!payload || payload.type !== 'pesantren-backup' || !payload.data) {
			return { type: 'error', message: 'Format backup tidak dikenali.' };
		}

		const backupData = payload.data || {};
		const backupFiles = Array.isArray(payload.files) ? payload.files : [];
		const asArray = (value) => (Array.isArray(value) ? value : []);
		const users = asArray(backupData.users);
		const pengaturan = asArray(backupData.pengaturan);
		const tahunAjaran = asArray(backupData.tahunAjaran);
		const jenisPembayaran = asArray(backupData.jenisPembayaran);
		const kategoriSantri = asArray(backupData.kategoriSantri);
		const santri = asArray(backupData.santri);
		const santriDetail = asArray(backupData.santriDetail);
		const santriSmk = asArray(backupData.santriSmk);
		const santriSmp = asArray(backupData.santriSmp);
		const pembayaran = asArray(backupData.pembayaran);
		const mutasi = asArray(backupData.mutasi);
		const systemLogs = asArray(backupData.systemLogs);

		const insertInBatches = (tx, table, rows, batchSize = 100) => {
			for (let i = 0; i < rows.length; i += batchSize) {
				const batch = rows.slice(i, i + batchSize);
				tx.insert(table).values(batch).run();
			}
		};

		try {
			db.transaction((tx) => {
				tx.delete(schema.pembayaran).run();
				tx.delete(schema.mutasiSaldoBendahara).run();
				tx.delete(schema.systemLogs).run();
				tx.delete(schema.santriSmk).run();
				tx.delete(schema.santriSmp).run();
				tx.delete(schema.santriDetail).run();
				tx.delete(schema.santri).run();
				tx.delete(schema.kategoriSantri).run();
				tx.delete(schema.jenisPembayaran).run();
				tx.delete(schema.tahunAjaran).run();
				tx.delete(schema.pengaturanPesantren).run();
				tx.delete(schema.users).run();

				if (users.length) {
					insertInBatches(tx, schema.users, users);
				}
				if (pengaturan.length) {
					insertInBatches(tx, schema.pengaturanPesantren, pengaturan);
				}
				if (tahunAjaran.length) {
					insertInBatches(tx, schema.tahunAjaran, tahunAjaran);
				}
				if (jenisPembayaran.length) {
					insertInBatches(tx, schema.jenisPembayaran, jenisPembayaran);
				}
				if (kategoriSantri.length) {
					insertInBatches(tx, schema.kategoriSantri, kategoriSantri);
				}
				if (santri.length) {
					insertInBatches(tx, schema.santri, santri);
				}
				if (santriDetail.length) {
					insertInBatches(tx, schema.santriDetail, santriDetail);
				}
				if (santriSmk.length) {
					insertInBatches(tx, schema.santriSmk, santriSmk);
				}
				if (santriSmp.length) {
					insertInBatches(tx, schema.santriSmp, santriSmp);
				}
				if (pembayaran.length) {
					insertInBatches(tx, schema.pembayaran, pembayaran);
				}
				if (mutasi.length) {
					insertInBatches(tx, schema.mutasiSaldoBendahara, mutasi);
				}
				if (systemLogs.length) {
					insertInBatches(tx, schema.systemLogs, systemLogs);
				}
			});

			if (backupFiles.length) {
				const uploadsDir = path.join('static', 'uploads');
				await mkdir(uploadsDir, { recursive: true });
				for (const file of backupFiles) {
					const filePath = resolveUploadPath(file?.path);
					if (!filePath || !file?.contentBase64) continue;
					const buffer = Buffer.from(file.contentBase64, 'base64');
					await writeFile(filePath, buffer);
				}
			}

			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'restore',
					modul: 'backup-restore',
					keterangan: `Restore backup: master(users=${users.length}, santri=${santri.length}, santri_detail=${santriDetail.length}, smk=${santriSmk.length}, smp=${santriSmp.length}), pembayaran=${pembayaran.length}, mutasi=${mutasi.length}, files=${backupFiles.length}`,
					ip: getClientAddress(),
					createdAt: new Date().toISOString()
				});
			} catch (e) {
				// ignore logging errors
			}

			return { type: 'success', message: 'Restore berhasil. Data transaksi dan mutasi diganti sesuai backup.' };
		} catch (e) {
			return { type: 'error', message: 'Gagal restore database.' };
		}
	}
};
