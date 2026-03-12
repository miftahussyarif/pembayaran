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

		const users = Array.isArray(payload.data.users) ? payload.data.users : [];
		const pengaturan = Array.isArray(payload.data.pengaturan) ? payload.data.pengaturan : [];
		const tahunAjaran = Array.isArray(payload.data.tahunAjaran) ? payload.data.tahunAjaran : [];
		const jenisPembayaran = Array.isArray(payload.data.jenisPembayaran) ? payload.data.jenisPembayaran : [];
		const kategoriSantri = Array.isArray(payload.data.kategoriSantri) ? payload.data.kategoriSantri : [];
		const santri = Array.isArray(payload.data.santri) ? payload.data.santri : [];
		const santriSmk = Array.isArray(payload.data.santriSmk) ? payload.data.santriSmk : [];
		const santriSmp = Array.isArray(payload.data.santriSmp) ? payload.data.santriSmp : [];
		const pembayaran = Array.isArray(payload.data.pembayaran) ? payload.data.pembayaran : [];
		const mutasi = Array.isArray(payload.data.mutasi) ? payload.data.mutasi : [];
		const systemLogs = Array.isArray(payload.data.systemLogs) ? payload.data.systemLogs : [];

		try {
			await db.delete(schema.pembayaran);
			await db.delete(schema.mutasiSaldoBendahara);
			await db.delete(schema.systemLogs);
			await db.delete(schema.santriSmk);
			await db.delete(schema.santriSmp);
			await db.delete(schema.santri);
			await db.delete(schema.kategoriSantri);
			await db.delete(schema.jenisPembayaran);
			await db.delete(schema.tahunAjaran);
			await db.delete(schema.pengaturanPesantren);
			await db.delete(schema.users);

			if (users.length) {
				await db.insert(schema.users).values(users);
			}
			if (pengaturan.length) {
				await db.insert(schema.pengaturanPesantren).values(pengaturan);
			}
			if (tahunAjaran.length) {
				await db.insert(schema.tahunAjaran).values(tahunAjaran);
			}
			if (jenisPembayaran.length) {
				await db.insert(schema.jenisPembayaran).values(jenisPembayaran);
			}
			if (kategoriSantri.length) {
				await db.insert(schema.kategoriSantri).values(kategoriSantri);
			}
			if (santri.length) {
				await db.insert(schema.santri).values(santri);
			}
			if (santriSmk.length) {
				await db.insert(schema.santriSmk).values(santriSmk);
			}
			if (santriSmp.length) {
				await db.insert(schema.santriSmp).values(santriSmp);
			}
			if (pembayaran.length) {
				await db.insert(schema.pembayaran).values(pembayaran);
			}
			if (mutasi.length) {
				await db.insert(schema.mutasiSaldoBendahara).values(mutasi);
			}
			if (systemLogs.length) {
				await db.insert(schema.systemLogs).values(systemLogs);
			}

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
