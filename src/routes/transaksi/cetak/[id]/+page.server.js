import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const trxId = Number(params.id);
	
	const [pembayaranAwal] = await db.select().from(schema.pembayaran).where(eq(schema.pembayaran.id, trxId));
	if (!pembayaranAwal) throw error(404, 'Transaksi tidak ditemukan');

	// Query SEMUA pembayaran dengan santri, tahun ajaran, dan tanggal bayar yang SAMA
	// Ini untuk menggabungkan batch payments menjadi 1 kwitansi
	const pembayaranList = await db
		.select({
			id: schema.pembayaran.id,
			santriId: schema.pembayaran.santriId,
			pembayarLainId: schema.pembayaran.pembayarLainId,
			jenisPembayaranId: schema.pembayaran.jenisPembayaranId,
			tahunAjaranId: schema.pembayaran.tahunAjaranId,
			bulan: schema.pembayaran.bulan,
			tahunTagihan: schema.pembayaran.tahunTagihan,
			tanggalBayar: schema.pembayaran.tanggalBayar,
			nominalDibayar: schema.pembayaran.nominalDibayar,
			nomorKwitansi: schema.pembayaran.nomorKwitansi,
			inputById: schema.pembayaran.inputById,
			keteranganKhusus: schema.pembayaran.keteranganKhusus,
			namaPembayaran: schema.jenisPembayaran.namaPembayaran
		})
		.from(schema.pembayaran)
		.leftJoin(schema.jenisPembayaran, eq(schema.pembayaran.jenisPembayaranId, schema.jenisPembayaran.id))
		.where(and(
			eq(schema.pembayaran.santriId, pembayaranAwal.santriId),
			eq(schema.pembayaran.tahunAjaranId, pembayaranAwal.tahunAjaranId),
			eq(schema.pembayaran.tanggalBayar, pembayaranAwal.tanggalBayar)
		));
	const pembayaran = pembayaranList[0];
	
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
		pembayaranList,
		totalNominal: pembayaranList.reduce((sum, item) => sum + Number(item.nominalDibayar || 0), 0),
		santri,
		pembayarLain,
		jenisPembayaran,
		tahunAjaran,
		petugas,
		petugasSignatureUrl
	};
}
