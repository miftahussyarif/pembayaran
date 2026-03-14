import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, isNotNull, desc, and } from 'drizzle-orm';

export async function load() {
	// Ambil data Dropdown
	const santris = await db
		.select({
			id: schema.santri.id,
			nomorInduk: schema.santri.nomorInduk,
			namaLengkap: schema.santri.namaLengkap,
			kategoriId: schema.santri.kategoriId,
			nominalKonsumsi: schema.kategoriSantri.nominalKonsumsi,
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

	// Ambil pemetaan kategori gratis
	const kategoriGratis = await db.select().from(schema.kategoriGratis);

	// Cari/buat jenisPembayaran "Lain-lain" untuk pembayaran khusus
	let jenisKhusus = jenisPembayarans.find(j => j.tipe === 'sekali' && j.namaPembayaran === 'Pembayaran Lain-lain');
	if (!jenisKhusus) {
		try {
			const [created] = await db.insert(schema.jenisPembayaran).values({
				namaPembayaran: 'Pembayaran Lain-lain',
				tipe: 'sekali',
				nominalDefault: 0
			}).returning();
			jenisKhusus = created;
		} catch (e) {
			// Mungkin sudah ada
			jenisKhusus = (await db.select().from(schema.jenisPembayaran)).find(
				j => j.namaPembayaran === 'Pembayaran Lain-lain'
			);
		}
	}

	return {
		santris,
		tahunAjarans,
		jenisPembayarans,
		riwayatData,
		pembayaranBulanan,
		kategoriGratis,
		khususJenisId: jenisKhusus?.id || null
	};
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
			const keteranganKhusus = formData.get('keteranganKhusus')?.toString().trim() || null;
			const inputById = locals.user?.id || null;

			// Validasi data dasar
			if (!santriId || !tahunAjaranId || !jenisPembayaranId) {
				return {
					success: false,
					message: 'Data tidak lengkap'
				};
			}

			// Jika ini pembayaran khusus, gunakan nominal dari form langsung
			const isKhusus = !!keteranganKhusus;

			if (!isKhusus) {
				// Cek aturan kategori santri
				const [santriRow] = await db
					.select({
						id: schema.santri.id,
						kategoriId: schema.santri.kategoriId,
						nominalKonsumsi: schema.kategoriSantri.nominalKonsumsi,
						namaKategori: schema.kategoriSantri.namaKategori
					})
					.from(schema.santri)
					.leftJoin(schema.kategoriSantri, eq(schema.santri.kategoriId, schema.kategoriSantri.id))
					.where(eq(schema.santri.id, santriId));

				const [jenisRow] = await db
					.select({
						id: schema.jenisPembayaran.id,
						tipe: schema.jenisPembayaran.tipe,
						namaPembayaran: schema.jenisPembayaran.namaPembayaran,
						nominalDefault: schema.jenisPembayaran.nominalDefault
					})
					.from(schema.jenisPembayaran)
					.where(eq(schema.jenisPembayaran.id, jenisPembayaranId));

				// Cek apakah ada nominal khusus untuk kategori santri ini
				const [customNominalRow] = await db
					.select({ nominal: schema.kategoriGratis.nominal })
					.from(schema.kategoriGratis)
					.where(and(
						eq(schema.kategoriGratis.kategoriId, santriRow.kategoriId),
						eq(schema.kategoriGratis.jenisPembayaranId, jenisPembayaranId)
					));

				const hasCustomNominal = customNominalRow !== undefined;
				const customNominal = customNominalRow?.nominal;
				const isGratis = hasCustomNominal && customNominal === 0;

				if (hasCustomNominal && customNominal !== null) {
					nominalDibayar = customNominal;
				} else {
					// Fallback: untuk konsumsi gunakan nominalKonsumsi dari kategori, otherwise nominalDefault
					const isKonsumsi = !!jenisRow?.namaPembayaran && /konsumsi/i.test(jenisRow.namaPembayaran);

					if (isKonsumsi && santriRow?.nominalKonsumsi !== undefined) {
						nominalDibayar = santriRow.nominalKonsumsi;
					} else {
						nominalDibayar = jenisRow.nominalDefault;
					}
				}

				if (nominalDibayar <= 0 && !isGratis) {
					return {
						success: false,
						message: 'Nominal harus lebih dari 0'
					};
				}
			} else {
				if (nominalDibayar <= 0) {
					return {
						success: false,
						message: 'Nominal pembayaran lain-lain harus lebih dari 0'
					};
				}
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
				inputById,
				keteranganKhusus
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
					keterangan: `Input pembayaran ${newTrx.id} untuk santri ${santriId}${keteranganKhusus ? ` (Lain-lain: ${keteranganKhusus})` : ''}`,
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
