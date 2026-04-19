import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export async function load({ url, locals }) {
	// Filter opsional lewat query param
	const filterSantri = url.searchParams.get('santri') || '';
	const filterTahun = url.searchParams.get('tahun') || '';
	const mode = url.searchParams.get('mode') || 'detail'; // 'detail' atau 'per-kwitansi'

	// Ambil semua pembayaran dengan join
	const riwayat = await db
		.select({
			id: schema.pembayaran.id,
			jenisPembayaranId: schema.pembayaran.jenisPembayaranId,
			nomorKwitansi: schema.pembayaran.nomorKwitansi,
			tanggalBayar: schema.pembayaran.tanggalBayar,
			bulan: schema.pembayaran.bulan,
			tahunTagihan: schema.pembayaran.tahunTagihan,
			nominalDibayar: schema.pembayaran.nominalDibayar,
			santriId: schema.pembayaran.santriId,
			namaLengkap: schema.santri.namaLengkap,
			nomorInduk: schema.santri.nomorInduk,
			kategoriId: schema.santri.kategoriId,
			namaPembayarLain: schema.pembayarLain.namaPembayar,
			namaPembayaran: schema.jenisPembayaran.namaPembayaran,
			tipe: schema.jenisPembayaran.tipe,
			nominalDefault: schema.jenisPembayaran.nominalDefault,
			nominalKonsumsi: schema.kategoriSantri.nominalKonsumsi,
			tahunNama: schema.tahunAjaran.nama
		})
		.from(schema.pembayaran)
		.leftJoin(schema.santri, eq(schema.pembayaran.santriId, schema.santri.id))
		.leftJoin(schema.pembayarLain, eq(schema.pembayaran.pembayarLainId, schema.pembayarLain.id))
		.leftJoin(schema.kategoriSantri, eq(schema.santri.kategoriId, schema.kategoriSantri.id))
		.leftJoin(schema.jenisPembayaran, eq(schema.pembayaran.jenisPembayaranId, schema.jenisPembayaran.id))
		.leftJoin(schema.tahunAjaran, eq(schema.pembayaran.tahunAjaranId, schema.tahunAjaran.id))
		.orderBy(desc(schema.pembayaran.tanggalBayar));

	const gratisList = await db.select().from(schema.kategoriGratis);
	const getNominalTagihan = (row) => {
		const mapping = gratisList.find((item) => item.kategoriId === row.kategoriId && item.jenisPembayaranId === row.jenisPembayaranId);
		if (mapping && mapping.nominal !== null) return Number(mapping.nominal || 0);
		if (row.tipe === 'bulanan' && /konsumsi/i.test(row.namaPembayaran || '')) return Number(row.nominalKonsumsi || 0);
		return Number(row.nominalDefault || 0);
	};

	const totalTahunanByKey = new Map();
	for (const row of riwayat) {
		if (!row.santriId || !['tahunan', 'smk_tahunan', 'smp_tahunan'].includes(row.tipe || '')) continue;
		const key = `${row.santriId}:${row.jenisPembayaranId}:${row.tahunNama}`;
		totalTahunanByKey.set(key, (totalTahunanByKey.get(key) || 0) + Number(row.nominalDibayar || 0));
	}

	// Filter di sisi server setelah query
	const filtered = riwayat.map((r) => ({
		...r,
		namaPembayar: r.namaLengkap || r.namaPembayarLain || '-',
		statusPelunasan: (() => {
			if (!r.santriId || r.namaPembayarLain) return 'Lunas';
			if (['bulanan', 'smk_bulanan', 'smp_bulanan', 'sekali', 'smk_sekali', 'smp_sekali'].includes(r.tipe || '')) return 'Lunas';
			if (['tahunan', 'smk_tahunan', 'smp_tahunan'].includes(r.tipe || '')) {
				const key = `${r.santriId}:${r.jenisPembayaranId}:${r.tahunNama}`;
				return (totalTahunanByKey.get(key) || 0) >= getNominalTagihan(r) ? 'Lunas' : 'Belum Lunas';
			}
			return 'Lunas';
		})()
	})).filter(r => {
		const cocokSantri = filterSantri
			? (r.namaPembayar?.toLowerCase().includes(filterSantri.toLowerCase()) ||
			   r.nomorInduk?.includes(filterSantri))
			: true;
		const cocokTahun = filterTahun ? r.tahunNama === filterTahun : true;
		return cocokSantri && cocokTahun;
	});

	// Jika mode per-kwitansi, kelompokkan berdasarkan nomorKwitansi
	let displayData = filtered;
	if (mode === 'per-kwitansi') {
		const groupedByKwitansi = new Map();
		
		for (const row of filtered) {
			const kwitansiKey = row.nomorKwitansi;
			if (!groupedByKwitansi.has(kwitansiKey)) {
				groupedByKwitansi.set(kwitansiKey, {
					nomorKwitansi: row.nomorKwitansi,
					tanggalBayar: row.tanggalBayar,
					totalNominal: 0,
					items: [],
					namaPembayar: '',
					tahunNama: row.tahunNama,
					tahunAjaranId: row.tahunNama // for compatibility
				});
			}
			
			const group = groupedByKwitansi.get(kwitansiKey);
			group.totalNominal += row.nominalDibayar || 0;
			group.items.push({
				id: row.id,
				namaPembayaran: row.namaPembayaran,
				bulan: row.bulan,
				tahunTagihan: row.tahunTagihan,
				nominalDibayar: row.nominalDibayar,
				namaPembayar: row.namaPembayar
			});
			
			// Collect unique payers
			if (!group.namaPembayar.includes(row.namaPembayar)) {
				if (group.namaPembayar) {
					group.namaPembayar += ', ' + row.namaPembayar;
				} else {
					group.namaPembayar = row.namaPembayar;
				}
			}
		}
		
		// Convert map to array and sort by date
		displayData = Array.from(groupedByKwitansi.values()).sort((a, b) => {
			const dateA = new Date(a.tanggalBayar);
			const dateB = new Date(b.tanggalBayar);
			return dateB - dateA; // descending order
		});
	}

	// Daftar tahun untuk filter dropdown
	const tahunList = await db.select().from(schema.tahunAjaran).orderBy(desc(schema.tahunAjaran.nama));

	return {
		riwayat: displayData,
		tahunList,
		filterSantri,
		filterTahun,
		mode,
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
