import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

const BULAN_NAMES = [
	'Januari','Februari','Maret','April','Mei','Juni',
	'Juli','Agustus','September','Oktober','November','Desember'
];

const BULAN_INDEX = new Map(BULAN_NAMES.map((bulan, index) => [bulan, index]));

function buildMonthRange(startDate, endDate) {
	const months = [];
	const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
	const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
	let cur = new Date(start);
	while (cur <= end) {
		months.push({
			year: cur.getFullYear(),
			monthIndex: cur.getMonth(),
			monthName: BULAN_NAMES[cur.getMonth()]
		});
		cur.setMonth(cur.getMonth() + 1);
	}
	return months;
}

function buildMonthlyPaymentMap(payments) {
	const byKey = new Map();

	for (const payment of payments) {
		if (!payment.tanggalBayar) continue;

		const paidDate = new Date(payment.tanggalBayar);
		if (Number.isNaN(paidDate.getTime())) continue;

		const monthName = payment.bulan || BULAN_NAMES[paidDate.getMonth()];
		const monthIndex = BULAN_INDEX.get(monthName);
		if (monthIndex === undefined) continue;
		const paymentYear = Number(payment.tahunTagihan || paidDate.getFullYear());
		if (!paymentYear || Number.isNaN(paymentYear)) continue;

		const key = `${paymentYear}-${monthIndex}`;
		if (!byKey.has(key)) {
			byKey.set(key, {
				year: paymentYear,
				monthIndex,
				monthName,
				items: []
			});
		}

		byKey.get(key).items.push(payment);
	}

	return byKey;
}

function mergeMonthlyRekap(expectedMonths, paymentMap, nominalTagihan) {
	const merged = [];
	const expectedKeys = new Set();

	for (const month of expectedMonths) {
		const key = `${month.year}-${month.monthIndex}`;
		expectedKeys.add(key);

		const paidBucket = paymentMap.get(key);
		const paidItems = paidBucket?.items || [];
		const nominalDibayar = paidItems.reduce((sum, item) => sum + (item.nominalDibayar || 0), 0);

		merged.push({
			bulan: month.monthName,
			tahun: month.year,
			monthIndex: month.monthIndex,
			paid: nominalDibayar > 0,
			nominalTagihan,
			nominalDibayar,
			tanggalBayar: paidItems[0]?.tanggalBayar || null,
			nomorKwitansi: paidItems[0]?.nomorKwitansi || null,
			isTambahanDariPembayaran: false
		});
	}

	for (const [key, paidBucket] of paymentMap.entries()) {
		if (expectedKeys.has(key)) continue;

		const paidItems = paidBucket.items || [];
		const nominalDibayar = paidItems.reduce((sum, item) => sum + (item.nominalDibayar || 0), 0);

		merged.push({
			bulan: paidBucket.monthName,
			tahun: paidBucket.year,
			monthIndex: paidBucket.monthIndex,
			paid: nominalDibayar > 0,
			nominalTagihan: 0,
			nominalDibayar,
			tanggalBayar: paidItems[0]?.tanggalBayar || null,
			nomorKwitansi: paidItems[0]?.nomorKwitansi || null,
			isTambahanDariPembayaran: true
		});
	}

	return merged.sort((a, b) => {
		if (a.tahun !== b.tahun) return a.tahun - b.tahun;
		return a.monthIndex - b.monthIndex;
	});
}

function parseTahunAjaranRange(nama) {
	const normalized = String(nama || '').trim();
	const slash = normalized.match(/^(\d{4})\s*\/\s*(\d{4})$/);
	if (slash) {
		return {
			startYear: Number(slash[1]),
			endYear: Number(slash[2])
		};
	}

	const year = Number(normalized.match(/(\d{4})/)?.[1]);
	if (year) {
		return { startYear: year, endYear: year };
	}

	return null;
}

function getTahunAjaranForMonth(tahunAjarans, year, monthIndex) {
	return tahunAjarans.find((tahunAjaran) => {
		const range = parseTahunAjaranRange(tahunAjaran.nama);
		if (!range) return false;

		if (range.startYear === range.endYear) return range.startYear === year;
		if (monthIndex >= 6) return range.startYear === year;
		return range.endYear === year;
	}) || null;
}

function getAcademicYearStart(tahunAjaran) {
	const range = parseTahunAjaranRange(tahunAjaran?.nama);
	return range?.startYear || null;
}

function hasActiveMonthInTahunAjaran(tahunAjaran, activeMonthKeys) {
	const range = parseTahunAjaranRange(tahunAjaran?.nama);
	if (!range) return false;

	if (range.startYear === range.endYear) {
		for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
			if (activeMonthKeys.has(`${range.startYear}-${monthIndex}`)) return true;
		}
		return false;
	}

	for (let monthIndex = 6; monthIndex < 12; monthIndex++) {
		if (activeMonthKeys.has(`${range.startYear}-${monthIndex}`)) return true;
	}
	for (let monthIndex = 0; monthIndex < 6; monthIndex++) {
		if (activeMonthKeys.has(`${range.endYear}-${monthIndex}`)) return true;
	}
	return false;
}

