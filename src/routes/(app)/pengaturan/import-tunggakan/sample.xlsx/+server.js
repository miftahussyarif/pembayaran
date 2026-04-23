import * as XLSX from 'xlsx';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';

export const GET = async ({ locals }) => {
	if (locals.user?.role !== 'admin') {
		return new Response('Forbidden', { status: 403 });
	}

	const santri = await db.select().from(schema.santri);
	const tahunAjaran = await db.select().from(schema.tahunAjaran);
	const kategoris = await db.select().from(schema.kategoriSantri);
	let jenisPembayaran = await db.select().from(schema.jenisPembayaran);
	const jenisKhusus = jenisPembayaran.find((item) => item.namaPembayaran === 'Pembayaran Lain-lain')
		|| { id: '', namaPembayaran: 'Pembayaran Lain-lain', tipe: 'sekali', nominalDefault: 0 };
	if (!jenisPembayaran.some((item) => item.namaPembayaran === 'Pembayaran Lain-lain')) {
		jenisPembayaran = [...jenisPembayaran, jenisKhusus];
	}

	const workbook = XLSX.utils.book_new();
	const importRows = [
		['nomor_induk', 'nama_santri', 'kategori_santri', 'nama_pembayar', 'tahun_ajaran', 'jenis_pembayaran', 'tipe_tagihan', 'bulan_mulai_tunggakan', 'tahun_mulai_tunggakan', 'nominal_total_tagihan', 'nominal_tunggakan', 'keterangan', 'catatan'],
		['24001', 'Ahmad Fauzi', 'Reguler', '', '2021/2022', 'SPP SMK', 'bulanan', 'Mei', '2022', '', '200000', '', 'Sistem akan merekam kategori Reguler untuk 2021/2022'],
		['24001', 'Ahmad Fauzi', 'Kakak Beradik', '', '2022/2023', 'Pengembangan', 'sekali', '', '', '1000000', '500000', '', 'Bisa ubah kategori di tahun berbeda. Sistem akan merekam Kakak Beradik untuk 2022/2023'],
		['24002', 'Aisyah Yatim', 'Yatim', '', '2022/2023', 'SPP SMP', 'smp_bulanan', 'Juli', '2022', '120000', '120000', '', 'Akan ikut aturan kategori Yatim saat tagihan ditampilkan'],
		['', '', '', 'Wali Santri Baru', '2022/2023', jenisKhusus.namaPembayaran, 'khusus', '', '', '300000', '125000', 'Kekurangan seragam', 'Nama belum ada di data santri']
	];
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(importRows), 'Import Tunggakan');

	const petunjukRows = [
		['Kolom wajib', 'tahun_ajaran, nominal_tunggakan, lalu isi nomor_induk atau nama_pembayar'],
		['Kategori santri per tahun', 'Isi kategori_santri. Sistem akan menyimpan kategori ini khusus untuk tahun_ajaran yang dipilih, memungkinkan santri berubah kategori di tahun berbeda.'],
		['Bulanan mudah', 'Isi bulan_mulai_tunggakan dan tahun_mulai_tunggakan, lalu nominal_tunggakan total. Sistem akan membuat urutan bulan tunggakan otomatis berdasarkan nominal per bulan yang berlaku.'],
		['Bulanan kategori', 'Jika kategori membuat nominal 0/gratis untuk jenis tersebut, baris tidak akan diimport agar konsisten dengan pengaturan pembayaran.'],
		['Tahunan/Sekali', 'Bulan dan tahun_tagihan boleh kosong.'],
		['Auto master santri', 'Jika nomor_induk diisi tetapi belum ada di database, sistem otomatis membuat data santri memakai nomor induk dan nama_santri dari Excel.'],
		['Auto SMP/SMK', 'Jika muncul tagihan bertipe smp_* atau smk_*, sistem otomatis membuat data siswa 36 bulan mulai Juli tahun ajaran pertama.'],
		['Custom', 'Isi keterangan. Untuk nama yang belum ada di santri, gunakan nama_pembayar dan tipe_tagihan=khusus.'],
		['Kekurangan', 'Jika nominal_total_tagihan lebih besar dari nominal_tunggakan, selisihnya otomatis dibuat transaksi lunas histori.'],
		['Duplikasi', 'Import ulang dengan kombinasi data yang sama akan mengganti nominal sebelumnya dan memperbarui kwitansi import otomatis.']
	];
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(petunjukRows), 'Petunjuk');

	const santriRows = [
		['nomor_induk', 'nama_santri', 'kategori_id', 'status'],
		...santri.map((item) => [item.nomorInduk, item.namaLengkap, item.kategoriId || '', item.isActive ? 'Aktif' : 'Nonaktif'])
	];
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(santriRows), 'Referensi Santri');

	const tahunRows = [
		['id', 'tahun_ajaran', 'aktif'],
		...tahunAjaran.map((item) => [item.id, item.nama, item.isActive ? 'Ya' : 'Tidak'])
	];
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(tahunRows), 'Referensi Tahun');

	const jenisRows = [
		['id', 'jenis_pembayaran', 'tipe', 'nominal_default'],
		...jenisPembayaran.map((item) => [item.id, item.namaPembayaran, item.tipe, item.nominalDefault])
	];
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(jenisRows), 'Referensi Jenis');

	const kategoriRows = [
		['id', 'kategori_santri', 'nominal_syahriyah', 'nominal_konsumsi'],
		...kategoris.map((item) => [item.id, item.namaKategori, item.nominalSyahriyah, item.nominalKonsumsi])
	];
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(kategoriRows), 'Referensi Kategori');

	const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename="template-import-tunggakan.xlsx"'
		}
	});
};
