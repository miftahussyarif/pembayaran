import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, isNotNull, desc, and } from 'drizzle-orm';

const BULAN_NAMES = [
	'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
	'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function inferTahunTagihan(tahunAjaranNama, bulan, tanggalBayar = new Date().toISOString()) {
	const fallbackYear = tanggalBayar ? new Date(tanggalBayar).getFullYear() : new Date().getFullYear();
	if (!bulan) return fallbackYear;

	const monthIndex = BULAN_NAMES.indexOf(bulan);
	const normalizedTahun = String(tahunAjaranNama || '').trim();
	const slashMatch = normalizedTahun.match(/^(\d{4})\s*\/\s*(\d{4})$/);
	if (slashMatch) {
		const startYear = Number(slashMatch[1]);
		const endYear = Number(slashMatch[2]);
		if (monthIndex >= 0 && monthIndex <= 5) return endYear;
		if (monthIndex >= 6) return startYear;
	}

	const directYearMatch = normalizedTahun.match(/(\d{4})/);
	if (directYearMatch) return Number(directYearMatch[1]);

	return fallbackYear;
}

function getEffectiveNominal({ santriRow, jenisRow, customNominalRow }) {
	const hasCustomNominal = customNominalRow !== undefined;
	const customNominal = customNominalRow?.nominal;
	const isGratis = hasCustomNominal && customNominal === 0;

	if (hasCustomNominal && customNominal !== null) {
		return {
			nominal: customNominal,
			isGratis
		};
	}

	const isKonsumsi = !!jenisRow?.namaPembayaran && /konsumsi/i.test(jenisRow.namaPembayaran);
	if (isKonsumsi && santriRow?.nominalKonsumsi !== undefined) {
		return {
			nominal: santriRow.nominalKonsumsi,
			isGratis: santriRow.nominalKonsumsi === 0
		};
	}

	return {
		nominal: jenisRow?.nominalDefault ?? 0,
		isGratis: (jenisRow?.nominalDefault ?? 0) === 0
	};
}

const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

async function getImportedTagihan({
	santriId,
	tahunAjaranId,
	jenisPembayaranId,
	bulan = null,
	tahunTagihan = null,
	keteranganKhusus = null
}) {
	const rows = await db
		.select({
			nominalTagihan: schema.tunggakanImport.nominalTagihan,
			bulan: schema.tunggakanImport.bulan,
			tahunTagihan: schema.tunggakanImport.tahunTagihan,
			keteranganKhusus: schema.tunggakanImport.keteranganKhusus
		})
		.from(schema.tunggakanImport)
		.where(and(
			eq(schema.tunggakanImport.santriId, santriId),
			eq(schema.tunggakanImport.tahunAjaranId, tahunAjaranId),
			eq(schema.tunggakanImport.jenisPembayaranId, jenisPembayaranId)
		));

	return rows.filter((item) => {
		const sameBulan = String(item.bulan || '') === String(bulan || '');
		const sameTahun = String(item.tahunTagihan || '') === String(tahunTagihan || '');
		const sameKeterangan = normalizeText(item.keteranganKhusus) === normalizeText(keteranganKhusus);
		return sameBulan && sameTahun && sameKeterangan;
	});
}

