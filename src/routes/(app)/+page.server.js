import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { sql, count, sum, eq, desc } from 'drizzle-orm';

const BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni',
	'Juli','Agustus','September','Oktober','November','Desember'];

function inferTahunTagihan(tahunAjaranNama, bulan, fallbackYear) {
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

export async function load() {
	const now = new Date(); // 2026-03-12
	const nowYear = now.getFullYear();
	const nowMonth = now.getMonth() + 1; // 1-12

	// 1. Total santri aktif
	const [{ totalSantri }] = await db
		.select({ totalSantri: count() })
		.from(schema.santri)
		.where(sql`${schema.santri.isActive} = 1`);

	// 2. Total jenis pembayaran
	const [{ totalJenisPembayaran }] = await db
		.select({ totalJenisPembayaran: count() })
		.from(schema.jenisPembayaran);

	// 3. Pemasukan bulan ini
	const bulanIniStr = `${nowYear}-${String(nowMonth).padStart(2,'0')}`;
	const resultPemasukan = await db
		.select({ total: sum(schema.pembayaran.nominalDibayar) })
		.from(schema.pembayaran)
		.where(sql`strftime('%Y-%m', ${schema.pembayaran.tanggalBayar}) = ${bulanIniStr}`);
	const pemasukanBulanIni = Number(resultPemasukan[0]?.total || 0);

	// 4. Ambil Tahun Aktif
	const [tahunAjaranAktif] = await db
		.select()
		.from(schema.tahunAjaran)
		.where(sql`${schema.tahunAjaran.isActive} = 1`);


	// Santri per kategori (for horizontal bar chart)
	const allKategoris = await db.select().from(schema.kategoriSantri);
	const kategoriTahunRows = await db.select().from(schema.santriKategoriTahun);
	const allSantriList = await db.select({ id: schema.santri.id, kategoriId: schema.santri.kategoriId }).from(schema.santri);
	// Count unique santri per kategori from both sources
	const santriPerKategoriMap = new Map();
	// Source 1: santriKategoriTahun relation table (new multi-kategori system)
	for (const row of kategoriTahunRows) {
		if (!santriPerKategoriMap.has(row.kategoriId)) santriPerKategoriMap.set(row.kategoriId, new Set());
		santriPerKategoriMap.get(row.kategoriId).add(row.santriId);
	}
	// Source 2: legacy santri.kategoriId column (fallback for santri not yet in relation table)
	for (const s of allSantriList) {
		if (s.kategoriId) {
			if (!santriPerKategoriMap.has(s.kategoriId)) santriPerKategoriMap.set(s.kategoriId, new Set());
			santriPerKategoriMap.get(s.kategoriId).add(s.id);
		}
	}
	const santriPerKategori = allKategoris.map(k => ({
		id: k.id,
		nama: k.namaKategori,
		jumlah: santriPerKategoriMap.get(k.id)?.size || 0
	})).sort((a, b) => b.jumlah - a.jumlah);
	const totalSantriAll = allSantriList.length;

	// Recent transactions (last 7)
	const riwayatTerakhir = await db
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
		.limit(7);

	let totalTunggakan = 0;
	let rincianTunggakan = [];
	let progressBulanan = [];

	if (tahunAjaranAktif) {
		const taName = tahunAjaranAktif.nama.toString();
		const taYear = parseInt(taName.includes('/') ? taName.split('/')[0] : taName);

		const taStart = new Date(taYear, 0, 1);
		const taEnd   = new Date(taYear, 11, 31);
		const batasHitung = now < taEnd ? now : taEnd;

		// Ambil SEMUA santri aktif
		const santris = await db
			.select({
				id: schema.santri.id,
				namaLengkap: schema.santri.namaLengkap,
				tanggalMasuk: schema.santri.tanggalMasuk,
				tanggalKeluar: schema.santri.tanggalKeluar,
				kategoriId: schema.santri.kategoriId,
				nominalSyahriyah: schema.kategoriSantri.nominalSyahriyah
			})
			.from(schema.santri)
			.leftJoin(schema.kategoriSantri, eq(schema.santri.kategoriId, schema.kategoriSantri.id))
			.where(sql`${schema.santri.isActive} = 1`);

		// Ambil semua mapping nominal khusus
		const customNominals = await db.select().from(schema.kategoriGratis);
		const jenisList = await db.select().from(schema.jenisPembayaran);
		const syahriyahJenisId = jenisList.find(j => j.tipe === 'bulanan' && /syahriyah|spp/i.test(j.namaPembayaran))?.id;

		// Query kategori per santri dari tabel relasi
		const kategoriTahunRows = await db.select().from(schema.santriKategoriTahun);
		const kategoriIdsBySantriId = new Map();
		for (const row of kategoriTahunRows) {
			if (!kategoriIdsBySantriId.has(row.santriId)) kategoriIdsBySantriId.set(row.santriId, new Set());
			kategoriIdsBySantriId.get(row.santriId).add(row.kategoriId);
		}

		// Ambil semua pembayaran di TA aktif (dengan join ke jenis pembayaran untuk tahu tipe)
		const allPembayaran = await db
			.select({
				santriId: schema.pembayaran.santriId,
				bulan: schema.pembayaran.bulan,
				tahunTagihan: schema.pembayaran.tahunTagihan,
				nominalDibayar: schema.pembayaran.nominalDibayar,
				keteranganKhusus: schema.pembayaran.keteranganKhusus,
				tipe: schema.jenisPembayaran.tipe
			})
			.from(schema.pembayaran)
			.leftJoin(schema.jenisPembayaran, eq(schema.pembayaran.jenisPembayaranId, schema.jenisPembayaran.id))
			.where(eq(schema.pembayaran.tahunAjaranId, tahunAjaranAktif.id));
		const tunggakanImportAktif = await db
			.select({
				santriId: schema.tunggakanImport.santriId,
				nominalTagihan: schema.tunggakanImport.nominalTagihan,
				keteranganKhusus: schema.tunggakanImport.keteranganKhusus
			})
			.from(schema.tunggakanImport)
			.where(eq(schema.tunggakanImport.tahunAjaranId, tahunAjaranAktif.id));

		// --- Progress per Bulan ---
		// Gunakan semua santri aktif sebagai basis (denominator) sesuai permintaan user
		const baseSantri = santris;

		const endBulanIdx = (taYear === nowYear) ? nowMonth - 1 : 11;
		const bulanTampil = [];

		for (let m = 0; m <= endBulanIdx; m++) {
			const namaBulan = BULAN_NAMES[m];
			const bulanDate = new Date(taYear, m, 1);

			// Santri yang aktif di bulan ini
			const santriWajib = baseSantri.filter(s => {
				if (s.tanggalMasuk) {
					const tglMasuk = new Date(s.tanggalMasuk);
					const masukYM = tglMasuk.getFullYear() * 12 + tglMasuk.getMonth();
					const bulanYM = bulanDate.getFullYear() * 12 + bulanDate.getMonth();
					if (masukYM > bulanYM) return false;
				}
				if (s.tanggalKeluar) {
					const tglKeluar = new Date(s.tanggalKeluar);
					const keluarYM = tglKeluar.getFullYear() * 12 + tglKeluar.getMonth();
					const bulanYM = bulanDate.getFullYear() * 12 + bulanDate.getMonth();
					if (keluarYM < bulanYM) return false;
				}
				return true;
			});

			const totalWajib = santriWajib.length;
			if (totalWajib === 0) continue;

			// Sudah bayar jika: ada record pembayaran di tabel (sesuai riwayat)
			const sudahBayar = santriWajib.filter(s => {
				const hasPayment = allPembayaran.some(p =>
					p.santriId === s.id &&
					p.bulan === namaBulan &&
					Number(p.tahunTagihan || inferTahunTagihan(taName, p.bulan, taYear)) === bulanDate.getFullYear() &&
					p.tipe === 'bulanan'
				);
				return hasPayment;
			}).length;

			const persen = Math.round((sudahBayar / totalWajib) * 100);
			bulanTampil.push({ bulan: namaBulan, tahun: bulanDate.getFullYear(), sudahBayar, totalWajib, persen });
		}
		progressBulanan = bulanTampil;

		// --- Kalkulasi Tunggakan ---
		for (const santri of santris) {
			// Kumpulkan semua kategoriId santri ini
			const allKategoriIds = new Set(kategoriIdsBySantriId.get(santri.id) || []);
			if (santri.kategoriId) allKategoriIds.add(santri.kategoriId);

			// Cek mapping gratis/nominal khusus (pakai kategori pertama yang cocok)
			let nominalPerBulan = santri.nominalSyahriyah ?? 0;
			if (syahriyahJenisId) {
				for (const katId of allKategoriIds) {
					const mapping = customNominals.find(cn => cn.kategoriId === katId && cn.jenisPembayaranId === syahriyahJenisId);
					if (mapping && mapping.nominal !== null) { nominalPerBulan = mapping.nominal; break; }
				}
			}
			
			if (nominalPerBulan === 0) continue;

			const tglMasuk = santri.tanggalMasuk ? new Date(santri.tanggalMasuk) : taStart;
			const startHitung = tglMasuk > taStart ? tglMasuk : taStart;
			const endHitung = santri.tanggalKeluar
				? new Date(Math.min(new Date(santri.tanggalKeluar).getTime(), batasHitung.getTime()))
				: batasHitung;
			if (startHitung > endHitung) continue;

			let bulanWajib = [];
			let cur = new Date(startHitung.getFullYear(), startHitung.getMonth(), 1);
			const endMonth = new Date(endHitung.getFullYear(), endHitung.getMonth(), 1);
			while (cur <= endMonth) {
				bulanWajib.push({
					bulan: BULAN_NAMES[cur.getMonth()],
					tahun: cur.getFullYear()
				});
				cur.setMonth(cur.getMonth() + 1);
			}

			const sudahBayarBulan = new Set(
				allPembayaran
					.filter(p => p.santriId === santri.id && p.tipe === 'bulanan')
					.map(p => {
						const tahunTagihan = Number(p.tahunTagihan || inferTahunTagihan(taName, p.bulan, taYear));
						return `${tahunTagihan}-${p.bulan}`;
					})
			);
			const belumBayar = bulanWajib.filter((periode) =>
				!sudahBayarBulan.has(`${periode.tahun}-${periode.bulan}`)
			);
			const tunggakanSantri = belumBayar.length * nominalPerBulan;

			if (tunggakanSantri > 0) {
				totalTunggakan += tunggakanSantri;
				rincianTunggakan.push({
					nama: santri.namaLengkap,
					jumlahBulan: belumBayar.length,
					nominal: tunggakanSantri
				});
			}
		}

		const customTunggakanBySantri = new Map();
		for (const item of tunggakanImportAktif.filter((row) => !!row.keteranganKhusus && row.santriId)) {
			const key = `${item.santriId}-${String(item.keteranganKhusus || '').trim().toLowerCase()}`;
			if (!customTunggakanBySantri.has(key)) {
				customTunggakanBySantri.set(key, {
					santriId: item.santriId,
					keterangan: item.keteranganKhusus,
					totalTagihan: 0
				});
			}
			customTunggakanBySantri.get(key).totalTagihan += Number(item.nominalTagihan || 0);
		}

		for (const item of customTunggakanBySantri.values()) {
			const totalDibayar = allPembayaran
				.filter((payment) =>
					payment.santriId === item.santriId &&
					String(payment.keteranganKhusus || '').trim().toLowerCase() === String(item.keterangan || '').trim().toLowerCase()
				)
				.reduce((sum, payment) => sum + Number(payment.nominalDibayar || 0), 0);
			const sisa = Math.max(0, item.totalTagihan - totalDibayar);
			if (sisa <= 0) continue;

			const santri = santris.find((row) => row.id === item.santriId);
			totalTunggakan += sisa;
			rincianTunggakan.push({
				nama: santri?.namaLengkap || 'Santri',
				jumlahBulan: 1,
				nominal: sisa
			});
		}
	}

	return {
		stats: {
			totalSantri,
			totalJenisPembayaran,
			pemasukanBulanIni,
			totalTunggakan,
			rincianTunggakan
		},
		santriPerKategori,
		totalSantriAll,
		riwayatTerakhir,
		tahunAjaranAktif,
		progressBulanan
	};
}
