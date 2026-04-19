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

export async function load({ url }) {
	const now = new Date();
	const santriParam = url.searchParams.get('santriId') || '';
	const levelParam = url.searchParams.get('level') || 'all';

	const santris = await db
		.select({
			id: schema.santri.id,
			nomorInduk: schema.santri.nomorInduk,
			namaLengkap: schema.santri.namaLengkap,
			kategoriId: schema.santri.kategoriId,
			tanggalMasuk: schema.santri.tanggalMasuk,
			tanggalKeluar: schema.santri.tanggalKeluar,
			isActive: schema.santri.isActive,

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

	const jenisList = await db.select().from(schema.jenisPembayaran);
	const jenisNonBulanan = jenisList.filter(
		j => j.tipe !== 'bulanan' && j.tipe !== 'smk_bulanan' && j.tipe !== 'smp_bulanan'
	);
	const jenisSmkBulanan = jenisList.filter(j => j.tipe === 'smk_bulanan');
	const smkBulananNominal = jenisSmkBulanan[0]?.nominalDefault ?? 0;
	const jenisSmpBulanan = jenisList.filter(j => j.tipe === 'smp_bulanan');
	const smpBulananNominal = jenisSmpBulanan[0]?.nominalDefault ?? 0;

	const smkBySantriId = new Map(santriSmkList.map(s => [s.santriId, s]));
	const smpBySantriId = new Map(santriSmpList.map(s => [s.santriId, s]));
	const gratisList = await db.select().from(schema.kategoriGratis);

	const rekapIndividu = santris.map(s => {
		// Helper to get nominal with priority: Custom Category -> Category Column -> Default
		const getNominal = (jenisId, categoryColumnNominal, defaultNominal) => {
			const mapping = gratisList.find(g => g.kategoriId === s.kategoriId && g.jenisPembayaranId === jenisId);
			if (mapping && mapping.nominal !== null) return mapping.nominal;
			
			// Fallback to legacy category column if provided
			if (categoryColumnNominal !== undefined && categoryColumnNominal !== null) return categoryColumnNominal;
			
			return defaultNominal;
		};

		const pembayaranSantri = pembayaran.filter(p => p.santriId === s.id);

		// Pisahkan pembayaran khusus (yang punya keteranganKhusus)
		const pembayaranKhusus = pembayaranSantri
			.filter(p => !!p.keteranganKhusus)
			.map(p => ({
				id: p.id,
				keterangan: p.keteranganKhusus,
				nominalDibayar: p.nominalDibayar,
				tanggalBayar: p.tanggalBayar,
				nomorKwitansi: p.nomorKwitansi
			}));
		const totalKhusus = pembayaranKhusus.reduce((sum, p) => sum + (p.nominalDibayar || 0), 0);

		// Filter pembayaran normal (bukan khusus)
		const normalPayments = pembayaranSantri.filter(p => !p.keteranganKhusus);
		const konsumsiPayments = normalPayments.filter(p => p.tipe === 'bulanan' && /konsumsi/i.test(p.namaPembayaran || ''));
		const smkBulananPayments = normalPayments.filter(p => p.tipe === 'smk_bulanan');
		const smpBulananPayments = normalPayments.filter(p => p.tipe === 'smp_bulanan');
		const nonBulananPayments = normalPayments.filter(p => p.tipe !== 'bulanan' && p.tipe !== 'smk_bulanan' && p.tipe !== 'smp_bulanan');

		// Cari ID jenis pembayaran untuk lookup
		const jenisKonsumsiId = konsumsiPayments[0]?.jenisPembayaranId || jenisList.find(j => j.tipe === 'bulanan' && /konsumsi/i.test(j.namaPembayaran))?.id;
		const jenisSmkId = jenisSmkBulanan[0]?.id;
		const jenisSmpId = jenisSmpBulanan[0]?.id;

		const konsumsiNominalEff = getNominal(jenisKonsumsiId, s.nominalKonsumsi, 0);
		const smkBulananNominalEff = getNominal(jenisSmkId, undefined, smkBulananNominal);
		const smpBulananNominalEff = getNominal(jenisSmpId, undefined, smpBulananNominal);

		const startDate = s.tanggalMasuk ? new Date(s.tanggalMasuk) : now;
		const endDate = s.tanggalKeluar ? new Date(s.tanggalKeluar) : now;
		const monthsRange = startDate <= endDate ? buildMonthRange(startDate, endDate) : [];
		const konsumsi = mergeMonthlyRekap(
			monthsRange,
			buildMonthlyPaymentMap(konsumsiPayments),
			konsumsiNominalEff
		);

		const smkInfo = smkBySantriId.get(s.id);
		let smkBulanan = [];
		if (smkInfo) {
			const smkStart = new Date(smkInfo.startYear, (smkInfo.startMonth || 1) - 1, 1);
			const smkEnd = smkInfo.endYear && smkInfo.endMonth
				? new Date(smkInfo.endYear, smkInfo.endMonth - 1, 1)
				: now;
			const smkMonthsRange = smkStart <= smkEnd ? buildMonthRange(smkStart, smkEnd) : [];

			smkBulanan = mergeMonthlyRekap(
				smkMonthsRange,
				buildMonthlyPaymentMap(smkBulananPayments),
				smkBulananNominalEff
			);
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

			smpBulanan = mergeMonthlyRekap(
				smpMonthsRange,
				buildMonthlyPaymentMap(smpBulananPayments),
				smpBulananNominalEff
			);
		} else if (smpBulananPayments.length > 0) {
			smpBulanan = mergeMonthlyRekap([], buildMonthlyPaymentMap(smpBulananPayments), 0);
		}


		const totalTagihanKonsumsi = konsumsi.reduce((sum, m) => sum + (m.nominalTagihan || 0), 0);
		const totalDibayarKonsumsi = konsumsi.reduce((sum, m) => sum + (m.nominalDibayar || 0), 0);
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

				const nominalEff = jenis ? getNominal(jenis.id, undefined, jenis.nominalDefault ?? 0) : 0;

				let jumlahTagihan = 0;
				if (jenis?.tipe === 'tahunan') jumlahTagihan = tahunSpan;
				else if (jenis?.tipe === 'smk_tahunan') jumlahTagihan = smkTahunSpan;
				else if (jenis?.tipe === 'smp_tahunan') jumlahTagihan = smpTahunSpan;
				else if (
					jenis?.tipe === 'sekali' ||
					jenis?.tipe === 'smk_sekali' ||
					jenis?.tipe === 'smp_sekali'
				) jumlahTagihan = 1;

				const totalTagihan = nominalEff * jumlahTagihan;
				const sisa = Math.max(0, totalTagihan - totalNominal);
				return {
					namaPembayaran: jenis?.namaPembayaran || samplePayment?.namaPembayaran || '-',
					tipe: jenis?.tipe || samplePayment?.tipe || '-',
					jumlahTransaksi: items.length,
					totalNominal,
					totalTagihan,
					sisa,
					terakhirBayar: lastTanggal,
					nominalEff,
					isTambahanDariPembayaran: !jenis || !jenisNonBulananAktif.some(j => j.id === jenisId)
				};
			})
			.filter(p => p.nominalEff > 0 || p.totalNominal > 0);

		const totalTagihanLain = nonBulananByJenis.reduce((sum, p) => sum + (p.totalTagihan || 0), 0);
		const totalDibayarLain = nonBulananByJenis.reduce((sum, p) => sum + (p.totalNominal || 0), 0);
		const totalSisaLain = nonBulananByJenis.reduce((sum, p) => sum + (p.sisa || 0), 0);
		const totalSisaKonsumsi = Math.max(0, totalTagihanKonsumsi - totalDibayarKonsumsi);
		const totalSisaSmkBulanan = Math.max(0, totalTagihanSmkBulanan - totalDibayarSmkBulanan);
		const totalSisaSmpBulanan = Math.max(0, totalTagihanSmpBulanan - totalDibayarSmpBulanan);
		const totalTagihanKeseluruhan =
			totalTagihanKonsumsi + totalTagihanSmkBulanan + totalTagihanSmpBulanan + totalTagihanLain;
		const totalDibayarKeseluruhan =
			totalDibayarKonsumsi + totalDibayarSmkBulanan + totalDibayarSmpBulanan + totalDibayarLain + totalKhusus;
		const totalBelumTerbayarKeseluruhan =
			totalSisaKonsumsi + totalSisaSmkBulanan + totalSisaSmpBulanan + totalSisaLain;

		return {
			...s,

			konsumsiNominalEff,
			smkBulananNominalEff,
			smpBulananNominalEff,

			konsumsi,
			smkBulanan,
			totalTagihanSmkBulanan,
			totalDibayarSmkBulanan,
			smpBulanan,
			totalTagihanSmpBulanan,
			totalDibayarSmpBulanan,
			pembayaranLain: nonBulananByJenis,
			pembayaranKhusus,
			totalKhusus,

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

	let filteredRekap = santriParam
		? rekapIndividu.filter(r => String(r.id) === santriParam)
		: [];
	if (levelParam === 'smk') {
		filteredRekap = filteredRekap.filter(r => smkBySantriId.has(r.id));
	}
	if (levelParam === 'smp') {
		filteredRekap = filteredRekap.filter(r => smpBySantriId.has(r.id));
	}

	return {
		rekapIndividu: filteredRekap,
		santriList: santris.map(s => ({ id: s.id, nomorInduk: s.nomorInduk, namaLengkap: s.namaLengkap })),
		filterSantriId: santriParam,
		filterLevel: levelParam
	};
}
