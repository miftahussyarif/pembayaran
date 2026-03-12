export const GET = async () => {
	const header = ['nomor_induk', 'nama_lengkap', 'kategori', 'tanggal_masuk', 'tanggal_keluar', 'is_active'];
	const rows = [
		['24001', 'Ahmad Fauzi', 'Reguler', '2024-07-01', '', '1'],
		['24002', 'Siti Aisyah', 'Yatim', '2024-07-05', '', '1'],
		['24003', 'Budi Santoso', '', '2024-07-10', '2025-01-15', '0']
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
