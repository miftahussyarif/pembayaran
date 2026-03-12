import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

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
		const asArray = (value) => (Array.isArray(value) ? value : []);
		const users = asArray(backupData.users);
		const pengaturan = asArray(backupData.pengaturan);
		const tahunAjaran = asArray(backupData.tahunAjaran);
		const jenisPembayaran = asArray(backupData.jenisPembayaran);
		const kategoriSantri = asArray(backupData.kategoriSantri);
		const santri = asArray(backupData.santri);
		const santriSmk = asArray(backupData.santriSmk);
		const santriSmp = asArray(backupData.santriSmp);
		const pembayaran = asArray(backupData.pembayaran);
		const mutasi = asArray(backupData.mutasi);
		const systemLogs = asArray(backupData.systemLogs);

		const insertInBatches = async (tx, table, rows, batchSize = 100) => {
			for (let i = 0; i < rows.length; i += batchSize) {
				const batch = rows.slice(i, i + batchSize);
				await tx.insert(table).values(batch);
			}
		};

		try {
			await db.transaction(async (tx) => {
				await tx.delete(schema.pembayaran);
				await tx.delete(schema.mutasiSaldoBendahara);
				await tx.delete(schema.systemLogs);
				await tx.delete(schema.santriSmk);
				await tx.delete(schema.santriSmp);
				await tx.delete(schema.santri);
				await tx.delete(schema.kategoriSantri);
				await tx.delete(schema.jenisPembayaran);
				await tx.delete(schema.tahunAjaran);
				await tx.delete(schema.pengaturanPesantren);
				await tx.delete(schema.users);

				if (users.length) {
					await insertInBatches(tx, schema.users, users);
				}
				if (pengaturan.length) {
					await insertInBatches(tx, schema.pengaturanPesantren, pengaturan);
				}
				if (tahunAjaran.length) {
					await insertInBatches(tx, schema.tahunAjaran, tahunAjaran);
				}
				if (jenisPembayaran.length) {
					await insertInBatches(tx, schema.jenisPembayaran, jenisPembayaran);
				}
				if (kategoriSantri.length) {
					await insertInBatches(tx, schema.kategoriSantri, kategoriSantri);
				}
				if (santri.length) {
					await insertInBatches(tx, schema.santri, santri);
				}
				if (santriSmk.length) {
					await insertInBatches(tx, schema.santriSmk, santriSmk);
				}
				if (santriSmp.length) {
					await insertInBatches(tx, schema.santriSmp, santriSmp);
				}
				if (pembayaran.length) {
					await insertInBatches(tx, schema.pembayaran, pembayaran);
				}
				if (mutasi.length) {
					await insertInBatches(tx, schema.mutasiSaldoBendahara, mutasi);
				}
				if (systemLogs.length) {
					await insertInBatches(tx, schema.systemLogs, systemLogs);
				}
			});

			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'restore',
					modul: 'backup-restore',
					keterangan: `Restore backup: master(users=${users.length}, santri=${santri.length}, smk=${santriSmk.length}, smp=${santriSmp.length}), pembayaran=${pembayaran.length}, mutasi=${mutasi.length}`,
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
