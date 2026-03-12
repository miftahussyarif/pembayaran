import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export async function load() {
	const santris = await db.select().from(schema.santri);
	const kategoris = await db.select().from(schema.kategoriSantri).orderBy(schema.kategoriSantri.namaKategori);
	return { santris, kategoris };
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const nomorInduk = data.get('nomorInduk');
		const namaLengkap = data.get('namaLengkap');
		const tanggalMasuk = data.get('tanggalMasuk') || null;
		const tanggalKeluar = data.get('tanggalKeluar') || null;
		const kategoriId = data.get('kategoriId') ? Number(data.get('kategoriId')) : null;
		const isActive = data.get('isActive') === 'on';

		try {
			await db.insert(schema.santri).values({ nomorInduk, namaLengkap, tanggalMasuk, tanggalKeluar, kategoriId, isActive });
			return { success: true };
		} catch (error) {
			return { success: false, error: 'Gagal menambah, mungkin nomor induk sudah ada.' };
		}
	},

	update: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const nomorInduk = data.get('nomorInduk')?.toString().trim();
		const namaLengkap = data.get('namaLengkap')?.toString().trim();
		const tanggalMasuk = data.get('tanggalMasuk') || null;
		const tanggalKeluar = data.get('tanggalKeluar') || null;
		const kategoriId = data.get('kategoriId') ? Number(data.get('kategoriId')) : null;
		const isActive = data.get('isActive') === 'on';

		try {
			await db.update(schema.santri)
				.set({ nomorInduk, namaLengkap, tanggalMasuk, tanggalKeluar, kategoriId, isActive })
				.where(eq(schema.santri.id, id));
			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'update',
					modul: 'master-santri',
					keterangan: `Update santri id=${id} (${namaLengkap})`,
					ip: getClientAddress(),
					createdAt: new Date().toISOString()
				});
			} catch (e) {
				// ignore logging errors
			}
			return { success: true };
		} catch (error) {
			return { success: false, error: 'Gagal memperbarui data santri.' };
		}
	},

	toggleAktif: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));

		const [current] = await db.select().from(schema.santri).where(eq(schema.santri.id, id));
		if (!current) return { success: false };

		await db.update(schema.santri).set({ isActive: !current.isActive }).where(eq(schema.santri.id, id));
		try {
			await db.insert(schema.systemLogs).values({
				userId: locals.user?.id || null,
				username: locals.user?.username || null,
				role: locals.user?.role || null,
				aksi: 'update',
				modul: 'master-santri',
				keterangan: `Toggle aktif santri id=${id} -> ${!current.isActive}`,
				ip: getClientAddress(),
				createdAt: new Date().toISOString()
			});
		} catch (e) {
			// ignore logging errors
		}
		return { success: true };
	},

	delete: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		await db.delete(schema.santri).where(eq(schema.santri.id, id));
		try {
			await db.insert(schema.systemLogs).values({
				userId: locals.user?.id || null,
				username: locals.user?.username || null,
				role: locals.user?.role || null,
				aksi: 'delete',
				modul: 'master-santri',
				keterangan: `Hapus santri id=${id}`,
				ip: getClientAddress(),
				createdAt: new Date().toISOString()
			});
		} catch (e) {
			// ignore logging errors
		}
		return { success: true };
	}
};
