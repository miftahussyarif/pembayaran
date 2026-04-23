export const GET = async () => {
	const header = [
		'nomor_induk', 'nama_lengkap', 'tahun_ajaran', 'kategori', 'tanggal_masuk', 'tanggal_keluar', 'is_active',
		'tanggal_mulai_smp', 'tanggal_mulai_smk',
		'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'golongan_darah', 'nik', 'no_kk',
		'anak_ke', 'jumlah_saudara', 'tinggi_cm', 'berat_kg', 'alamat_lengkap', 'rt', 'rw',
		'desa_kelurahan', 'kecamatan', 'kabupaten', 'provinsi', 'no_kip', 'no_kis_kps_pkh',
		'kebutuhan_khusus', 'nama_ayah', 'tanggal_lahir_ayah', 'pendidikan_ayah', 'nik_ayah',
		'alamat_ayah', 'no_hp_ayah', 'pekerjaan_ayah', 'penghasilan_ayah', 'nama_ibu',
		'tanggal_lahir_ibu', 'pendidikan_ibu', 'nik_ibu', 'alamat_ibu', 'pekerjaan_ibu', 'penghasilan_ibu'
	];
	const rows = [
		[
			'24001', 'Ahmad Fauzi', '2022/2023', 'Reguler', '2022-07-01', '', '1',
			'2022-07-01', '',
			'Jakarta', '2010-01-01', 'Laki-Laki', 'A', '1234567890123456', '1234567890123456',
			'1', '2', '150', '45', 'Jl. Merdeka No. 1', '01', '02',
			'Gambir', 'Gambir', 'Jakarta Pusat', 'DKI Jakarta', '', '',
			'Tidak', 'Slamet', '1980-05-05', 'SMA/SMK/MA', '3216549870123456',
			'Jl. Merdeka No. 1', '081234567890', 'Wiraswasta', '5000000', 'Siti',
			'1982-08-08', 'SMA/SMK/MA', '3216549870654321', 'Jl. Merdeka No. 1', 'Ibu Rumah Tangga', '0'
		],
		[
			'24001', 'Ahmad Fauzi', '2023/2024', 'Kakak Beradik', '', '', '',
			'', '',
			'', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
		],
		[
			'24002', 'Budi', '2022/2023', 'Yatim,SMK', '2022-07-01', '', '1',
			'', '2022-07-01',
			'Bandung', '2011-02-02', 'Laki-Laki', 'B', '9876543210987654', '9876543210987654',
			'2', '3', '155', '50', 'Jl. Asia Afrika', '03', '04',
			'Braga', 'Sumur Bandung', 'Bandung', 'Jawa Barat', '', '',
			'Tidak', 'Samsudin', '1979-03-03', 'SMA/SMK/MA', '6543210987654321',
			'Jl. Asia Afrika', '082345678901', 'Karyawan', '4000000', 'Sari',
			'1983-09-09', 'SMA/SMK/MA', '6543210987654321', 'Jl. Asia Afrika', 'Ibu Rumah Tangga', '0'
		],
		[
			'24002', 'Budi', '2023/2024', 'Yatim,SMK,Kakak Beradik', '', '', '',
			'', '',
			'', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
		]
	];

	const csvEscape = (value) => {
		const v = value === null || value === undefined ? '' : String(value);
		return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
	};

	const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="sample-import-santri.csv"'
		}
	});
};
