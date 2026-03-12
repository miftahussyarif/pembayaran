import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, isNotNull, desc } from 'drizzle-orm';

export async function load() {
	// Ambil data Dropdown
	const santris = await db
		.select({
			id: schema.santri.id,
			nomorInduk: schema.santri.nomorInduk,
			namaLengkap: schema.santri.namaLengkap,
			kategoriId: schema.santri.kategoriId,
			nominalSyahriyah: schema.kategoriSantri.nominalSyahriyah,
			namaKategori: schema.kategoriSantri.namaKategori
		})
		.from(schema.santri)
		.leftJoin(schema.kategoriSantri, eq(schema.santri.kategoriId, schema.kategoriSantri.id))
		.where(eq(schema.santri.isActive, true));
	const tahunAjarans = await db.select().from(schema.tahunAjaran);
	const jenisPembayarans = await db.select().from(schema.jenisPembayaran);

	// Ambil riwayat pembayaran terbaru (10 terakhir) - order by ID descending untuk yang terbaru di atas
	const riwayatData = await db.select().from(schema.pembayaran).orderBy(desc(schema.pembayaran.id)).limit(10);

	// Ambil semua pembayaran bulanan untuk validasi status
	const pembayaranBulanan = await db.select().from(schema.pembayaran).where(isNotNull(schema.pembayaran.bulan));

	return { santris, tahunAjarans, jenisPembayarans, riwayatData, pembayaranBulanan };
}

export const actions = {
	create: async ({ request, locals, getClientAddress }) => {
		try {
			const formData = await request.formData();
			const santriId = Number(formData.get('santriId'));
			const tahunAjaranId = Number(formData.get('tahunAjaranId'));
			const jenisPembayaranId = Number(formData.get('jenisPembayaranId'));
			let nominalDibayar = Number(formData.get('nominalDibayar'));
			const bulan = formData.get('bulan') || null;
			const inputById = locals.user?.id || null;

			// Validasi data dasar (nominal dicek setelah aturan syahriyah)
			if (!santriId || !tahunAjaranId || !jenisPembayaranId) {
				return {
					success: false,
					message: 'Data tidak lengkap'
				};
			}

			// Cek aturan: santri kategori yatim/gratis tidak boleh bayar SPP/Syahriyah (bulanan)
			const [santriRow] = await db
				.select({
					id: schema.santri.id,
					nominalSyahriyah: schema.kategoriSantri.nominalSyahriyah,
					namaKategori: schema.kategoriSantri.namaKategori
				})
				.from(schema.santri)
				.leftJoin(schema.kategoriSantri, eq(schema.santri.kategoriId, schema.kategoriSantri.id))
				.where(eq(schema.santri.id, santriId));

			const [jenisRow] = await db
				.select({
					tipe: schema.jenisPembayaran.tipe,
					namaPembayaran: schema.jenisPembayaran.namaPembayaran
				})
				.from(schema.jenisPembayaran)
				.where(eq(schema.jenisPembayaran.id, jenisPembayaranId));

			const isGratisSyahriyah = santriRow && santriRow.nominalSyahriyah === 0;
			const isYatim = /yatim/i.test(santriRow?.namaKategori || '');
			const isSyahriyah = !!jenisRow?.namaPembayaran && /syahriyah|spp/i.test(jenisRow.namaPembayaran);
			const isSmkSmpBulanan = jenisRow?.tipe === 'smk_bulanan' || jenisRow?.tipe === 'smp_bulanan';
			const isYatimGratisSmkSmp = isYatim && isSyahriyah && isSmkSmpBulanan;

			if (isSyahriyah) {
				nominalDibayar = santriRow?.nominalSyahriyah ?? 0;
			}
			if (isYatimGratisSmkSmp) {
				nominalDibayar = 0;
			}

			if (isGratisSyahriyah && jenisRow?.tipe === 'bulanan') {
				const labelKategori = santriRow.namaKategori ? ` (${santriRow.namaKategori})` : '';
				return {
					success: false,
					message: `Santri kategori gratis${labelKategori} tidak dapat melakukan pembayaran SPP/Syahriyah.`
				};
			}
			
			if (nominalDibayar <= 0 && !isYatimGratisSmkSmp) {
				return {
					success: false,
					message: 'Nominal harus lebih dari 0'
				};
			}

			// Generate No Kwitansi sederhana
			const nomorKwitansi = `KW-${Date.now()}`;
			const tanggalBayar = new Date().toISOString();

			// Insert pembayaran baru
			const pembayaranResult = await db.insert(schema.pembayaran).values({
				santriId,
				tahunAjaranId,
				jenisPembayaranId,
				bulan,
				nominalDibayar,
				tanggalBayar,
				nomorKwitansi,
				inputById
			}).returning();

			const newTrx = Array.isArray(pembayaranResult) ? pembayaranResult[0] : pembayaranResult;

			if (!newTrx || !newTrx.id) {
				return {
					success: false,
					message: 'Gagal membuat transaksi'
				};
			}

			console.log('✓ Transaksi berhasil disimpan:', newTrx.id);

			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'input',
					modul: 'transaksi',
					keterangan: `Input pembayaran ${newTrx.id} untuk santri ${santriId}`,
					ip: getClientAddress(),
					createdAt: new Date().toISOString()
				});
			} catch (e) {
				// ignore logging errors
			}

			// Return data id transaksi agar client yang melakukan navigasi
			return {
				success: true,
				id: newTrx.id
			};
		} catch (error) {
			console.error('❌ Error dalam create action:', error);
			
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan transaksi'
			};
		}
	}
};
