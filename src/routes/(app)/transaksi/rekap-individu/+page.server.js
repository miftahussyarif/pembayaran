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
			tanggalBayar: schema.pembayaran.tanggalBayar,
			bulan: schema.pembayaran.bulan,
			nominalDibayar: schema.pembayaran.nominalDibayar,
			nomorKwitansi: schema.pembayaran.nomorKwitansi,
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

	const rekapIndividu = santris.map(s => {
		const isYatim = /yatim/i.test(s.namaKategori || '');
		const smkBulananNominalEff = isYatim ? 0 : smkBulananNominal;
		const smpBulananNominalEff = isYatim ? 0 : smpBulananNominal;
		const startDate = s.tanggalMasuk ? new Date(s.tanggalMasuk) : now;
		const endDate = s.tanggalKeluar ? new Date(s.tanggalKeluar) : now;
		const monthsRange = startDate <= endDate ? buildMonthRange(startDate, endDate) : [];

		const pembayaranSantri = pembayaran.filter(p => p.santriId === s.id);
		const bulananPayments = pembayaranSantri.filter(p => p.tipe === 'bulanan' && !/konsumsi/i.test(p.namaPembayaran || ''));
		const konsumsiPayments = pembayaranSantri.filter(p => p.tipe === 'bulanan' && /konsumsi/i.test(p.namaPembayaran || ''));
		const smkBulananPayments = pembayaranSantri.filter(p => p.tipe === 'smk_bulanan');
		const smpBulananPayments = pembayaranSantri.filter(p => p.tipe === 'smp_bulanan');
		const nonBulananPayments = pembayaranSantri.filter(p => p.tipe !== 'bulanan' && p.tipe !== 'smk_bulanan' && p.tipe !== 'smp_bulanan');

		const bulananByKey = new Map();
		for (const p of bulananPayments) {
			if (!p.tanggalBayar || !p.bulan) continue;
			const tgl = new Date(p.tanggalBayar);
			const key = `${tgl.getFullYear()}-${p.bulan}`;
			if (!bulananByKey.has(key)) bulananByKey.set(key, []);
			bulananByKey.get(key).push(p);
		}

		const konsumsiByKey = new Map();
		for (const p of konsumsiPayments) {
			if (!p.tanggalBayar || !p.bulan) continue;
			const tgl = new Date(p.tanggalBayar);
			const key = `${tgl.getFullYear()}-${p.bulan}`;
			if (!konsumsiByKey.has(key)) konsumsiByKey.set(key, []);
			konsumsiByKey.get(key).push(p);
		}

		const syahriyah = monthsRange.map(m => {
			const key = `${m.year}-${m.monthName}`;
			const paidItems = bulananByKey.get(key) || [];
			const nominalDibayar = paidItems.reduce((sum, p) => sum + (p.nominalDibayar || 0), 0);
			return {
				bulan: m.monthName,
				tahun: m.year,
				paid: paidItems.length > 0,
				nominalTagihan: s.nominalSyahriyah ?? 0,
				nominalDibayar,
				tanggalBayar: paidItems[0]?.tanggalBayar || null,
				nomorKwitansi: paidItems[0]?.nomorKwitansi || null
			};
		});

		const konsumsi = monthsRange.map(m => {
			const key = `${m.year}-${m.monthName}`;
			const paidItems = konsumsiByKey.get(key) || [];
			const nominalDibayar = paidItems.reduce((sum, p) => sum + (p.nominalDibayar || 0), 0);
			return {
				bulan: m.monthName,
				tahun: m.year,
				paid: paidItems.length > 0,
				nominalTagihan: s.nominalKonsumsi ?? 0,
				nominalDibayar,
				tanggalBayar: paidItems[0]?.tanggalBayar || null,
				nomorKwitansi: paidItems[0]?.nomorKwitansi || null
			};
		});

		const smkInfo = smkBySantriId.get(s.id);
		let smkBulanan = [];
		if (smkInfo && !isYatim) {
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
		if (smpInfo && !isYatim) {
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

		const totalTagihanSyahriyah = syahriyah.reduce((sum, m) => sum + (m.nominalTagihan || 0), 0);
		const totalDibayarSyahriyah = syahriyah.reduce((sum, m) => sum + (m.nominalDibayar || 0), 0);
		const totalTagihanKonsumsi = konsumsi.reduce((sum, m) => sum + (m.nominalTagihan || 0), 0);
		const totalDibayarKonsumsi = konsumsi.reduce((sum, m) => sum + (m.nominalDibayar || 0), 0);
		const totalTagihanSmkBulanan = smkBulanan.length * (smkBulananNominalEff || 0);
		const totalDibayarSmkBulanan = smkBulanan.reduce((sum, m) => sum + (m.nominalDibayar || 0), 0);
		const totalTagihanSmpBulanan = smpBulanan.length * (smpBulananNominalEff || 0);
		const totalDibayarSmpBulanan = smpBulanan.reduce((sum, m) => sum + (m.nominalDibayar || 0), 0);

		const startYear = (s.tanggalMasuk ? new Date(s.tanggalMasuk) : now).getFullYear();
		const endYear = (s.tanggalKeluar ? new Date(s.tanggalKeluar) : now).getFullYear();
		const tahunSpan = startYear <= endYear ? (endYear - startYear + 1) : 0;

		const nonBulananByJenis = jenisNonBulanan.map(j => {
			const items = nonBulananPayments.filter(p => p.namaPembayaran === j.namaPembayaran && p.tipe === j.tipe);
			const totalNominal = items.reduce((sum, p) => sum + (p.nominalDibayar || 0), 0);
			const lastTanggal = items.length ? items[items.length - 1].tanggalBayar : null;
			const nominalDefault = j.nominalDefault ?? 0;
			let jumlahTagihan = 0;
			if (j.tipe === 'tahunan' || j.tipe === 'smk_tahunan' || j.tipe === 'smp_tahunan') jumlahTagihan = tahunSpan;
			else if (j.tipe === 'sekali' || j.tipe === 'smk_sekali' || j.tipe === 'smp_sekali') jumlahTagihan = 1;
			const totalTagihan = nominalDefault * jumlahTagihan;
			const sisa = Math.max(0, totalTagihan - totalNominal);
			return {
				namaPembayaran: j.namaPembayaran,
				tipe: j.tipe,
				jumlahTransaksi: items.length,
				totalNominal,
				totalTagihan,
				sisa,
				terakhirBayar: lastTanggal
			};
		});

		const totalTagihanLain = nonBulananByJenis.reduce((sum, p) => sum + (p.totalTagihan || 0), 0);
		const totalDibayarLain = nonBulananByJenis.reduce((sum, p) => sum + (p.totalNominal || 0), 0);
		const totalSisaLain = Math.max(0, totalTagihanLain - totalDibayarLain);

		return {
			...s,
			syahriyah,
			konsumsi,
			smkBulanan,
			totalTagihanSmkBulanan,
			totalDibayarSmkBulanan,
			smpBulanan,
			totalTagihanSmpBulanan,
			totalDibayarSmpBulanan,
			pembayaranLain: nonBulananByJenis,
			totalTagihanSyahriyah,
			totalDibayarSyahriyah,
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