async function validateAndNormalizePaymentItem(rawItem, previouslyNormalizedItems = []) {
	const santriId = rawItem.santriId ? Number(rawItem.santriId) : null;
	const tahunAjaranId = Number(rawItem.tahunAjaranId);
	const jenisPembayaranId = Number(rawItem.jenisPembayaranId);
	const bulan = rawItem.bulan || null;
	const tahunTagihanRaw = rawItem.tahunTagihan ? String(rawItem.tahunTagihan).trim() : '';
	const keteranganKhusus = rawItem.keteranganKhusus ? String(rawItem.keteranganKhusus).trim() : null;
	const namaPembayarManual = rawItem.namaPembayarManual ? String(rawItem.namaPembayarManual).trim() : '';
	let nominalDibayar = Number(rawItem.nominalDibayar);

	if (!tahunAjaranId || !jenisPembayaranId) {
		return { error: 'Data pembayaran tidak lengkap.' };
	}

	const isKhusus = !!keteranganKhusus;
	if (isKhusus) {
		if (!santriId && !namaPembayarManual) {
			return { error: 'Pembayaran lain-lain harus memiliki santri atau nama pembayar.' };
		}
		if (!nominalDibayar || Number.isNaN(nominalDibayar) || nominalDibayar <= 0) {
			return { error: 'Nominal pembayaran lain-lain harus lebih dari 0.' };
		}

		if (santriId) {
			const importedRows = await getImportedTagihan({
				santriId,
				tahunAjaranId,
				jenisPembayaranId,
				keteranganKhusus
			});
			const importedTotal = importedRows.reduce((sum, item) => sum + Number(item.nominalTagihan || 0), 0);
			if (importedTotal > 0) {
				const existingSpecialPayments = await db
					.select({
						nominalDibayar: schema.pembayaran.nominalDibayar,
						keteranganKhusus: schema.pembayaran.keteranganKhusus
					})
					.from(schema.pembayaran)
					.where(and(
						eq(schema.pembayaran.santriId, santriId),
						eq(schema.pembayaran.tahunAjaranId, tahunAjaranId),
						eq(schema.pembayaran.jenisPembayaranId, jenisPembayaranId)
					));

				const totalSudahDibayar = existingSpecialPayments
					.filter((item) => normalizeText(item.keteranganKhusus) === normalizeText(keteranganKhusus))
					.reduce((sum, item) => sum + Number(item.nominalDibayar || 0), 0);
				const totalDariBatch = previouslyNormalizedItems
					.filter((item) =>
						item.santriId === santriId &&
						item.tahunAjaranId === tahunAjaranId &&
						item.jenisPembayaranId === jenisPembayaranId &&
						normalizeText(item.keteranganKhusus) === normalizeText(keteranganKhusus)
					)
					.reduce((sum, item) => sum + Number(item.nominalDibayar || 0), 0);
				const sisaTagihan = Math.max(0, importedTotal - totalSudahDibayar - totalDariBatch);

				if (sisaTagihan <= 0) {
					return { error: `Tagihan custom "${keteranganKhusus}" sudah lunas.` };
				}
				if (nominalDibayar > sisaTagihan) {
					return {
						error: `Nominal melebihi sisa tagihan custom. Sisa ${keteranganKhusus}: Rp ${sisaTagihan.toLocaleString('id-ID')}.`
					};
				}
			}
		}

		return {
			row: {
				santriId,
				tahunAjaranId,
				jenisPembayaranId,
				bulan: null,
				tahunTagihan: null,
				nominalDibayar,
				keteranganKhusus,
				namaPembayarManual
			}
		};
	}

	if (!santriId) {
		return { error: 'Pembayaran reguler harus terhubung ke data santri.' };
	}

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

	const [tahunAjaranRow] = await db
		.select({
			id: schema.tahunAjaran.id,
			nama: schema.tahunAjaran.nama
		})
		.from(schema.tahunAjaran)
		.where(eq(schema.tahunAjaran.id, tahunAjaranId));

	const [customNominalRow] = await db
		.select({ nominal: schema.kategoriGratis.nominal })
		.from(schema.kategoriGratis)
		.where(and(
			eq(schema.kategoriGratis.kategoriId, santriRow.kategoriId),
			eq(schema.kategoriGratis.jenisPembayaranId, jenisPembayaranId)
		));

	const isBulanan = ['bulanan', 'smk_bulanan', 'smp_bulanan'].includes(jenisRow?.tipe || '');
	const isTahunan = ['tahunan', 'smk_tahunan', 'smp_tahunan'].includes(jenisRow?.tipe || '');
	const isSekali = ['sekali', 'smk_sekali', 'smp_sekali'].includes(jenisRow?.tipe || '');
	const { nominal: nominalTagihan, isGratis } = getEffectiveNominal({
		santriRow,
		jenisRow,
		customNominalRow
	});

	if (isBulanan && !bulan) {
		return { error: 'Bulan tagihan wajib dipilih untuk pembayaran bulanan.' };
	}

	const tahunTagihan = isBulanan
		? Number(tahunTagihanRaw || inferTahunTagihan(tahunAjaranRow?.nama, bulan, new Date().toISOString()))
		: null;

	if (isBulanan && (!tahunTagihan || Number.isNaN(tahunTagihan))) {
		return { error: 'Tahun tagihan wajib dipilih untuk pembayaran bulanan.' };
	}

	const existingPayments = await db
		.select({
			id: schema.pembayaran.id,
			tahunAjaranId: schema.pembayaran.tahunAjaranId,
			bulan: schema.pembayaran.bulan,
			tahunTagihan: schema.pembayaran.tahunTagihan,
			nominalDibayar: schema.pembayaran.nominalDibayar,
			keteranganKhusus: schema.pembayaran.keteranganKhusus
		})
		.from(schema.pembayaran)
		.where(and(
			eq(schema.pembayaran.santriId, santriId),
			eq(schema.pembayaran.jenisPembayaranId, jenisPembayaranId)
		));

	const regularExistingPayments = existingPayments.filter((item) => !item.keteranganKhusus);
	const importedRows = await getImportedTagihan({
		santriId,
		tahunAjaranId,
		jenisPembayaranId,
		bulan: isBulanan ? bulan : null,
		tahunTagihan: isBulanan ? tahunTagihan : null
	});
	const importedTotal = importedRows.reduce((sum, item) => sum + Number(item.nominalTagihan || 0), 0);
	const totalTagihan = importedTotal > 0 ? importedTotal : nominalTagihan;

	if (isBulanan) {
		const existingPeriodPayments = regularExistingPayments.filter((item) =>
			item.tahunAjaranId === tahunAjaranId &&
			item.bulan === bulan &&
			Number(item.tahunTagihan || 0) === Number(tahunTagihan || 0)
		);
		const totalSudahDibayar = existingPeriodPayments.reduce((sum, item) => sum + Number(item.nominalDibayar || 0), 0);
		const totalDariItemSebelumnya = previouslyNormalizedItems
			.filter((item) =>
				item.santriId === santriId &&
				item.jenisPembayaranId === jenisPembayaranId &&
				item.tahunAjaranId === tahunAjaranId &&
				item.bulan === bulan &&
				Number(item.tahunTagihan || 0) === Number(tahunTagihan || 0)
			)
			.reduce((sum, item) => sum + Number(item.nominalDibayar || 0), 0);
		const sisaTagihan = Math.max(0, totalTagihan - totalSudahDibayar - totalDariItemSebelumnya);

		if (sisaTagihan <= 0) {
			return {
				error: `Tagihan ${jenisRow.namaPembayaran} untuk ${bulan} ${tahunTagihan} sudah lunas.`
			};
		}

		nominalDibayar = sisaTagihan;
	} else if (isSekali) {
		const totalSudahDibayar = regularExistingPayments.reduce((sum, item) => sum + Number(item.nominalDibayar || 0), 0);

		// Tambahkan total dari item-item dalam batch yang sama
		const totalDariItemSebelumnya = previouslyNormalizedItems
			.filter(item => item.santriId === santriId && item.jenisPembayaranId === jenisPembayaranId)
			.reduce((sum, item) => sum + Number(item.nominalDibayar || 0), 0);

		const sisaTagihan = Math.max(0, totalTagihan - totalSudahDibayar - totalDariItemSebelumnya);

		if (sisaTagihan <= 0) {
			return {
				error: `${jenisRow.namaPembayaran} sudah lunas atau jumlah cicilan melebihi tagihan.`
			};
		}

		if (!nominalDibayar || Number.isNaN(nominalDibayar) || nominalDibayar <= 0) {
			return { error: 'Nominal cicilan harus lebih dari 0.' };
		}

		if (nominalDibayar > sisaTagihan) {
			return {
				error: `Nominal melebihi sisa tagihan. Sisa ${jenisRow.namaPembayaran}: Rp ${sisaTagihan.toLocaleString('id-ID')}.`
			};
		}
	} else if (isTahunan) {
		const existingYearPayments = regularExistingPayments.filter((item) => item.tahunAjaranId === tahunAjaranId);
		const totalSudahDibayar = existingYearPayments.reduce((sum, item) => sum + Number(item.nominalDibayar || 0), 0);
		
		// Tambahkan total dari item-item dalam batch yang sama
		const totalDariItemSebelumnya = previouslyNormalizedItems
			.filter(item => item.santriId === santriId && item.jenisPembayaranId === jenisPembayaranId && item.tahunAjaranId === tahunAjaranId)
			.reduce((sum, item) => sum + Number(item.nominalDibayar || 0), 0);
		
		const sisaTagihan = Math.max(0, totalTagihan - totalSudahDibayar - totalDariItemSebelumnya);

		if (sisaTagihan <= 0) {
			return {
				error: `${jenisRow.namaPembayaran} untuk tahun ${tahunAjaranRow?.nama || tahunAjaranId} sudah lunas atau jumlah cicilan melebihi tagihan.`
			};
		}

		if (!nominalDibayar || Number.isNaN(nominalDibayar) || nominalDibayar <= 0) {
			return { error: 'Nominal cicilan harus lebih dari 0.' };
		}

		if (nominalDibayar > sisaTagihan) {
			return {
				error: `Nominal melebihi sisa tagihan. Sisa ${jenisRow.namaPembayaran}: Rp ${sisaTagihan.toLocaleString('id-ID')}.`
			};
		}
	} else {
		nominalDibayar = totalTagihan;
	}

	if (nominalDibayar <= 0 && !isGratis) {
		return { error: 'Nominal harus lebih dari 0.' };
	}

	return {
		row: {
			santriId,
			tahunAjaranId,
			jenisPembayaranId,
			bulan,
			tahunTagihan,
			nominalDibayar,
			keteranganKhusus: null,
			namaPembayarManual: ''
		}
	};
}

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
	const riwayatData = await db
		.select({
			id: schema.pembayaran.id,
			nomorKwitansi: schema.pembayaran.nomorKwitansi,
			nominalDibayar: schema.pembayaran.nominalDibayar,
			tanggalBayar: schema.pembayaran.tanggalBayar,
			keteranganKhusus: schema.pembayaran.keteranganKhusus,
			namaSantri: schema.santri.namaLengkap,
			namaPembayarLain: schema.pembayarLain.namaPembayar
		})
		.from(schema.pembayaran)
		.leftJoin(schema.santri, eq(schema.pembayaran.santriId, schema.santri.id))
		.leftJoin(schema.pembayarLain, eq(schema.pembayaran.pembayarLainId, schema.pembayarLain.id))
		.orderBy(desc(schema.pembayaran.id))
		.limit(10);

	// Ambil semua pembayaran reguler untuk validasi status di client
	const pembayaranReguler = await db
		.select({
			id: schema.pembayaran.id,
			santriId: schema.pembayaran.santriId,
			tahunAjaranId: schema.pembayaran.tahunAjaranId,
			jenisPembayaranId: schema.pembayaran.jenisPembayaranId,
			bulan: schema.pembayaran.bulan,
			tahunTagihan: schema.pembayaran.tahunTagihan,
			nominalDibayar: schema.pembayaran.nominalDibayar,
			keteranganKhusus: schema.pembayaran.keteranganKhusus
		})
		.from(schema.pembayaran);

	// Ambil pemetaan kategori gratis
	const kategoriGratis = await db.select().from(schema.kategoriGratis);
	const tunggakanImport = await db.select().from(schema.tunggakanImport);

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
		pembayaranReguler,
		kategoriGratis,
		tunggakanImport,
		khususJenisId: jenisKhusus?.id || null
	};
}

