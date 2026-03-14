import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';

export async function load() {
	const jenisPembayarans = await db.select().from(schema.jenisPembayaran);
	const kategoris = await db.select().from(schema.kategoriSantri);
	const kategoriGratis = await db.select().from(schema.kategoriGratis);
	return { jenisPembayarans, kategoris, kategoriGratis };
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

	update: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const namaPembayaran = data.get('namaPembayaran');
		const tipe = data.get('tipe');
		const nominalDefault = Number(data.get('nominalDefault'));

		await db.update(schema.jenisPembayaran)
			.set({ namaPembayaran, tipe, nominalDefault })
			.where(eq(schema.jenisPembayaran.id, id));

		// Update custom nominals per category
		const kategoris = await db.select().from(schema.kategoriSantri);
		for (const k of kategoris) {
			const customNominalStr = data.get(`nominal_kat_${k.id}`);
			if (customNominalStr !== null && customNominalStr !== '') {
				const customNominalValue = Number(customNominalStr);
				
				// Delete existing mapping
				await db.delete(schema.kategoriGratis)
					.where(and(
						eq(schema.kategoriGratis.jenisPembayaranId, id),
						eq(schema.kategoriGratis.kategoriId, k.id)
					));
				
				// Insert new mapping
				await db.insert(schema.kategoriGratis).values({
					jenisPembayaranId: id,
					kategoriId: k.id,
					nominal: customNominalValue
				});
			} else {
				// Remove custom nominal if cleared
				await db.delete(schema.kategoriGratis)
					.where(and(
						eq(schema.kategoriGratis.jenisPembayaranId, id),
						eq(schema.kategoriGratis.kategoriId, k.id)
					));
			}
		}

		return { success: true };
	},

	delete: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		
		// Delete related category mappings first
		await db.delete(schema.kategoriGratis).where(eq(schema.kategoriGratis.jenisPembayaranId, id));
		// Delete the payment type
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
