import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export async function load({ url, locals }) {
	// Filter opsional lewat query param
	const filterSantri = url.searchParams.get('santri') || '';
	const filterTahun = url.searchParams.get('tahun') || '';

	// Ambil semua pembayaran dengan join
	const riwayat = await db
		.select({
			id: schema.pembayaran.id,
			nomorKwitansi: schema.pembayaran.nomorKwitansi,
			tanggalBayar: schema.pembayaran.tanggalBayar,
			bulan: schema.pembayaran.bulan,
			nominalDibayar: schema.pembayaran.nominalDibayar,
			santriId: schema.pembayaran.santriId,
			namaLengkap: schema.santri.namaLengkap,
			nomorInduk: schema.santri.nomorInduk,
			namaPembayaran: schema.jenisPembayaran.namaPembayaran,
			tahunNama: schema.tahunAjaran.nama
		})
		.from(schema.pembayaran)
		.leftJoin(schema.santri, eq(schema.pembayaran.santriId, schema.santri.id))
		.leftJoin(schema.jenisPembayaran, eq(schema.pembayaran.jenisPembayaranId, schema.jenisPembayaran.id))
		.leftJoin(schema.tahunAjaran, eq(schema.pembayaran.tahunAjaranId, schema.tahunAjaran.id))
		.orderBy(desc(schema.pembayaran.tanggalBayar));

	// Filter di sisi server setelah query
	const filtered = riwayat.filter(r => {
		const cocokSantri = filterSantri
			? (r.namaLengkap?.toLowerCase().includes(filterSantri.toLowerCase()) ||
			   r.nomorInduk?.includes(filterSantri))
			: true;
		const cocokTahun = filterTahun ? r.tahunNama === filterTahun : true;
		return cocokSantri && cocokTahun;
	});

	// Daftar tahun untuk filter dropdown
	const tahunList = await db.select().from(schema.tahunAjaran).orderBy(desc(schema.tahunAjaran.nama));

	return {
		riwayat: filtered,
		tahunList,
		filterSantri,
		filterTahun,
		isAdmin: locals.user?.role === 'admin'
	};
}

export const actions = {
	deleteRiwayat: async ({ request, locals }) => {
		// Hanya admin yang boleh hapus
		if (locals.user?.role !== 'admin') {
			return { type: 'error', message: 'Akses ditolak. Hanya admin yang dapat menghapus riwayat.' };
		}

		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) return { type: 'error', message: 'ID tidak valid.' };

		try {
			await db.delete(schema.pembayaran).where(eq(schema.pembayaran.id, id));
			return { type: 'success', message: 'Riwayat pembayaran berhasil dihapus.' };
		} catch (e) {
			console.error('Error deleting pembayaran:', e);
			return { type: 'error', message: 'Gagal menghapus riwayat pembayaran.' };
		}
	}
};
