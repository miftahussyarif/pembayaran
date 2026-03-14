import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

const BULAN_NAMES = [
	'Januari','Februari','Maret','April','Mei','Juni',
	'Juli','Agustus','September','Oktober','November','Desember'
];

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
			tanggalBayar: schema.pembayaran.tanggalBayar,
			bulan: schema.pembayaran.bulan,
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

		const konsumsiByKey = new Map();
		for (const p of konsumsiPayments) {
			if (!p.tanggalBayar || !p.bulan) continue;
			const tgl = new Date(p.tanggalBayar);
			const key = `${tgl.getFullYear()}-${p.bulan}`;
			if (!konsumsiByKey.has(key)) konsumsiByKey.set(key, []);
			konsumsiByKey.get(key).push(p);
		}

		const konsumsi = monthsRange.map(m => {
			const key = `${m.year}-${m.monthName}`;
			const paidItems = konsumsiByKey.get(key) || [];
			const nominalDibayar = paidItems.reduce((sum, p) => sum + (p.nominalDibayar || 0), 0);
			return {
				bulan: m.monthName,
				tahun: m.year,
				paid: paidItems.length > 0,
				nominalTagihan: konsumsiNominalEff,
				nominalDibayar,
				tanggalBayar: paidItems[0]?.tanggalBayar || null,
				nomorKwitansi: paidItems[0]?.nomorKwitansi || null
			};
		});

		const smkInfo = smkBySantriId.get(s.id);
		let smkBulanan = [];
		if (smkInfo) {
			const smkStart = new Date(smkInfo.startYear, (smkInfo.startMonth || 1) - 1, 1);
			const smkEnd = smkInfo.endYear && smkInfo.endMonth
				? new Date(smkInfo.endYear, smkInfo.endMonth - 1, 1)
				: now;
			const smkMonthsRange = smkStart <= smkEnd ? buildMonthRange(smkStart, smkEnd) : [];

			const smkByKey = new Map();
			for (const p of smkBulananPayments) {
				if (!p.tanggalBayar || !p.bulan) continue;
				const tgl = new Date(p.tanggalBayar);
				const key = `${tgl.getFullYear()}-${p.bulan}`;
				if (!smkByKey.has(key)) smkByKey.set(key, []);
				smkByKey.get(key).push(p);
			}

			smkBulanan = smkMonthsRange.map(m => {
				const key = `${m.year}-${m.monthName}`;
				const paidItems = smkByKey.get(key) || [];
				const nominalDibayar = paidItems.reduce((sum, p) => sum + (p.nominalDibayar || 0), 0);
				return {
					bulan: m.monthName,
					tahun: m.year,
					paid: paidItems.length > 0,
					nominalTagihan: smkBulananNominalEff,
					nominalDibayar,
					tanggalBayar: paidItems[0]?.tanggalBayar || null
				};
			});
		}

		const smpInfo = smpBySantriId.get(s.id);
		let smpBulanan = [];
		if (smpInfo) {
			const smpStart = new Date(smpInfo.startYear, (smpInfo.startMonth || 1) - 1, 1);
			const smpEnd = smpInfo.endYear && smpInfo.endMonth
				? new Date(smpInfo.endYear, smpInfo.endMonth - 1, 1)
				: now;
			const smpMonthsRange = smpStart <= smpEnd ? buildMonthRange(smpStart, smpEnd) : [];

			const smpByKey = new Map();
			for (const p of smpBulananPayments) {
				if (!p.tanggalBayar || !p.bulan) continue;
				const tgl = new Date(p.tanggalBayar);
				const key = `${tgl.getFullYear()}-${p.bulan}`;
				if (!smpByKey.has(key)) smpByKey.set(key, []);
				smpByKey.get(key).push(p);
			}

			smpBulanan = smpMonthsRange.map(m => {
				const key = `${m.year}-${m.monthName}`;
				const paidItems = smpByKey.get(key) || [];
				const nominalDibayar = paidItems.reduce((sum, p) => sum + (p.nominalDibayar || 0), 0);
				return {
					bulan: m.monthName,
					tahun: m.year,
					paid: paidItems.length > 0,
					nominalTagihan: smpBulananNominalEff,
					nominalDibayar,
					tanggalBayar: paidItems[0]?.tanggalBayar || null
				};
			});
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

		const nonBulananByJenis = jenisNonBulanan
			.filter(j => {
				if (j.tipe.startsWith('smk_')) return !!smkInfo;
				if (j.tipe.startsWith('smp_')) return !!smpInfo;
				return true;
			})
			.map(j => {
				const items = nonBulananPayments.filter(p => p.namaPembayaran === j.namaPembayaran && p.tipe === j.tipe);
				const totalNominal = items.reduce((sum, p) => sum + (p.nominalDibayar || 0), 0);
				const lastTanggal = items.length ? items[items.length - 1].tanggalBayar : null;
				
				const nominalEff = getNominal(j.id, undefined, j.nominalDefault ?? 0);

				let jumlahTagihan = 0;
				if (j.tipe === 'tahunan') jumlahTagihan = tahunSpan;
				else if (j.tipe === 'smk_tahunan') jumlahTagihan = smkTahunSpan;
				else if (j.tipe === 'smp_tahunan') jumlahTagihan = smpTahunSpan;
				else if (j.tipe === 'sekali' || j.tipe === 'smk_sekali' || j.tipe === 'smp_sekali') jumlahTagihan = 1;
				
				const totalTagihan = nominalEff * jumlahTagihan;
				const sisa = Math.max(0, totalTagihan - totalNominal);
				return {
					namaPembayaran: j.namaPembayaran,
					tipe: j.tipe,
					jumlahTransaksi: items.length,
					totalNominal,
					totalTagihan,
					sisa,
					terakhirBayar: lastTanggal,
					nominalEff
				};
			})
			.filter(p => p.nominalEff > 0 || p.totalNominal > 0);

		const totalTagihanLain = nonBulananByJenis.reduce((sum, p) => sum + (p.totalTagihan || 0), 0);
		const totalDibayarLain = nonBulananByJenis.reduce((sum, p) => sum + (p.totalNominal || 0), 0);
		const totalSisaLain = totalTagihanLain - totalDibayarLain;

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
			totalTagihanLain,
			totalDibayarLain,
			totalSisaLain
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
