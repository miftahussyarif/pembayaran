import * as XLSX from 'xlsx';

export const GET = async () => {
	const header = [
		'nomor_induk', 'nama_lengkap', 'kategori', 'tanggal_masuk', 'tanggal_keluar', 'is_active',
		'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'golongan_darah', 'nik', 'no_kk',
		'anak_ke', 'jumlah_saudara', 'tinggi_cm', 'berat_kg', 'alamat_lengkap', 'rt', 'rw',
		'desa_kelurahan', 'kecamatan', 'kabupaten', 'provinsi', 'no_kip', 'no_kis_kps_pkh',
		'kebutuhan_khusus', 'nama_ayah', 'tanggal_lahir_ayah', 'pendidikan_ayah', 'nik_ayah',
		'alamat_ayah', 'no_hp_ayah', 'pekerjaan_ayah', 'penghasilan_ayah', 'nama_ibu',
		'tanggal_lahir_ibu', 'pendidikan_ibu', 'nik_ibu', 'alamat_ibu', 'pekerjaan_ibu', 'penghasilan_ibu'
	];
	const rows = [
		[
			'24001', 'Ahmad Fauzi', 'Reguler', '2024-07-01', '', '1',
			'Jakarta', '2010-01-01', 'Laki-Laki', 'A', '1234567890123456', '1234567890123456',
			'1', '2', '150', '45', 'Jl. Merdeka No. 1', '01', '02',
			'Gambir', 'Gambir', 'Jakarta Pusat', 'DKI Jakarta', '', '',
			'Tidak', 'Slamet', '1980-05-05', 'SMA/SMK/MA', '3216549870123456',
			'Jl. Merdeka No. 1', '081234567890', 'Wiraswasta', '5000000', 'Siti',
			'1982-08-08', 'SMA/SMK/MA', '3216549870654321', 'Jl. Merdeka No. 1', 'Ibu Rumah Tangga', '0'
		]
	];

	const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Santri');

	const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename="sample-import-santri.xlsx"'
		}
	});
};