export async function getSemuaRekap() {
	const now = new Date();

	const santris = await db
		.select({
			id: schema.santri.id,
			nomorInduk: schema.santri.nomorInduk,
			namaLengkap: schema.santri.namaLengkap,
			kategoriId: schema.santri.kategoriId,
			tanggalMasuk: schema.santri.tanggalMasuk,
			tanggalKeluar: schema.santri.tanggalKeluar,
			isActive: schema.santri.isActive,

			nominalSyahriyah: schema.kategoriSantri.nominalSyahriyah,
			nominalKonsumsi: schema.kategoriSantri.nominalKonsumsi,
			namaKategori: schema.kategoriSantri.namaKategori
		})
		.from(schema.santri)
		.leftJoin(schema.kategoriSantri, eq(schema.santri.kategoriId, schema.kategoriSantri.id));

	const santriSmkList = await db
		.select()
		.from(schema.santriSmk);
	const santriSmpList = await db
		.select()
		.from(schema.santriSmp);

	const pembayaran = await db
		.select({
			id: schema.pembayaran.id,
			santriId: schema.pembayaran.santriId,
			jenisPembayaranId: schema.pembayaran.jenisPembayaranId,
			tahunAjaranId: schema.pembayaran.tahunAjaranId,
			tanggalBayar: schema.pembayaran.tanggalBayar,
			bulan: schema.pembayaran.bulan,
			tahunTagihan: schema.pembayaran.tahunTagihan,
			nominalDibayar: schema.pembayaran.nominalDibayar,
			nomorKwitansi: schema.pembayaran.nomorKwitansi,
			keteranganKhusus: schema.pembayaran.keteranganKhusus,
			tipe: schema.jenisPembayaran.tipe,
			namaPembayaran: schema.jenisPembayaran.namaPembayaran
		})
		.from(schema.pembayaran)
		.leftJoin(schema.jenisPembayaran, eq(schema.pembayaran.jenisPembayaranId, schema.jenisPembayaran.id));
	const tunggakanImport = await db
		.select({
			id: schema.tunggakanImport.id,
			santriId: schema.tunggakanImport.santriId,
			tahunAjaranId: schema.tunggakanImport.tahunAjaranId,
			jenisPembayaranId: schema.tunggakanImport.jenisPembayaranId,
			nominalTagihan: schema.tunggakanImport.nominalTagihan,
			keteranganKhusus: schema.tunggakanImport.keteranganKhusus,
			catatan: schema.tunggakanImport.catatan,
			updatedAt: schema.tunggakanImport.updatedAt
		})
		.from(schema.tunggakanImport);

	const jenisList = await db.select().from(schema.jenisPembayaran);
	const jenisKhusus = jenisList.find((item) => item.namaPembayaran === 'Pembayaran Lain-lain');
	const jenisNonBulanan = jenisList.filter(
		j => j.tipe !== 'bulanan' && j.tipe !== 'smk_bulanan' && j.tipe !== 'smp_bulanan'
	);
	const jenisSmkBulanan = jenisList.filter(j => j.tipe === 'smk_bulanan');
	const smkBulananNominal = jenisSmkBulanan[0]?.nominalDefault ?? 0;
	const jenisSmpBulanan = jenisList.filter(j => j.tipe === 'smp_bulanan');
	const smpBulananNominal = jenisSmpBulanan[0]?.nominalDefault ?? 0;
	const keaktifanRows = await db.select().from(schema.santriKeaktifan);

	const smkBySantriId = new Map(santriSmkList.map(s => [s.santriId, s]));
	const smpBySantriId = new Map(santriSmpList.map(s => [s.santriId, s]));
	const gratisList = await db.select().from(schema.kategoriGratis);
	// Query santriKategoriTahun dan bangun map: santriId -> Map<tahunAjaranId, Set<kategoriId>>
	const kategoriTahunRows = await db.select().from(schema.santriKategoriTahun);
	const tahunAjarans = await db.select().from(schema.tahunAjaran);

	// kategoriByTahun[santriId][tahunAjaranId] = Set<kategoriId>
	const kategoriByTahun = new Map(); // santriId -> Map<tahunAjaranId, Set<kategoriId>>
	for (const row of kategoriTahunRows) {
		if (!kategoriByTahun.has(row.santriId)) kategoriByTahun.set(row.santriId, new Map());
		const tahunMap = kategoriByTahun.get(row.santriId);
		if (!tahunMap.has(row.tahunAjaranId)) tahunMap.set(row.tahunAjaranId, new Set());
		tahunMap.get(row.tahunAjaranId).add(row.kategoriId);
	}
	const activeMonthKeysBySantri = new Map();
	for (const row of keaktifanRows) {
		if (!row.isActive) continue;
		if (!activeMonthKeysBySantri.has(row.santriId)) activeMonthKeysBySantri.set(row.santriId, new Set());
		activeMonthKeysBySantri.get(row.santriId).add(`${row.tahun}-${row.bulan - 1}`);
	}

	const rekapIndividu = santris.map(s => {
		const activeMonthKeys = activeMonthKeysBySantri.get(s.id) || new Set();
		const isActiveMonth = (month) => activeMonthKeys.has(`${month.year}-${month.monthIndex}`);
		const filterActiveMonths = (months) => months.filter(isActiveMonth);

		// Helper: dapatkan kategoriIds santri untuk tahun ajaran tertentu
		// Jika tahunAjaranId tidak diketahui, fallback ke semua kategori (union)
		const getKategoriIdsForTahun = (tahunAjaranId) => {
			const tahunMap = kategoriByTahun.get(s.id);
			if (tahunMap && tahunAjaranId && tahunMap.has(tahunAjaranId)) {
				return tahunMap.get(tahunAjaranId);
			}
			// Fallback: union semua kategori + kolom lama
			const all = new Set();
			if (tahunMap) for (const ids of tahunMap.values()) for (const id of ids) all.add(id);
			if (s.kategoriId) all.add(s.kategoriId);
			return all;
		};

		const getCategoryColumnNominal = (jenis) => {
			if (!jenis?.namaPembayaran) return undefined;
			if (/konsumsi/i.test(jenis.namaPembayaran)) return s.nominalKonsumsi;
			if (/syahriyah|spp/i.test(jenis.namaPembayaran)) return s.nominalSyahriyah;
			return undefined;
		};

		// Helper: cek gratisList dengan kategori yang berlaku untuk tahun tertentu
		const getNominal = (jenisId, categoryColumnNominal, defaultNominal, tahunAjaranId = null) => {
			const katIds = getKategoriIdsForTahun(tahunAjaranId);
			for (const katId of katIds) {
				const mapping = gratisList.find(g => g.kategoriId === katId && g.jenisPembayaranId === jenisId);
				if (mapping && mapping.nominal !== null) return mapping.nominal;
			}
			// Fallback ke kolom lama jika ada (mis. nominalKonsumsi dari kategoriSantri)
			if (categoryColumnNominal !== undefined && categoryColumnNominal !== null) return categoryColumnNominal;
			return defaultNominal;
		};

		const getNominalForMonth = (jenis, month) => {
			const matchedTahun = getTahunAjaranForMonth(tahunAjarans, month.year, month.monthIndex);
			return getNominal(
				jenis.id,
				getCategoryColumnNominal(jenis),
				jenis.nominalDefault ?? 0,
				matchedTahun?.id || null
			);
		};

		const pembayaranSantri = pembayaran.filter(p => p.santriId === s.id);

		// Semua pembayaran dengan keteranganKhusus
		const allPembayaranKhusus = pembayaranSantri
			.filter(p => !!p.keteranganKhusus)
			.map(p => ({
				id: p.id,
				tahunAjaranId: p.tahunAjaranId,
				keterangan: p.keteranganKhusus,
				nominalDibayar: p.nominalDibayar,
				tanggalBayar: p.tanggalBayar,
				nomorKwitansi: p.nomorKwitansi
			}));

		// Bangun daftar tagihanKhusus dari tunggakanImport
		const tagihanKhusus = Array.from(
			tunggakanImport
				.filter((item) =>
					item.santriId === s.id &&
					(!jenisKhusus || item.jenisPembayaranId === jenisKhusus.id) &&
					!!item.keteranganKhusus &&
					!!item.tahunAjaranId
				)
				.reduce((map, item) => {
					const key = `${item.tahunAjaranId}-${String(item.keteranganKhusus || '').trim().toLowerCase()}`;
					if (!map.has(key)) {
						const tahun = tahunAjarans.find((ta) => ta.id === item.tahunAjaranId);
						map.set(key, {
							tahunAjaranId: item.tahunAjaranId,
							namaTahunAjaran: tahun?.nama || '-',
							keterangan: item.keteranganKhusus,
							nominalTagihan: 0,
							totalDibayar: 0,
							catatan: item.catatan || null,
							updatedAt: item.updatedAt || null
						});
					}
					const grouped = map.get(key);
					grouped.nominalTagihan += Number(item.nominalTagihan || 0);
					return map;
				}, new Map())
				.values()
		).map((item) => {
			const totalDibayar = allPembayaranKhusus
				.filter((payment) =>
					payment.tahunAjaranId === item.tahunAjaranId &&
					String(payment.keterangan || '').trim().toLowerCase() === String(item.keterangan || '').trim().toLowerCase()
				)
				.reduce((sum, payment) => sum + Number(payment.nominalDibayar || 0), 0);
			return {
				...item,
				totalDibayar,
				sisa: Math.max(0, Number(item.nominalTagihan || 0) - totalDibayar)
			};
		});
		const totalTagihanKhusus = tagihanKhusus.reduce((sum, item) => sum + Number(item.nominalTagihan || 0), 0);
		const totalDibayarTagihanKhusus = tagihanKhusus.reduce((sum, item) => sum + Number(item.totalDibayar || 0), 0);
		const totalSisaTagihanKhusus = tagihanKhusus.reduce((sum, item) => sum + Number(item.sisa || 0), 0);

		// Bangun set kunci tagihan khusus yang ada di tunggakanImport
		// Pembayaran yang sudah cocok dengan tagihan khusus TIDAK ditampilkan di "Pembayaran Lain-lain"
		const tagihanKhususKeys = new Set(
			tagihanKhusus.map((item) =>
				`${item.tahunAjaranId}-${String(item.keterangan || '').trim().toLowerCase()}`
			)
		);

		// pembayaranKhusus: hanya pembayaran yang TIDAK cocok dengan tagihan khusus manapun
		const pembayaranKhusus = allPembayaranKhusus.filter((p) => {
			const key = `${p.tahunAjaranId}-${String(p.keterangan || '').trim().toLowerCase()}`;
			return !tagihanKhususKeys.has(key);
		});
		const totalKhusus = pembayaranKhusus.reduce((sum, p) => sum + (p.nominalDibayar || 0), 0);

		// Filter pembayaran normal (bukan khusus)
		const normalPayments = pembayaranSantri.filter(p => !p.keteranganKhusus);
		const bulananPondokPayments = normalPayments.filter(p => p.tipe === 'bulanan');
		const konsumsiPayments = bulananPondokPayments.filter(p => /konsumsi/i.test(p.namaPembayaran || ''));
		const smkBulananPayments = normalPayments.filter(p => p.tipe === 'smk_bulanan');
		const smpBulananPayments = normalPayments.filter(p => p.tipe === 'smp_bulanan');
		const nonBulananPayments = normalPayments.filter(p => p.tipe !== 'bulanan' && p.tipe !== 'smk_bulanan' && p.tipe !== 'smp_bulanan');

		const jenisKonsumsiId = konsumsiPayments[0]?.jenisPembayaranId || jenisList.find(j => j.tipe === 'bulanan' && /konsumsi/i.test(j.namaPembayaran))?.id;
		const jenisSmkId = jenisSmkBulanan[0]?.id;
		const jenisSmpId = jenisSmpBulanan[0]?.id;
		const jenisBulananPondokAktif = jenisList.filter(j => j.tipe === 'bulanan');

		// Nominal fallback (union semua tahun) untuk summary
		const konsumsiNominalEff = getNominal(jenisKonsumsiId, s.nominalKonsumsi, 0);
		const smkBulananNominalEff = getNominal(jenisSmkId, undefined, smkBulananNominal);
		const smpBulananNominalEff = getNominal(jenisSmpId, undefined, smpBulananNominal);

		const startDate = s.tanggalMasuk ? new Date(s.tanggalMasuk) : now;
		const endDate = s.tanggalKeluar ? new Date(s.tanggalKeluar) : now;
		const monthsRange = startDate <= endDate ? buildMonthRange(startDate, endDate) : [];
		const activeMonthsRange = filterActiveMonths(monthsRange);

		const buildBulananPondokForJenis = (jenis) => {
			const jenisPayments = bulananPondokPayments.filter(p => p.jenisPembayaranId === jenis.id);
			const paymentMap = buildMonthlyPaymentMap(jenisPayments);
			const rows = activeMonthsRange.map(month => {
				const key = `${month.year}-${month.monthIndex}`;
				const paidBucket = paymentMap.get(key);
				const paidItems = paidBucket?.items || [];
				const nominalDibayar = paidItems.reduce((sum, item) => sum + (item.nominalDibayar || 0), 0);
				const tahunAjaranIdDariPembayaran = paidItems[0]?.tahunAjaranId || null;
				const nominalTagihan = tahunAjaranIdDariPembayaran
					? getNominal(jenis.id, getCategoryColumnNominal(jenis), jenis.nominalDefault ?? 0, tahunAjaranIdDariPembayaran)
					: getNominalForMonth(jenis, month);
				return {
					bulan: month.monthName,
					tahun: month.year,
					monthIndex: month.monthIndex,
					paid: nominalDibayar > 0,
					nominalTagihan,
					nominalDibayar,
					tanggalBayar: paidItems[0]?.tanggalBayar || null,
					nomorKwitansi: paidItems[0]?.nomorKwitansi || null,
					isTambahanDariPembayaran: false
				};
			});

			const expectedKeys = new Set(activeMonthsRange.map(m => `${m.year}-${m.monthIndex}`));
			for (const [key, bucket] of paymentMap.entries()) {
				if (expectedKeys.has(key)) continue;
				const paidItems = bucket.items || [];
				const nominalDibayar = paidItems.reduce((sum, item) => sum + (item.nominalDibayar || 0), 0);
				rows.push({
					bulan: bucket.monthName,
					tahun: bucket.year,
					monthIndex: bucket.monthIndex,
					paid: nominalDibayar > 0,
					nominalTagihan: 0,
					nominalDibayar,
					tanggalBayar: paidItems[0]?.tanggalBayar || null,
					nomorKwitansi: paidItems[0]?.nomorKwitansi || null,
					isTambahanDariPembayaran: true
				});
			}

			rows.sort((a, b) => a.tahun !== b.tahun ? a.tahun - b.tahun : a.monthIndex - b.monthIndex);
			return rows;
		};

		const bulananPondok = Array.from(new Set([
			...jenisBulananPondokAktif.map(j => j.id),
			...bulananPondokPayments.map(p => p.jenisPembayaranId).filter(Boolean)
		])).map((jenisId) => {
			const jenis = jenisList.find(j => j.id === jenisId) || null;
			const samplePayment = bulananPondokPayments.find(p => p.jenisPembayaranId === jenisId) || null;
			if (!jenis && !samplePayment) return null;
			const effectiveJenis = jenis || {
				id: jenisId,
				namaPembayaran: samplePayment.namaPembayaran,
				nominalDefault: 0
			};
			const rows = buildBulananPondokForJenis(effectiveJenis);
			const totalTagihan = rows.reduce((sum, m) => sum + (m.nominalTagihan || 0), 0);
			const totalDibayar = rows.reduce((sum, m) => sum + (m.nominalDibayar || 0), 0);
			return {
				jenisId,
				namaPembayaran: effectiveJenis.namaPembayaran || '-',
				nominalEff: getNominal(effectiveJenis.id, getCategoryColumnNominal(effectiveJenis), effectiveJenis.nominalDefault ?? 0),
				months: rows,
				totalTagihan,
				totalDibayar,
				totalSisa: Math.max(0, totalTagihan - totalDibayar),
				isTambahanDariPembayaran: !jenis
			};
		}).filter(item => item && (item.totalTagihan > 0 || item.totalDibayar > 0));

		const konsumsiJenis = bulananPondok.find(item => /konsumsi/i.test(item.namaPembayaran || ''));
		const konsumsi = konsumsiJenis?.months || [];

		const smkInfo = smkBySantriId.get(s.id);
		let smkBulanan = [];
		if (smkInfo) {
			const smkStart = new Date(smkInfo.startYear, (smkInfo.startMonth || 1) - 1, 1);
			const smkEnd = smkInfo.endYear && smkInfo.endMonth
				? new Date(smkInfo.endYear, smkInfo.endMonth - 1, 1)
				: now;
			const smkMonthsRange = smkStart <= smkEnd ? buildMonthRange(smkStart, smkEnd) : [];
			const smkActiveMonthsRange = filterActiveMonths(smkMonthsRange);
			const smkPaymentMap = buildMonthlyPaymentMap(smkBulananPayments);
			smkBulanan = smkActiveMonthsRange.map(month => {
				const key = `${month.year}-${month.monthIndex}`;
				const paidBucket = smkPaymentMap.get(key);
				const paidItems = paidBucket?.items || [];
				const nominalDibayar = paidItems.reduce((sum, item) => sum + (item.nominalDibayar || 0), 0);
				const tahunAjaranIdDariPembayaran = paidItems[0]?.tahunAjaranId || null;
				const nominalTagihan = jenisSmkId
					? (tahunAjaranIdDariPembayaran
						? getNominal(jenisSmkId, undefined, smkBulananNominal, tahunAjaranIdDariPembayaran)
						: getNominalForMonth(jenisSmkBulanan[0], month))
					: 0;
				return { bulan: month.monthName, tahun: month.year, monthIndex: month.monthIndex, paid: nominalDibayar > 0, nominalTagihan, nominalDibayar, tanggalBayar: paidItems[0]?.tanggalBayar || null, nomorKwitansi: paidItems[0]?.nomorKwitansi || null, isTambahanDariPembayaran: false };
			});
			const smkExpectedKeys = new Set(smkActiveMonthsRange.map(m => `${m.year}-${m.monthIndex}`));
			for (const [key, bucket] of smkPaymentMap.entries()) {
				if (smkExpectedKeys.has(key)) continue;
				const paidItems = bucket.items || [];
				const nominalDibayar = paidItems.reduce((sum, item) => sum + (item.nominalDibayar || 0), 0);
				smkBulanan.push({ bulan: bucket.monthName, tahun: bucket.year, monthIndex: bucket.monthIndex, paid: nominalDibayar > 0, nominalTagihan: 0, nominalDibayar, tanggalBayar: paidItems[0]?.tanggalBayar || null, nomorKwitansi: paidItems[0]?.nomorKwitansi || null, isTambahanDariPembayaran: true });
			}
			smkBulanan.sort((a, b) => a.tahun !== b.tahun ? a.tahun - b.tahun : a.monthIndex - b.monthIndex);
		} else if (smkBulananPayments.length > 0) {
			smkBulanan = mergeMonthlyRekap([], buildMonthlyPaymentMap(smkBulananPayments), 0);
		}

		const smpInfo = smpBySantriId.get(s.id);
		let smpBulanan = [];
		if (smpInfo) {
			const smpStart = new Date(smpInfo.startYear, (smpInfo.startMonth || 1) - 1, 1);
			const smpEnd = smpInfo.endYear && smpInfo.endMonth
				? new Date(smpInfo.endYear, smpInfo.endMonth - 1, 1)
				: now;
			const smpMonthsRange = smpStart <= smpEnd ? buildMonthRange(smpStart, smpEnd) : [];
			const smpActiveMonthsRange = filterActiveMonths(smpMonthsRange);
			const smpPaymentMap = buildMonthlyPaymentMap(smpBulananPayments);
			smpBulanan = smpActiveMonthsRange.map(month => {
				const key = `${month.year}-${month.monthIndex}`;
				const paidBucket = smpPaymentMap.get(key);
				const paidItems = paidBucket?.items || [];
				const nominalDibayar = paidItems.reduce((sum, item) => sum + (item.nominalDibayar || 0), 0);
				const tahunAjaranIdDariPembayaran = paidItems[0]?.tahunAjaranId || null;
				const nominalTagihan = jenisSmpId
					? (tahunAjaranIdDariPembayaran
						? getNominal(jenisSmpId, undefined, smpBulananNominal, tahunAjaranIdDariPembayaran)
						: getNominalForMonth(jenisSmpBulanan[0], month))
					: 0;
				return { bulan: month.monthName, tahun: month.year, monthIndex: month.monthIndex, paid: nominalDibayar > 0, nominalTagihan, nominalDibayar, tanggalBayar: paidItems[0]?.tanggalBayar || null, nomorKwitansi: paidItems[0]?.nomorKwitansi || null, isTambahanDariPembayaran: false };
			});
			const smpExpectedKeys = new Set(smpActiveMonthsRange.map(m => `${m.year}-${m.monthIndex}`));
			for (const [key, bucket] of smpPaymentMap.entries()) {
				if (smpExpectedKeys.has(key)) continue;
				const paidItems = bucket.items || [];
				const nominalDibayar = paidItems.reduce((sum, item) => sum + (item.nominalDibayar || 0), 0);
				smpBulanan.push({ bulan: bucket.monthName, tahun: bucket.year, monthIndex: bucket.monthIndex, paid: nominalDibayar > 0, nominalTagihan: 0, nominalDibayar, tanggalBayar: paidItems[0]?.tanggalBayar || null, nomorKwitansi: paidItems[0]?.nomorKwitansi || null, isTambahanDariPembayaran: true });
			}
			smpBulanan.sort((a, b) => a.tahun !== b.tahun ? a.tahun - b.tahun : a.monthIndex - b.monthIndex);
		} else if (smpBulananPayments.length > 0) {
			smpBulanan = mergeMonthlyRekap([], buildMonthlyPaymentMap(smpBulananPayments), 0);
		}


		const totalTagihanKonsumsi = konsumsi.reduce((sum, m) => sum + (m.nominalTagihan || 0), 0);
		const totalDibayarKonsumsi = konsumsi.reduce((sum, m) => sum + (m.nominalDibayar || 0), 0);
		const totalTagihanBulananPondok = bulananPondok.reduce((sum, item) => sum + (item.totalTagihan || 0), 0);
		const totalDibayarBulananPondok = bulananPondok.reduce((sum, item) => sum + (item.totalDibayar || 0), 0);
		const totalTagihanSmkBulanan = smkBulanan.reduce((sum, m) => sum + (m.nominalTagihan || 0), 0);
		const totalDibayarSmkBulanan = smkBulanan.reduce((sum, m) => sum + (m.nominalDibayar || 0), 0);
		const totalTagihanSmpBulanan = smpBulanan.reduce((sum, m) => sum + (m.nominalTagihan || 0), 0);
		const totalDibayarSmpBulanan = smpBulanan.reduce((sum, m) => sum + (m.nominalDibayar || 0), 0);

		const startYear = (s.tanggalMasuk ? new Date(s.tanggalMasuk) : now).getFullYear();
		const endYear = (s.tanggalKeluar ? new Date(s.tanggalKeluar) : now).getFullYear();
		const tahunSpan = startYear <= endYear ? (endYear - startYear + 1) : 0;

		let smkTahunSpan = 0;
		if (smkInfo) {
			const smpStart = new Date(smkInfo.startYear, 0, 1);
			const smpEnd = smkInfo.endYear ? new Date(smkInfo.endYear, 0, 1) : now;
			smkTahunSpan = Math.max(0, smpEnd.getFullYear() - smpStart.getFullYear() + 1);
		}
		let smpTahunSpan = 0;
		if (smpInfo) {
			const smpStart = new Date(smpInfo.startYear, 0, 1);
			const smpEnd = smpInfo.endYear ? new Date(smpInfo.endYear, 0, 1) : now;
			smpTahunSpan = Math.max(0, smpEnd.getFullYear() - smpStart.getFullYear() + 1);
		}

		const jenisNonBulananAktif = jenisNonBulanan.filter(j => {
			if (j.tipe.startsWith('smk_')) return !!smkInfo;
			if (j.tipe.startsWith('smp_')) return !!smpInfo;
			return true;
		});

		const nonBulananByJenis = Array.from(new Set([
			...jenisNonBulananAktif.map(j => j.id),
			...nonBulananPayments.map(p => p.jenisPembayaranId).filter(Boolean)
		])).map(jenisId => {
				const jenis = jenisList.find(j => j.id === jenisId) || null;
				const samplePayment = nonBulananPayments.find(p => p.jenisPembayaranId === jenisId) || null;
				const items = nonBulananPayments.filter(p => p.jenisPembayaranId === jenisId);
				const totalNominal = items.reduce((sum, p) => sum + (p.nominalDibayar || 0), 0);
				const lastTanggal = items.length ? items[items.length - 1].tanggalBayar : null;

				let totalTagihan = 0;
				let nominalEff = 0; // untuk display (nominal terbaru/fallback)
				let tahunDetails = []; // detail per tahun ajaran

				const isTahunan = jenis?.tipe === 'tahunan' || jenis?.tipe === 'smk_tahunan' || jenis?.tipe === 'smp_tahunan';

				if (isTahunan) {
					// Hitung totalTagihan per tahun ajaran yang relevan
					// Gunakan kategori pada Juli tahun ajaran tersebut, dan hanya muncul jika ada minimal 1 bulan aktif.
					let tahunAjaranIds;
					if (jenis.tipe === 'tahunan') {
						tahunAjaranIds = tahunAjarans
							.filter(t => {
								const startYear = getAcademicYearStart(t);
								if (!startYear) return false;
								return hasActiveMonthInTahunAjaran(t, activeMonthKeys);
							})
							.map(t => t.id);
					} else if (jenis.tipe === 'smk_tahunan' && smkInfo) {
						tahunAjaranIds = tahunAjarans
							.filter(t => {
								const startYear = getAcademicYearStart(t);
								if (!startYear) return false;
								if (startYear < smkInfo.startYear || (smkInfo.endYear && startYear > smkInfo.endYear)) return false;
								return hasActiveMonthInTahunAjaran(t, activeMonthKeys);
							})
							.map(t => t.id);
					} else if (jenis.tipe === 'smp_tahunan' && smpInfo) {
						tahunAjaranIds = tahunAjarans
							.filter(t => {
								const startYear = getAcademicYearStart(t);
								if (!startYear) return false;
								if (startYear < smpInfo.startYear || (smpInfo.endYear && startYear > smpInfo.endYear)) return false;
								return hasActiveMonthInTahunAjaran(t, activeMonthKeys);
							})
							.map(t => t.id);
					} else {
						tahunAjaranIds = [];
					}
					// Bangun detail per tahun ajaran (masing-masing pakai kategori tahun itu)
					// Also include tahun ajaran from payments that don't have active months
					const paymentTahunIds = new Set(items.map(p => p.tahunAjaranId).filter(Boolean));
					const allTahunIds = new Set([...tahunAjaranIds, ...paymentTahunIds]);

					for (const taId of allTahunIds) {
						const ta = tahunAjarans.find(t => t.id === taId);
						const n = getNominal(jenis.id, undefined, jenis.nominalDefault ?? 0, taId);
						const taPayments = items.filter(p => p.tahunAjaranId === taId);
						const dibayar = taPayments.reduce((sum, p) => sum + (p.nominalDibayar || 0), 0);
						const tagihanForYear = tahunAjaranIds.includes(taId) ? n : 0;
						const sisaYear = Math.max(0, tagihanForYear - dibayar);
						const lastPayDate = taPayments.length ? taPayments[taPayments.length - 1].tanggalBayar : null;
						tahunDetails.push({
							tahunAjaranId: taId,
							namaTahun: ta?.nama || String(taId),
							nominalTagihan: tagihanForYear,
							totalDibayar: dibayar,
							jumlahTransaksi: taPayments.length,
							sisa: sisaYear,
							terakhirBayar: lastPayDate,
							isTambahanDariPembayaran: !tahunAjaranIds.includes(taId)
						});
						totalTagihan += tagihanForYear;
						nominalEff = n;
					}
					// Sort by extracted year from tahun name
					tahunDetails.sort((a, b) => {
						const ya = Number(String(a.namaTahun).match(/(\d{4})/)?.[1] || 0);
						const yb = Number(String(b.namaTahun).match(/(\d{4})/)?.[1] || 0);
						return ya - yb;
					});
				} else if (
					jenis?.tipe === 'sekali' ||
					jenis?.tipe === 'smk_sekali' ||
					jenis?.tipe === 'smp_sekali'
				) {
					// Untuk sekali: pakai tahunAjaranId dari pembayaran pertama jika ada
					const taId = items[0]?.tahunAjaranId || null;
					nominalEff = jenis ? getNominal(jenis.id, undefined, jenis.nominalDefault ?? 0, taId) : 0;
					totalTagihan = nominalEff;
					// Build single detail entry
					const ta = taId ? tahunAjarans.find(t => t.id === taId) : null;
					tahunDetails.push({
						tahunAjaranId: taId,
						namaTahun: ta?.nama || '-',
						nominalTagihan: totalTagihan,
						totalDibayar: totalNominal,
						jumlahTransaksi: items.length,
						sisa: Math.max(0, totalTagihan - totalNominal),
						terakhirBayar: lastTanggal,
						isTambahanDariPembayaran: false
					});
				} else {
					nominalEff = jenis ? getNominal(jenis.id, undefined, jenis.nominalDefault ?? 0) : 0;
					totalTagihan = nominalEff;
				}

				const sisa = Math.max(0, totalTagihan - totalNominal);
				return {
					namaPembayaran: jenis?.namaPembayaran || samplePayment?.namaPembayaran || '-',
					tipe: jenis?.tipe || samplePayment?.tipe || '-',
					isTahunan,
					jumlahTransaksi: items.length,
					totalNominal,
					totalTagihan,
					sisa,
					terakhirBayar: lastTanggal,
					nominalEff,
					tahunDetails,
					isTambahanDariPembayaran: !jenis || !jenisNonBulananAktif.some(j => j.id === jenisId)
				};
			})
			.filter(p => p.nominalEff > 0 || p.totalNominal > 0);

		const totalTagihanLain = nonBulananByJenis.reduce((sum, p) => sum + (p.totalTagihan || 0), 0);
		const totalDibayarLain = nonBulananByJenis.reduce((sum, p) => sum + (p.totalNominal || 0), 0);
		const totalSisaLain = nonBulananByJenis.reduce((sum, p) => sum + (p.sisa || 0), 0);
		const totalSisaKonsumsi = Math.max(0, totalTagihanKonsumsi - totalDibayarKonsumsi);
		const totalSisaBulananPondok = Math.max(0, totalTagihanBulananPondok - totalDibayarBulananPondok);
		const totalSisaSmkBulanan = Math.max(0, totalTagihanSmkBulanan - totalDibayarSmkBulanan);
		const totalSisaSmpBulanan = Math.max(0, totalTagihanSmpBulanan - totalDibayarSmpBulanan);
		const totalTagihanKeseluruhan =
			totalTagihanBulananPondok + totalTagihanSmkBulanan + totalTagihanSmpBulanan + totalTagihanLain + totalTagihanKhusus;
		const totalDibayarKeseluruhan =
			totalDibayarBulananPondok + totalDibayarSmkBulanan + totalDibayarSmpBulanan + totalDibayarLain + totalDibayarTagihanKhusus + totalKhusus;
		const totalBelumTerbayarKeseluruhan =
			totalSisaBulananPondok + totalSisaSmkBulanan + totalSisaSmpBulanan + totalSisaLain + totalSisaTagihanKhusus;

		return {
			...s,

			konsumsiNominalEff,
			smkBulananNominalEff,
			smpBulananNominalEff,

			bulananPondok,
			totalTagihanBulananPondok,
			totalDibayarBulananPondok,
			totalSisaBulananPondok,
			konsumsi,
			smkBulanan,
			totalTagihanSmkBulanan,
			totalDibayarSmkBulanan,
			smpBulanan,
			totalTagihanSmpBulanan,
			totalDibayarSmpBulanan,
			pembayaranLain: nonBulananByJenis,
			pembayaranKhusus,
			tagihanKhusus,
			totalKhusus,
			totalTagihanKhusus,
			totalDibayarTagihanKhusus,
			totalSisaTagihanKhusus,

			totalTagihanKonsumsi,
			totalDibayarKonsumsi,
			totalSisaKonsumsi,
			totalTagihanLain,
			totalDibayarLain,
			totalSisaLain,
			totalSisaSmkBulanan,
			totalSisaSmpBulanan,
			totalTagihanKeseluruhan,
			totalDibayarKeseluruhan,
			totalBelumTerbayarKeseluruhan
		};
	});

	return { rekapIndividu, santris, smkBySantriId, smpBySantriId };
}
