import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

const BULAN_LIST = [
	'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
	'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export async function load({ url }) {
	const nowDate = new Date(); // 2026-03-12
	const bulanParam = url.searchParams.get('bulan') || BULAN_LIST[nowDate.getMonth()];
	const tahunParam = url.searchParams.get('tahun') || String(nowDate.getFullYear());
	const jenisParam = url.searchParams.get('jenis') || 'all';

	// Ambil daftar tahun dari DB
	const tahunList = await db.select().from(schema.tahunAjaran);
	const jenisList = await db.select().from(schema.jenisPembayaran);

	// Ambil semua pembayaran di bulan & tahun yang dipilih (join)
	const semuaPembayaran = await db
		.select({
			id: schema.pembayaran.id,
			nomorKwitansi: schema.pembayaran.nomorKwitansi,
			tanggalBayar: schema.pembayaran.tanggalBayar,
			bulan: schema.pembayaran.bulan,
			nominalDibayar: schema.pembayaran.nominalDibayar,
			namaLengkap: schema.santri.namaLengkap,
			nomorInduk: schema.santri.nomorInduk,
			namaPembayarLain: schema.pembayarLain.namaPembayar,
			nominalSyahriyah: schema.kategoriSantri.nominalSyahriyah,
			namaPembayaran: schema.jenisPembayaran.namaPembayaran,
			tipe: schema.jenisPembayaran.tipe,
			tahunNama: schema.tahunAjaran.nama,
			keteranganKhusus: schema.pembayaran.keteranganKhusus
		})
		.from(schema.pembayaran)
		.leftJoin(schema.santri, eq(schema.pembayaran.santriId, schema.santri.id))
		.leftJoin(schema.pembayarLain, eq(schema.pembayaran.pembayarLainId, schema.pembayarLain.id))
		.leftJoin(schema.kategoriSantri, eq(schema.santri.kategoriId, schema.kategoriSantri.id))
		.leftJoin(schema.jenisPembayaran, eq(schema.pembayaran.jenisPembayaranId, schema.jenisPembayaran.id))
		.leftJoin(schema.tahunAjaran, eq(schema.pembayaran.tahunAjaranId, schema.tahunAjaran.id));

	// Filter: tahun yang dipilih, dan bulan yang dipilih (khusus tipe bulanan)
	// sekali / tahunan: cek di bulan tanggal bayar
	const rekap = semuaPembayaran.filter(p => {
		const cocokTahun = p.tahunNama === tahunParam;
		const cocokJenis = jenisParam === 'all' ? true : String(p.namaPembayaran || '') === jenisParam;
		// cocok bulan: cek field bulan (bulanan) atau bulan dari tanggalBayar (sekali/tahunan)
		let cocokBulan = false;
		if (bulanParam === 'all') {
			cocokBulan = true;
		} else if (p.bulan) {
			// tipe bulanan: gunakan field bulan
			cocokBulan = p.bulan === bulanParam;
		} else if (p.tanggalBayar) {
			// tipe sekali/tahunan: gunakan bulan dari tanggal bayar
			const tglBayar = new Date(p.tanggalBayar);
			cocokBulan = BULAN_LIST[tglBayar.getMonth()] === bulanParam;
		}
		return cocokTahun && cocokBulan && cocokJenis;
	}).map((p) => {
		const namaPembayar = p.namaLengkap || p.namaPembayarLain || '-';
		const kategoriRekap = p.namaPembayarLain ? 'Pembayar Umum' : 'Santri';
		const nominalRekap = p.nominalDibayar || 0;

		return {
			...p,
			namaPembayar,
			kategoriRekap,
			nominalRekap
		};
	});

	// Rekap per jenis pembayaran (untuk ringkasan)
	const ringkasanPerJenis = {};
	for (const p of rekap) {
		const key = p.namaPembayaran || 'Lainnya';
		if (!ringkasanPerJenis[key]) {
			ringkasanPerJenis[key] = { nama: key, jumlahTransaksi: 0, totalNominal: 0 };
		}
		ringkasanPerJenis[key].jumlahTransaksi++;
		ringkasanPerJenis[key].totalNominal += p.nominalRekap;
	}

	const ringkasanPerKategori = {};
	for (const p of rekap) {
		const key = p.kategoriRekap;
		if (!ringkasanPerKategori[key]) {
			ringkasanPerKategori[key] = { nama: key, jumlahTransaksi: 0, totalNominal: 0 };
		}
		ringkasanPerKategori[key].jumlahTransaksi++;
		ringkasanPerKategori[key].totalNominal += p.nominalRekap;
	}

	const totalPemasukan = rekap.reduce((sum, p) => sum + (p.nominalRekap || 0), 0);

	return {
		rekap,
		ringkasanPerJenis: Object.values(ringkasanPerJenis),
		ringkasanPerKategori: Object.values(ringkasanPerKategori),
		totalPemasukan,
		bulanList: BULAN_LIST,
		tahunList,
		jenisList,
		filterBulan: bulanParam,
		filterTahun: tahunParam,
		filterJenis: jenisParam
	};
}
