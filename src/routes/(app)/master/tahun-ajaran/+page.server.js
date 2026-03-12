import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export async function load() {
	const tahunAjarans = await db.select().from(schema.tahunAjaran);
	return { tahunAjarans };
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const nama = data.get('nama');
		const isActive = data.get('isActive') === 'on';

		if (isActive) {
			await db.update(schema.tahunAjaran).set({ isActive: false });
		}

		await db.insert(schema.tahunAjaran).values({ nama, isActive });
		return { success: true };
	},

	toggleAktif: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));

		const [current] = await db.select().from(schema.tahunAjaran).where(eq(schema.tahunAjaran.id, id));
		if (!current) return { success: false };

		if (!current.isActive) {
			await db.update(schema.tahunAjaran).set({ isActive: false });
			await db.update(schema.tahunAjaran).set({ isActive: true }).where(eq(schema.tahunAjaran.id, id));
		} else {
			await db.update(schema.tahunAjaran).set({ isActive: false }).where(eq(schema.tahunAjaran.id, id));
		}

		try {
			await db.insert(schema.systemLogs).values({
				userId: locals.user?.id || null,
				username: locals.user?.username || null,
				role: locals.user?.role || null,
				aksi: 'update',
				modul: 'master-tahun-ajaran',
				keterangan: `Toggle aktif tahun ajaran id=${id} -> ${!current.isActive}`,
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
		if (!id) return { type: 'error', message: 'ID tidak valid.' };

		try {
			// Hapus data pembayaran yang terkait dulu (cascade manual karena SQLite FK constraint)
			await db.delete(schema.pembayaran).where(eq(schema.pembayaran.tahunAjaranId, id));
			// Kemudian hapus tahun ajarannya
			await db.delete(schema.tahunAjaran).where(eq(schema.tahunAjaran.id, id));
			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'delete',
					modul: 'master-tahun-ajaran',
					keterangan: `Hapus tahun ajaran id=${id}`,
					ip: getClientAddress(),
					createdAt: new Date().toISOString()
				});
			} catch (e) {
				// ignore logging errors
			}
			return { success: true, message: 'Tahun ajaran berhasil dihapus.' };
		} catch (e) {
			console.error('Error deleting tahun ajaran:', e);
			return { type: 'error', message: 'Gagal menghapus tahun ajaran: ' + e.message };
		}
	}
};
