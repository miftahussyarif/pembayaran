import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { sql, count, sum, eq } from 'drizzle-orm';

export async function load() {
	const now = new Date(); // 2026-03-12
	const nowYear = now.getFullYear();
	const nowMonth = now.getMonth() + 1; // 1-12

	const BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni',
		'Juli','Agustus','September','Oktober','November','Desember'];

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

	let totalTunggakan = 0;
	let rincianTunggakan = [];
	let progressBulanan = [];

	if (tahunAjaranAktif) {
		const taName = tahunAjaranAktif.nama.toString();
		const taYear = parseInt(taName.includes('/') ? taName.split('/')[0] : taName);

		const taStart = new Date(taYear, 0, 1);
		const taEnd   = new Date(taYear, 11, 31);
		const batasHitung = now < taEnd ? now : taEnd;

		// Ambil SEMUA santri aktif beserta kategori
		const santris = await db
			.select({
				id: schema.santri.id,
				namaLengkap: schema.santri.namaLengkap,
				tanggalMasuk: schema.santri.tanggalMasuk,
				tanggalKeluar: schema.santri.tanggalKeluar,
				nominalSyahriyah: schema.kategoriSantri.nominalSyahriyah
			})
			.from(schema.santri)
			.leftJoin(schema.kategoriSantri, eq(schema.santri.kategoriId, schema.kategoriSantri.id))
			.where(sql`${schema.santri.isActive} = 1`);

		// Ambil semua pembayaran di TA aktif (dengan join ke jenis pembayaran untuk tahu tipe)
		const allPembayaran = await db
			.select({
				santriId: schema.pembayaran.santriId,
				bulan: schema.pembayaran.bulan,
				nominalDibayar: schema.pembayaran.nominalDibayar,
				tipe: schema.jenisPembayaran.tipe
			})
			.from(schema.pembayaran)
			.leftJoin(schema.jenisPembayaran, eq(schema.pembayaran.jenisPembayaranId, schema.jenisPembayaran.id))
			.where(eq(schema.pembayaran.tahunAjaranId, tahunAjaranAktif.id));

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
					p.tipe === 'bulanan'
				);
				return hasPayment;
			}).length;

			const persen = Math.round((sudahBayar / totalWajib) * 100);
			bulanTampil.push({ bulan: namaBulan, tahun: taYear, sudahBayar, totalWajib, persen });
		}
		progressBulanan = bulanTampil;

		// --- Kalkulasi Tunggakan ---
		for (const santri of santris) {
			const nominalPerBulan = santri.nominalSyahriyah ?? 0;
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
				bulanWajib.push(BULAN_NAMES[cur.getMonth()]);
				cur.setMonth(cur.getMonth() + 1);
			}

			const sudahBayarBulan = new Set(
				allPembayaran
					.filter(p => p.santriId === santri.id && p.tipe === 'bulanan')
					.map(p => p.bulan)
			);
			const belumBayar = bulanWajib.filter(b => !sudahBayarBulan.has(b));
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
	}

	return {
		stats: {
			totalSantri,
			totalJenisPembayaran,
			pemasukanBulanIni,
			totalTunggakan,
			rincianTunggakan
		},
		tahunAjaranAktif,
		progressBulanan
	};
}
