import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export async function load() {
	const kategoris = await db.select().from(schema.kategoriSantri).orderBy(schema.kategoriSantri.id);
	return { kategoris };
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const namaKategori = data.get('namaKategori')?.toString().trim();
		const nominalSyahriyah = Number(data.get('nominalSyahriyah') || 0);
		const nominalKonsumsi = Number(data.get('nominalKonsumsi') || 0);

		if (!namaKategori) return { success: false, error: 'Nama kategori wajib diisi.' };

		try {
			await db.insert(schema.kategoriSantri).values({ namaKategori, nominalSyahriyah, nominalKonsumsi });
			return { success: true };
		} catch (error) {
			return { success: false, error: 'Kategori gagal ditambahkan (mungkin nama sudah ada).' };
		}
	},

	update: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const namaKategori = data.get('namaKategori')?.toString().trim();
		const nominalSyahriyah = Number(data.get('nominalSyahriyah') || 0);
		const nominalKonsumsi = Number(data.get('nominalKonsumsi') || 0);

		if (!namaKategori) return { success: false, error: 'Nama kategori wajib diisi.' };

		try {
			await db.update(schema.kategoriSantri)
				.set({ namaKategori, nominalSyahriyah, nominalKonsumsi })
				.where(eq(schema.kategoriSantri.id, id));
			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'update',
					modul: 'master-kategori-santri',
					keterangan: `Update kategori id=${id} (${namaKategori})`,
					ip: getClientAddress(),
					createdAt: new Date().toISOString()
				});
			} catch (e) {
				// ignore logging errors
			}
			return { success: true };
		} catch (error) {
			return { success: false, error: 'Gagal memperbarui kategori.' };
		}
	},

	delete: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		try {
			await db.delete(schema.kategoriSantri).where(eq(schema.kategoriSantri.id, id));
			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'delete',
					modul: 'master-kategori-santri',
					keterangan: `Hapus kategori id=${id}`,
					ip: getClientAddress(),
					createdAt: new Date().toISOString()
				});
			} catch (e) {
				// ignore logging errors
			}
			return { success: true };
		} catch (error) {
			return { success: false, error: 'Gagal hapus kategori. Mungkin masih digunakan oleh data santri.' };
		}
	}
};