export const actions = {
	create: async ({ request, locals, getClientAddress }) => {
		try {
			const formData = await request.formData();
			const paymentItemsJson = formData.get('paymentItemsJson')?.toString().trim() || '';
			const inputById = locals.user?.id || null;
			
			console.log('📨 Backend received form submission');
			console.log('paymentItemsJson:', paymentItemsJson);
			
			const rawItems = paymentItemsJson
				? JSON.parse(paymentItemsJson)
				: [{
					santriId: formData.get('santriId')?.toString().trim() || '',
					tahunAjaranId: formData.get('tahunAjaranId')?.toString().trim() || '',
					jenisPembayaranId: formData.get('jenisPembayaranId')?.toString().trim() || '',
					nominalDibayar: formData.get('nominalDibayar')?.toString().trim() || '',
					bulan: formData.get('bulan')?.toString().trim() || '',
					tahunTagihan: formData.get('tahunTagihan')?.toString().trim() || '',
					keteranganKhusus: formData.get('keteranganKhusus')?.toString().trim() || '',
					namaPembayarManual: formData.get('namaPembayarManual')?.toString().trim() || ''
				}];

			console.log('rawItems parsed:', JSON.stringify(rawItems));

			if (!Array.isArray(rawItems) || rawItems.length === 0) {
				console.log('❌ No payment items provided');
				return { success: false, message: 'Belum ada item pembayaran yang dipilih.' };
			}

			const normalizedItems = [];
			for (const rawItem of rawItems) {
				console.log('🔍 Validating item:', JSON.stringify(rawItem));
				const validated = await validateAndNormalizePaymentItem(rawItem, normalizedItems);
				if (validated.error) {
					console.log('❌ Validation error:', validated.error);
					return { success: false, message: validated.error };
				}
				console.log('✅ Item valid:', JSON.stringify(validated.row));
				normalizedItems.push(validated.row);
			}

			const uniqueSantriIds = new Set(normalizedItems.map((item) => item.santriId || 0));
			const uniqueTahunAjaranIds = new Set(normalizedItems.map((item) => item.tahunAjaranId));
			const uniqueManualNames = new Set(normalizedItems.map((item) => (item.namaPembayarManual || '').toLocaleLowerCase('id-ID')).filter(Boolean));

			if (uniqueSantriIds.size > 1 || uniqueTahunAjaranIds.size > 1 || uniqueManualNames.size > 1) {
				return {
					success: false,
					message: 'Multi payment harus untuk santri dan tahun ajaran yang sama.'
				};
			}

			// Generate No Kwitansi base (akan ditambahi sequence untuk item > 1)
			const nomorKwitansiBase = `KW-${Date.now()}`;
			const tanggalBayar = new Date().toISOString();
			let pembayarLainId = null;
			let santriId = normalizedItems[0]?.santriId || null;
			const namaPembayarManual = normalizedItems[0]?.namaPembayarManual || '';

			if (!santriId && namaPembayarManual) {
				const santriByName = await db.select().from(schema.santri);
				const normalizedNama = namaPembayarManual.toLocaleLowerCase('id-ID');
				const santriMatch = santriByName.find((item) => item.namaLengkap.toLocaleLowerCase('id-ID') === normalizedNama);
				if (santriMatch) santriId = santriMatch.id;
			}

			if (!santriId && namaPembayarManual) {
				const existingPembayar = await db.select().from(schema.pembayarLain);
				const normalizedNama = namaPembayarManual.toLocaleLowerCase('id-ID');
				const match = existingPembayar.find((item) => item.namaPembayar.toLocaleLowerCase('id-ID') === normalizedNama);

				if (match) {
					pembayarLainId = match.id;
				} else {
					const [newPembayar] = await db.insert(schema.pembayarLain).values({
						namaPembayar: namaPembayarManual,
						createdAt: tanggalBayar
					}).returning();
					pembayarLainId = newPembayar?.id || null;
				}
			}

			const pembayaranValues = normalizedItems.map((item, index) => {
				// Generate unique nomorKwitansi untuk setiap item dalam batch
				// Item pertama: KW-{timestamp}
				// Item ke-2+: KW-{timestamp}-{index}
				const nomorKwitansi = index === 0 ? nomorKwitansiBase : `${nomorKwitansiBase}-${index + 1}`;
				console.log(`  Item ${index + 1} nomorKwitansi:`, nomorKwitansi);
				
				return {
					santriId,
					pembayarLainId: santriId ? null : pembayarLainId,
					tahunAjaranId: item.tahunAjaranId,
					jenisPembayaranId: item.jenisPembayaranId,
					bulan: item.bulan,
					tahunTagihan: item.tahunTagihan,
					nominalDibayar: item.nominalDibayar,
					tanggalBayar,
					nomorKwitansi,
					inputById,
					keteranganKhusus: item.keteranganKhusus
				};
			});

			const pembayaranResult = await db.insert(schema.pembayaran).values(pembayaranValues).returning();
			console.log('💾 Raw insert result:', pembayaranResult);
			
			const insertedRows = Array.isArray(pembayaranResult) ? pembayaranResult : (pembayaranResult ? [pembayaranResult] : []);
			console.log('💾 insertedRows:', insertedRows);
			
			let newTrx = insertedRows[0];
			console.log('💾 newTrx from returning():', newTrx);

			// Jika returning() tidak mengembalikan data (bug SQLite), query langsung berdasarkan nomorKwitansi item pertama
			if (!newTrx || !newTrx.id) {
				console.log('⚠️ returning() tidak mengembalikan id, query langsung dari database');
				const firstItemNomorKwitansi = nomorKwitansiBase; // Item pertama punya nomorKwitansi yang sama dengan base
				console.log('  Query by nomorKwitansi:', firstItemNomorKwitansi);
				const [queryResult] = await db
					.select()
					.from(schema.pembayaran)
					.where(eq(schema.pembayaran.nomorKwitansi, firstItemNomorKwitansi));
				
				newTrx = queryResult;
				console.log('💾 newTrx from query:', newTrx);
			}

			console.log('💾 Insert result:');
			console.log('  - insertedRows length:', insertedRows.length);
			console.log('  - newTrx:', newTrx);
			console.log('  - newTrx?.id:', newTrx?.id);
			console.log('  - newTrx?.id type:', typeof newTrx?.id);

			if (!newTrx?.id) {
				console.log('❌ No transaction id found');
				return {
					success: false,
					message: 'Gagal mendapatkan ID transaksi'
				};
			}

			console.log('✓ Transaksi berhasil disimpan:', newTrx.id);
			console.log('📤 Returning response with id:', newTrx.id);

			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'input',
					modul: 'transaksi',
					keterangan: `Input ${insertedRows.length} item pembayaran kwitansi ${nomorKwitansiBase} untuk ${santriId ? `santri ${santriId}` : `pembayar umum "${namaPembayarManual}"`}`,
					ip: getClientAddress(),
					createdAt: new Date().toISOString()
				});
			} catch (e) {
				console.error('⚠️ Logging error (ignored):', e);
			}

			// Return data id transaksi agar client yang melakukan navigasi
			const response = {
				success: true,
				id: Number(newTrx.id)
			};
			console.log('📤 Response object:', JSON.stringify(response));
			return response;
		} catch (error) {
			console.error('❌ Error dalam create action:', error);
			
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan transaksi'
			};
		}
	}
};
