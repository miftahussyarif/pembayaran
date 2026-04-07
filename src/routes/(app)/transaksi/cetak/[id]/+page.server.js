import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const trxId = Number(params.id);
	
	const [pembayaran] = await db.select().from(schema.pembayaran).where(eq(schema.pembayaran.id, trxId));
	if (!pembayaran) throw error(404, 'Transaksi tidak ditemukan');
	
	const [santri] = pembayaran.santriId
		? await db.select().from(schema.santri).where(eq(schema.santri.id, pembayaran.santriId))
		: [null];
	const [pembayarLain] = pembayaran.pembayarLainId
		? await db.select().from(schema.pembayarLain).where(eq(schema.pembayarLain.id, pembayaran.pembayarLainId))
		: [null];
	const [jenisPembayaran] = await db.select().from(schema.jenisPembayaran).where(eq(schema.jenisPembayaran.id, pembayaran.jenisPembayaranId));
	const [tahunAjaran] = await db.select().from(schema.tahunAjaran).where(eq(schema.tahunAjaran.id, pembayaran.tahunAjaranId));
	
	let petugas = 'Admin';
	let petugasSignatureUrl = '';
	if (pembayaran.inputById) {
		const [userRow] = await db.select().from(schema.users).where(eq(schema.users.id, pembayaran.inputById));
		if (userRow) {
			petugas = userRow.namaLengkap;
			petugasSignatureUrl = userRow.signatureUrl || '';
		}
	}
	
	return {
		pembayaran,
		santri,
		pembayarLain,
		jenisPembayaran,
		tahunAjaran,
		petugas,
		petugasSignatureUrl
	};
}
