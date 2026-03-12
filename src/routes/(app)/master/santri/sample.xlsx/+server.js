import * as XLSX from 'xlsx';

export const GET = async () => {
	const header = ['nomor_induk', 'nama_lengkap', 'kategori', 'tanggal_masuk', 'tanggal_keluar', 'is_active'];
	const rows = [
		['24001', 'Ahmad Fauzi', 'Reguler', '2024-07-01', '', '1'],
		['24002', 'Siti Aisyah', 'Yatim', '2024-07-05', '', '1'],
		['24003', 'Budi Santoso', '', '2024-07-10', '2025-01-15', '0']
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
