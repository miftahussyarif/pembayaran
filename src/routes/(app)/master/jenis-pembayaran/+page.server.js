import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export async function load() {
	const jenisPembayarans = await db.select().from(schema.jenisPembayaran);
	return { jenisPembayarans };
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const namaPembayaran = data.get('namaPembayaran');
		const tipe = data.get('tipe');
		const nominalDefault = Number(data.get('nominalDefault'));

		await db.insert(schema.jenisPembayaran).values({ namaPembayaran, tipe, nominalDefault });
		return { success: true };
	},

	delete: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		await db.delete(schema.jenisPembayaran).where(eq(schema.jenisPembayaran.id, id));
		try {
			await db.insert(schema.systemLogs).values({
				userId: locals.user?.id || null,
				username: locals.user?.username || null,
				role: locals.user?.role || null,
				aksi: 'delete',
				modul: 'master-jenis-pembayaran',
				keterangan: `Hapus jenis pembayaran id=${id}`,
				ip: getClientAddress(),
				createdAt: new Date().toISOString()
			});
		} catch (e) {
			// ignore logging errors
		}
		return { success: true };
	}
};
