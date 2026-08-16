import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, inArray, or, and, lt, gt } from 'drizzle-orm';
import * as XLSX from 'xlsx';

const parseCsv = (text) => {
	const rows = [];
	let row = [];
	let field = '';
	let inQuotes = false;
	const pushField = () => {
		row.push(field);
		field = '';
	};
	const pushRow = () => {
		if (row.length === 1 && row[0].trim() === '') return;
		rows.push(row);
		row = [];
	};
	const normalized = text.replace(/^\uFEFF/, '');
	for (let i = 0; i < normalized.length; i++) {
		const char = normalized[i];
		const next = normalized[i + 1];
		if (inQuotes) {
			if (char === '"' && next === '"') {
				field += '"';
				i++;
			} else if (char === '"') {
				inQuotes = false;
			} else {
				field += char;
			}
			continue;
		}
		if (char === '"') {
			inQuotes = true;
			continue;
		}
		if (char === ',') {
			pushField();
			continue;
		}
		if (char === '\n') {
			pushField();
			pushRow();
			continue;
		}
		if (char === '\r') {
			if (next === '\n') i++;
			pushField();
			pushRow();
			continue;
		}
		field += char;
	}
	if (field.length || row.length) {
		pushField();
		pushRow();
	}
	return rows;
};

const normalizeHeader = (value) => value.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

const toBool = (value, defaultValue = true) => {
	if (value === undefined || value === null || value === '') return defaultValue;
	const v = String(value).trim().toLowerCase();
	if (['1', 'true', 'ya', 'y', 'aktif', 'on'].includes(v)) return true;
	if (['0', 'false', 'tidak', 'n', 'nonaktif', 'off'].includes(v)) return false;
	return defaultValue;
};

const insertInBatches = async (tx, table, rows, batchSize = 100) => {
	for (let i = 0; i < rows.length; i += batchSize) {
		const batch = rows.slice(i, i + batchSize);
		await tx.insert(table).values(batch);
	}
};

const getSortYear = (nama) => {
	const years = String(nama || '').match(/\d{4}/g);
	if (!years?.length) return 0;
	return Math.max(...years.map(Number));
};

const sortTahunAjarans = (tahunAjarans) => {
	return [...tahunAjarans].sort((a, b) => {
		const yearDiff = getSortYear(b.nama) - getSortYear(a.nama);
		if (yearDiff !== 0) return yearDiff;
		return b.id - a.id;
	});
};

const getTanggalMasukYear = (tanggalMasuk, tahunAjarans) => {
	if (tanggalMasuk) {
		const parsed = new Date(`${tanggalMasuk}T00:00:00`);
		if (!Number.isNaN(parsed.getTime())) return parsed.getFullYear();
	}

	const years = tahunAjarans.map((tahun) => getSortYear(tahun.nama)).filter(Boolean);
	return years.length ? Math.min(...years) : 0;
};

const expandKategoriTahunRows = ({ kategoriTahunList, tahunAjarans, tanggalMasuk }) => {
	const rows = [];
	const seen = new Set();
	const startYear = getTanggalMasukYear(tanggalMasuk, tahunAjarans);

	for (const entry of kategoriTahunList) {
		const kategoriIds = Array.isArray(entry.kategoriIds) ? entry.kategoriIds : [];
		const targetTahunAjarans = entry.tahunAjaranId === 'all'
			? tahunAjarans.filter((tahun) => getSortYear(tahun.nama) >= startYear)
			: tahunAjarans.filter((tahun) => tahun.id === Number(entry.tahunAjaranId));

		for (const tahunAjaran of targetTahunAjarans) {
			for (const kategoriId of kategoriIds) {
				const kid = Number(kategoriId);
				if (!tahunAjaran.id || !kid) continue;
				const key = `${tahunAjaran.id}:${kid}`;
				if (seen.has(key)) continue;
				seen.add(key);
				rows.push({ tahunAjaranId: tahunAjaran.id, kategoriId: kid });
			}
		}
	}

	return rows;
};

export async function load() {
	const santris = await db.select().from(schema.santri);
	const santriDetails = await db.select().from(schema.santriDetail);
	const kategoris = await db.select().from(schema.kategoriSantri).orderBy(schema.kategoriSantri.namaKategori);
	const tahunAjarans = sortTahunAjarans(await db.select().from(schema.tahunAjaran));
	const kategoriTahunRows = await db.select().from(schema.santriKategoriTahun);

	const detailBySantriId = new Map(santriDetails.map((d) => [d.santriId, d]));

	// Group kategori-tahun per santri
	const kategoriTahunBySantriId = new Map();
	for (const row of kategoriTahunRows) {
		if (!kategoriTahunBySantriId.has(row.santriId)) {
			kategoriTahunBySantriId.set(row.santriId, []);
		}
		kategoriTahunBySantriId.get(row.santriId).push(row);
	}

	const santrisWithDetail = santris.map((s) => ({
		...s,
		detail: detailBySantriId.get(s.id) || null,
		kategoriTahun: kategoriTahunBySantriId.get(s.id) || [],
		tahunMasuk: s.tanggalMasuk ? parseInt(s.tanggalMasuk.split('-')[0]) : null
	}));

	const parseTahunAjaranStartYear = (nama) => {
		const normalized = String(nama || '').trim();
		const slashMatch = normalized.match(/^(\d{4})\s*\/\s*(\d{4})$/);
		if (slashMatch) return Number(slashMatch[1]);
		const years = normalized.match(/\d{4}/g);
		if (years?.length) return Math.min(...years.map(Number));
		return null;
	};

	const tahunMasukOptions = tahunAjarans
		.map((t) => ({
			label: t.nama,
			value: parseTahunAjaranStartYear(t.nama)
		}))
		.filter((t) => t.value)
		.sort((a, b) => b.value - a.value);

	return { santris: santrisWithDetail, kategoris, tahunAjarans, tahunMasukOptions };
}

export const actions = {
	create: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const nomorInduk = data.get('nomorInduk');
		const namaLengkap = data.get('namaLengkap');
		const tanggalMasuk = data.get('tanggalMasuk') || null;
		const tanggalKeluar = data.get('tanggalKeluar') || null;
		let isActive = data.get('isActive') === 'on';

		if (tanggalKeluar) {
			const today = new Date();
			const pad = (n) => String(n).padStart(2, '0');
			const localDateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
			if (tanggalKeluar <= localDateStr) {
				isActive = false;
			}
		}
		// Parsing multi-kategori per tahun ajaran dari JSON field
		let kategoriTahunList = [];
		try {
			const raw = data.get('kategoriTahunJson');
			if (raw) kategoriTahunList = JSON.parse(raw);
		} catch (e) { kategoriTahunList = []; }

		const toText = (value) => {
			if (value === null || value === undefined) return null;
			const text = value.toString().trim();
			return text === '' ? null : text;
		};
		const toNumber = (value) => {
			if (value === null || value === undefined || value === '') return null;
			const num = Number(value);
			return Number.isFinite(num) ? num : null;
		};

		const detailData = {
			tempatLahir: toText(data.get('tempatLahir')),
			tanggalLahir: toText(data.get('tanggalLahir')),
			jenisKelamin: toText(data.get('jenisKelamin')),
			golonganDarah: toText(data.get('golonganDarah')),
			nik: toText(data.get('nik')),
			noKk: toText(data.get('noKk')),
			anakKe: toNumber(data.get('anakKe')),
			jumlahSaudara: toNumber(data.get('jumlahSaudara')),
			tinggiCm: toNumber(data.get('tinggiCm')),
			beratKg: toNumber(data.get('beratKg')),
			alamatLengkap: toText(data.get('alamatLengkap')),
			rt: toText(data.get('rt')),
			rw: toText(data.get('rw')),
			desaKelurahan: toText(data.get('desaKelurahan')),
			kecamatan: toText(data.get('kecamatan')),
			kabupaten: toText(data.get('kabupaten')),
			provinsi: toText(data.get('provinsi')),
			noKip: toText(data.get('noKip')),
			noKisKpsPkh: toText(data.get('noKisKpsPkh')),
			kebutuhanKhusus: toText(data.get('kebutuhanKhusus')),
			namaAyah: toText(data.get('namaAyah')),
			tanggalLahirAyah: toText(data.get('tanggalLahirAyah')),
			pendidikanAyah: toText(data.get('pendidikanAyah')),
			nikAyah: toText(data.get('nikAyah')),
			alamatAyah: toText(data.get('alamatAyah')),
			noHpAyah: toText(data.get('noHpAyah')),
			pekerjaanAyah: toText(data.get('pekerjaanAyah')),
			penghasilanAyah: toNumber(data.get('penghasilanAyah')),
			namaIbu: toText(data.get('namaIbu')),
			tanggalLahirIbu: toText(data.get('tanggalLahirIbu')),
			pendidikanIbu: toText(data.get('pendidikanIbu')),
			nikIbu: toText(data.get('nikIbu')),
			alamatIbu: toText(data.get('alamatIbu')),
			pekerjaanIbu: toText(data.get('pekerjaanIbu')),
			penghasilanIbu: toNumber(data.get('penghasilanIbu'))
		};

		try {
			await db.transaction(async (tx) => {
				const [newSantri] = await tx
					.insert(schema.santri)
					.values({ nomorInduk, namaLengkap, tanggalMasuk, tanggalKeluar, isActive })
					.returning();
				await tx.insert(schema.santriDetail).values({ santriId: newSantri.id, ...detailData });

				// Insert relasi multi-kategori per tahun ajaran
				const tahunAjarans = await tx.select().from(schema.tahunAjaran);
				const expandedKategoriRows = expandKategoriTahunRows({ kategoriTahunList, tahunAjarans, tanggalMasuk });
				for (const row of expandedKategoriRows) {
					await tx.insert(schema.santriKategoriTahun).values({ santriId: newSantri.id, ...row });
				}

				try {
					await tx.insert(schema.systemLogs).values({
						userId: locals.user?.id || null,
						username: locals.user?.username || null,
						role: locals.user?.role || null,
						aksi: 'create',
						modul: 'master-santri',
						keterangan: `Tambah santri: ${namaLengkap} (${nomorInduk})`,
						ip: getClientAddress(),
						createdAt: new Date().toISOString()
					});
				} catch (e) {
					// ignore
				}
			});
			return { success: true };
		} catch (error) {
			console.error(error);
			return { success: false, error: 'Gagal menambah, mungkin nomor induk sudah ada.' };
		}
	},

	update: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const nomorInduk = data.get('nomorInduk')?.toString().trim();
		const namaLengkap = data.get('namaLengkap')?.toString().trim();
		const tanggalMasuk = data.get('tanggalMasuk') || null;
		const tanggalKeluar = data.get('tanggalKeluar') || null;
		let isActive = data.get('isActive') === 'on';

		if (tanggalKeluar) {
			const today = new Date();
			const pad = (n) => String(n).padStart(2, '0');
			const localDateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
			if (tanggalKeluar <= localDateStr) {
				isActive = false;
			}
		}
		// Parsing multi-kategori per tahun ajaran
		let kategoriTahunList = [];
		try {
			const raw = data.get('kategoriTahunJson');
			if (raw) kategoriTahunList = JSON.parse(raw);
		} catch (e) { kategoriTahunList = []; }
		const toText = (value) => {
			if (value === null || value === undefined) return null;
			const text = value.toString().trim();
			return text === '' ? null : text;
		};
		const toNumber = (value) => {
			if (value === null || value === undefined || value === '') return null;
			const num = Number(value);
			return Number.isFinite(num) ? num : null;
		};
		const detailData = {
			tempatLahir: toText(data.get('tempatLahir')),
			tanggalLahir: toText(data.get('tanggalLahir')),
			jenisKelamin: toText(data.get('jenisKelamin')),
			golonganDarah: toText(data.get('golonganDarah')),
			nik: toText(data.get('nik')),
			noKk: toText(data.get('noKk')),
			anakKe: toNumber(data.get('anakKe')),
			jumlahSaudara: toNumber(data.get('jumlahSaudara')),
			tinggiCm: toNumber(data.get('tinggiCm')),
			beratKg: toNumber(data.get('beratKg')),
			alamatLengkap: toText(data.get('alamatLengkap')),
			rt: toText(data.get('rt')),
			rw: toText(data.get('rw')),
			desaKelurahan: toText(data.get('desaKelurahan')),
			kecamatan: toText(data.get('kecamatan')),
			kabupaten: toText(data.get('kabupaten')),
			provinsi: toText(data.get('provinsi')),
			noKip: toText(data.get('noKip')),
			noKisKpsPkh: toText(data.get('noKisKpsPkh')),
			kebutuhanKhusus: toText(data.get('kebutuhanKhusus')),
			namaAyah: toText(data.get('namaAyah')),
			tanggalLahirAyah: toText(data.get('tanggalLahirAyah')),
			pendidikanAyah: toText(data.get('pendidikanAyah')),
			nikAyah: toText(data.get('nikAyah')),
			alamatAyah: toText(data.get('alamatAyah')),
			noHpAyah: toText(data.get('noHpAyah')),
			pekerjaanAyah: toText(data.get('pekerjaanAyah')),
			penghasilanAyah: toNumber(data.get('penghasilanAyah')),
			namaIbu: toText(data.get('namaIbu')),
			tanggalLahirIbu: toText(data.get('tanggalLahirIbu')),
			pendidikanIbu: toText(data.get('pendidikanIbu')),
			nikIbu: toText(data.get('nikIbu')),
			alamatIbu: toText(data.get('alamatIbu')),
			pekerjaanIbu: toText(data.get('pekerjaanIbu')),
			penghasilanIbu: toNumber(data.get('penghasilanIbu'))
		};

		try {
			await db.update(schema.santri)
				.set({ nomorInduk, namaLengkap, tanggalMasuk, tanggalKeluar, isActive })
				.where(eq(schema.santri.id, id));

			if (tanggalMasuk) {
				const tm = new Date(tanggalMasuk);
				if (!isNaN(tm.getTime())) {
					const mYear = tm.getFullYear();
					const mMonth = tm.getMonth() + 1;
					await db.delete(schema.santriKeaktifan)
						.where(
							and(
								eq(schema.santriKeaktifan.santriId, id),
								or(
									lt(schema.santriKeaktifan.tahun, mYear),
									and(
										eq(schema.santriKeaktifan.tahun, mYear),
										lt(schema.santriKeaktifan.bulan, mMonth)
									)
								)
							)
						);
				}
			}

			if (!isActive && tanggalKeluar) {
				const tk = new Date(tanggalKeluar);
				if (!isNaN(tk.getTime())) {
					const kYear = tk.getFullYear();
					const kMonth = tk.getMonth() + 1;
					await db.delete(schema.santriKeaktifan)
						.where(
							and(
								eq(schema.santriKeaktifan.santriId, id),
								or(
									gt(schema.santriKeaktifan.tahun, kYear),
									and(
										eq(schema.santriKeaktifan.tahun, kYear),
										gt(schema.santriKeaktifan.bulan, kMonth)
									)
								)
							)
						);
				}
			}
			const [currentDetail] = await db
				.select()
				.from(schema.santriDetail)
				.where(eq(schema.santriDetail.santriId, id));
			if (currentDetail) {
				await db.update(schema.santriDetail)
					.set(detailData)
					.where(eq(schema.santriDetail.santriId, id));
			} else {
				await db.insert(schema.santriDetail).values({ santriId: id, ...detailData });
			}

			// Reset dan insert ulang relasi kategori-tahun
			await db.delete(schema.santriKategoriTahun).where(eq(schema.santriKategoriTahun.santriId, id));
			const tahunAjarans = await db.select().from(schema.tahunAjaran);
			const expandedKategoriRows = expandKategoriTahunRows({ kategoriTahunList, tahunAjarans, tanggalMasuk });
			for (const row of expandedKategoriRows) {
				await db.insert(schema.santriKategoriTahun).values({ santriId: id, ...row });
			}

			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'update',
					modul: 'master-santri',
					keterangan: `Update santri id=${id} (${namaLengkap})`,
					ip: getClientAddress(),
					createdAt: new Date().toISOString()
				});
			} catch (e) {
				// ignore logging errors
			}
			return { success: true };
		} catch (error) {
			return { success: false, error: 'Gagal memperbarui data santri.' };
		}
	},

	toggleAktif: async ({ request, locals, getClientAddress }) => {
		try {
			const data = await request.formData();
			const id = Number(data.get('id'));

			const [current] = await db.select().from(schema.santri).where(eq(schema.santri.id, id));
			if (!current) return { success: false, error: 'Santri tidak ditemukan.' };

			let newTanggalKeluar = current.tanggalKeluar;
			if (current.isActive) {
				const today = new Date();
				const pad = (n) => String(n).padStart(2, '0');
				newTanggalKeluar = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
			} else {
				newTanggalKeluar = null;
			}

			await db.update(schema.santri).set({ isActive: !current.isActive, tanggalKeluar: newTanggalKeluar }).where(eq(schema.santri.id, id));

			if (current.isActive && newTanggalKeluar) {
				const tk = new Date(newTanggalKeluar);
				if (!isNaN(tk.getTime())) {
					const kYear = tk.getFullYear();
					const kMonth = tk.getMonth() + 1;
					await db.delete(schema.santriKeaktifan)
						.where(
							and(
								eq(schema.santriKeaktifan.santriId, id),
								or(
									gt(schema.santriKeaktifan.tahun, kYear),
									and(
										eq(schema.santriKeaktifan.tahun, kYear),
										gt(schema.santriKeaktifan.bulan, kMonth)
									)
								)
							)
						);
				}
			}
			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'update',
					modul: 'master-santri',
					keterangan: `Toggle aktif santri id=${id} -> ${!current.isActive}`,
					ip: getClientAddress(),
					createdAt: new Date().toISOString()
				});
			} catch (e) {
				// ignore logging errors
			}
			return { success: true };
		} catch (error) {
			console.error("Error toggleAktif:", error);
			return { success: false, error: 'Terjadi kesalahan saat mengubah status santri.' };
		}
	},

	delete: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		try {
			// Hapus relasi kategori-tahun dulu
			await db.delete(schema.santriKeaktifan).where(eq(schema.santriKeaktifan.santriId, id));
			await db.delete(schema.santriKategoriTahun).where(eq(schema.santriKategoriTahun.santriId, id));
			await db.delete(schema.santriDetail).where(eq(schema.santriDetail.santriId, id));
			await db.delete(schema.santri).where(eq(schema.santri.id, id));
			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'delete',
					modul: 'master-santri',
					keterangan: `Hapus santri id=${id}`,
					ip: getClientAddress(),
					createdAt: new Date().toISOString()
				});
			} catch (e) {
				// ignore logging errors
			}
			return { success: true };
		} catch (error) {
			console.error('Error deleting santri:', error);
			const msg = String(error?.message || '').toLowerCase();
			let detail = 'Gagal menghapus santri.';
			if (msg.includes('foreign key') || msg.includes('constraint')) {
				// Cek relasi yang masih ada
				const relasi = [];
				const [keaktifan] = await db.select({ id: schema.santriKeaktifan.id }).from(schema.santriKeaktifan).where(eq(schema.santriKeaktifan.santriId, id));
				if (keaktifan) relasi.push('Keaktifan Santri');
				const [smk] = await db.select({ id: schema.santriSmk.id }).from(schema.santriSmk).where(eq(schema.santriSmk.santriId, id));
				if (smk) relasi.push('Data Siswa SMK');
				const [smp] = await db.select({ id: schema.santriSmp.id }).from(schema.santriSmp).where(eq(schema.santriSmp.santriId, id));
				if (smp) relasi.push('Data Siswa SMP');
				const [pembayaran] = await db.select({ id: schema.pembayaran.id }).from(schema.pembayaran).where(eq(schema.pembayaran.santriId, id));
				if (pembayaran) relasi.push('Data Pembayaran');
				const [tunggakan] = await db.select({ id: schema.tunggakanImport.id }).from(schema.tunggakanImport).where(eq(schema.tunggakanImport.santriId, id));
				if (tunggakan) relasi.push('Data Tunggakan/Tagihan Khusus');
				detail = relasi.length
					? `Tidak bisa menghapus santri karena masih memiliki data terkait: ${relasi.join(', ')}. Hapus data terkait terlebih dahulu.`
					: 'Tidak bisa menghapus santri karena masih terkait dengan data lain.';
			}
			return { success: false, error: detail };
		}
	},

	bulkDelete: async ({ request, locals, getClientAddress }) => {
		if (locals.user?.role !== 'admin') return { success: false, error: 'Unauthorized' };
		const data = await request.formData();
		let ids = [];
		try {
			ids = JSON.parse(data.get('ids'));
		} catch (e) {}

		if (!Array.isArray(ids) || ids.length === 0) return { success: false, error: 'Tidak ada santri yang dipilih.' };

		try {
			// Hapus relasi kategori-tahun dulu
			await db.delete(schema.santriKeaktifan).where(inArray(schema.santriKeaktifan.santriId, ids));
			await db.delete(schema.santriKategoriTahun).where(inArray(schema.santriKategoriTahun.santriId, ids));
			await db.delete(schema.santriDetail).where(inArray(schema.santriDetail.santriId, ids));
			await db.delete(schema.santri).where(inArray(schema.santri.id, ids));
			
			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'delete',
					modul: 'master-santri',
					keterangan: `Bulk delete ${ids.length} santri`,
					ip: getClientAddress(),
					createdAt: new Date().toISOString()
				});
			} catch (e) {
				// ignore logging errors
			}
			return { success: true };
		} catch (error) {
			console.error('Error bulk deleting santri:', error);
			const msg = String(error?.message || '').toLowerCase();
			if (msg.includes('foreign key') || msg.includes('constraint')) {
				return { success: false, error: `Tidak bisa menghapus ${ids.length} santri karena sebagian masih memiliki data terkait (Data Siswa SMK/SMP, Pembayaran, atau Tunggakan). Hapus data terkait terlebih dahulu.` };
			}
			return { success: false, error: 'Gagal menghapus data santri.' };
		}
	},

	import: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const file = data.get('file');

		if (!file || typeof file === 'string') {
			return { type: 'error', message: 'File import wajib dipilih.' };
		}

		let rows = [];
		const fileName = file.name?.toLowerCase() || '';
		const isXlsx = fileName.endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
		if (isXlsx) {
			try {
				const buf = await file.arrayBuffer();
				const workbook = XLSX.read(buf, { type: 'array' });
				const sheetName = workbook.SheetNames[0];
				const sheet = workbook.Sheets[sheetName];
				rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
			} catch (e) {
				return { type: 'error', message: 'Gagal membaca file .xlsx.' };
			}
		} else {
			let text;
			try {
				text = await file.text();
			} catch (e) {
				return { type: 'error', message: 'Gagal membaca file CSV.' };
			}
			rows = parseCsv(text);
		}

		if (!rows.length) {
			return { type: 'error', message: 'File kosong atau tidak terbaca.' };
		}

		const header = rows.shift().map(normalizeHeader);
		const headerMap = new Map();
		header.forEach((h, idx) => headerMap.set(h, idx));
		const requiredHeaders = ['nomor_induk', 'nama_lengkap'];
		const missingHeaders = requiredHeaders.filter((key) => !headerMap.has(key));
		if (missingHeaders.length) {
			return { type: 'error', message: `Header CSV kurang: ${missingHeaders.join(', ')}.` };
		}

		const pick = (row, key) => {
			const idx = headerMap.get(key);
			return idx === undefined ? '' : row[idx];
		};

		const kategoris = await db.select().from(schema.kategoriSantri);
		const kategoriById = new Map(kategoris.map((k) => [String(k.id), k.id]));
		const kategoriByName = new Map(kategoris.map((k) => [k.namaKategori.toLowerCase(), k.id]));

		const errors = [];
		const prepared = [];
		const seenNomor = new Set();

		// Ambil data tahun ajaran
		const tahunAjarans = await db.select().from(schema.tahunAjaran);
		const tahunAjaranByName = new Map(tahunAjarans.map((t) => [t.nama, t.id]));

		// Untuk multi-kategori per tahun ajaran
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const nomorInduk = String(pick(row, 'nomor_induk') || '').trim();
			const namaLengkap = String(pick(row, 'nama_lengkap') || '').trim();
			const tanggalMasuk = String(pick(row, 'tanggal_masuk') || '').trim() || null;
			const tanggalKeluar = String(pick(row, 'tanggal_keluar') || '').trim() || null;
			const tahunAjaranRaw = String(pick(row, 'tahun_ajaran') || '').trim();
			const kategoriRaw = String(pick(row, 'kategori') || '').trim();
			const isActive = toBool(pick(row, 'is_active'), true);
			const tanggalMulaiSmp = String(pick(row, 'tanggal_mulai_smp') || '').trim() || null;
			const tanggalMulaiSmk = String(pick(row, 'tanggal_mulai_smk') || '').trim() || null;

			if (!nomorInduk || !namaLengkap) {
				errors.push(`Baris ${i + 2}: nomor_induk dan nama_lengkap wajib diisi.`);
				continue;
			}

			// Tidak perlu skip jika nomorInduk sudah pernah, karena bisa multi tahun/kategori

			// Validasi tahun ajaran
			const tahunAjaranId = tahunAjaranByName.get(tahunAjaranRaw);
			if (!tahunAjaranId) {
				errors.push(`Baris ${i + 2}: tahun_ajaran "${tahunAjaranRaw}" tidak ditemukan.`);
				continue;
			}

			// Multi kategori (pisah koma)
			const kategoriList = kategoriRaw.split(',').map((k) => k.trim()).filter(Boolean);
			if (!kategoriList.length) {
				errors.push(`Baris ${i + 2}: kategori wajib diisi.`);
				continue;
			}
			const kategoriIds = [];
			for (const kat of kategoriList) {
				const katId = kategoriByName.get(kat.toLowerCase());
				if (!katId) {
					errors.push(`Baris ${i + 2}: kategori "${kat}" tidak ditemukan.`);
					continue;
				}
				kategoriIds.push(katId);
			}

			const detailData = {
				tempatLahir: String(pick(row, 'tempat_lahir') || '').trim() || null,
				tanggalLahir: String(pick(row, 'tanggal_lahir') || '').trim() || null,
				jenisKelamin: String(pick(row, 'jenis_kelamin') || '').trim() || null,
				golonganDarah: String(pick(row, 'golongan_darah') || '').trim() || null,
				nik: String(pick(row, 'nik') || '').trim() || null,
				noKk: String(pick(row, 'no_kk') || '').trim() || null,
				anakKe: Number(pick(row, 'anak_ke')) || null,
				jumlahSaudara: Number(pick(row, 'jumlah_saudara')) || null,
				tinggiCm: Number(pick(row, 'tinggi_cm')) || null,
				beratKg: Number(pick(row, 'berat_kg')) || null,
				alamatLengkap: String(pick(row, 'alamat_lengkap') || '').trim() || null,
				rt: String(pick(row, 'rt') || '').trim() || null,
				rw: String(pick(row, 'rw') || '').trim() || null,
				desaKelurahan: String(pick(row, 'desa_kelurahan') || '').trim() || null,
				kecamatan: String(pick(row, 'kecamatan') || '').trim() || null,
				kabupaten: String(pick(row, 'kabupaten') || '').trim() || null,
				provinsi: String(pick(row, 'provinsi') || '').trim() || null,
				noKip: String(pick(row, 'no_kip') || '').trim() || null,
				noKisKpsPkh: String(pick(row, 'no_kis_kps_pkh') || '').trim() || null,
				kebutuhanKhusus: String(pick(row, 'kebutuhan_khusus') || '').trim() || null,
				namaAyah: String(pick(row, 'nama_ayah') || '').trim() || null,
				tanggalLahirAyah: String(pick(row, 'tanggal_lahir_ayah') || '').trim() || null,
				pendidikanAyah: String(pick(row, 'pendidikan_ayah') || '').trim() || null,
				nikAyah: String(pick(row, 'nik_ayah') || '').trim() || null,
				alamatAyah: String(pick(row, 'alamat_ayah') || '').trim() || null,
				noHpAyah: String(pick(row, 'no_hp_ayah') || '').trim() || null,
				pekerjaanAyah: String(pick(row, 'pekerjaan_ayah') || '').trim() || null,
				penghasilanAyah: Number(pick(row, 'penghasilan_ayah')) || null,
				namaIbu: String(pick(row, 'nama_ibu') || '').trim() || null,
				tanggalLahirIbu: String(pick(row, 'tanggal_lahir_ibu') || '').trim() || null,
				pendidikanIbu: String(pick(row, 'pendidikan_ibu') || '').trim() || null,
				nikIbu: String(pick(row, 'nik_ibu') || '').trim() || null,
				alamatIbu: String(pick(row, 'alamat_ibu') || '').trim() || null,
				pekerjaanIbu: String(pick(row, 'pekerjaan_ibu') || '').trim() || null,
				penghasilanIbu: Number(pick(row, 'penghasilan_ibu')) || null
			};

			prepared.push({
				santri: {
					nomorInduk,
					namaLengkap,
					tanggalMasuk,
					tanggalKeluar,
					isActive
				},
				detail: detailData,
				tahunAjaranId,
				kategoriIds,
				tanggalMulaiSmp,
				tanggalMulaiSmk
			});
		}

		if (!prepared.length) {
			return { type: 'error', message: 'Tidak ada data valid untuk diimport.' };
		}


		// Cek santri yang sudah ada berdasarkan nomor induk
		const existing = await db.select({ id: schema.santri.id, nomorInduk: schema.santri.nomorInduk }).from(schema.santri);
		const existingMap = new Map(existing.map((row) => [row.nomorInduk, row.id]));
		// Ambil relasi kategori-tahun yang sudah ada untuk cek duplikat
		const existingKatTahun = await db.select().from(schema.santriKategoriTahun);
		// Set untuk lookup cepat: 'santriId:tahunAjaranId:kategoriId'
		const existingKatTahunSet = new Set(
			existingKatTahun.map((r) => `${r.santriId}:${r.tahunAjaranId}:${r.kategoriId}`)
		);
		let insertedSantri = 0;
		let insertedKategoriTahun = 0;
		let skippedKategoriTahun = 0;
		let skipped = 0;

		try {
			await db.transaction(async (tx) => {
				for (const item of prepared) {
					let santriId = existingMap.get(item.santri.nomorInduk);
					if (!santriId) {
						// Insert santri baru
						const [newSantri] = await tx.insert(schema.santri).values(item.santri).returning();
						santriId = newSantri.id;
						await tx.insert(schema.santriDetail).values({ santriId, ...item.detail });
						insertedSantri++;
					} else {
						skipped++;
					}
					// Insert ke tabel relasi kategori-tahun (skip duplikat)
					for (const kategoriId of item.kategoriIds) {
						const key = `${santriId}:${item.tahunAjaranId}:${kategoriId}`;
						if (existingKatTahunSet.has(key)) {
							skippedKategoriTahun++;
							continue;
						}
						await tx.insert(schema.santriKategoriTahun).values({ santriId, tahunAjaranId: item.tahunAjaranId, kategoriId });
						existingKatTahunSet.add(key); // update set agar batch yang sama juga ter-deduplikasi
						insertedKategoriTahun++;
					}

					// Process santriSmp
					if (item.tanggalMulaiSmp) {
						const dSmp = new Date(item.tanggalMulaiSmp);
						if (!isNaN(dSmp)) {
							await tx.insert(schema.santriSmp).values({
								santriId,
								startMonth: dSmp.getMonth() + 1,
								startYear: dSmp.getFullYear()
							}).onConflictDoNothing();
						}
					}
					// Process santriSmk
					if (item.tanggalMulaiSmk) {
						const dSmk = new Date(item.tanggalMulaiSmk);
						if (!isNaN(dSmk)) {
							await tx.insert(schema.santriSmk).values({
								santriId,
								startMonth: dSmk.getMonth() + 1,
								startYear: dSmk.getFullYear()
							}).onConflictDoNothing();
						}
					}
				}
			});
		} catch (e) {
			console.error(e);
			return { type: 'error', message: 'Gagal menyimpan data import. Periksa format CSV.' };
		}

		try {
			await db.insert(schema.systemLogs).values({
				userId: locals.user?.id || null,
				username: locals.user?.username || null,
				role: locals.user?.role || null,
				aksi: 'create',
				modul: 'master-santri',
				keterangan: `Import santri: ditambah=${insertedSantri}, kategori-tahun=${insertedKategoriTahun}, duplikat-santri=${skipped}, duplikat-kategori=${skippedKategoriTahun}, error=${errors.length}`,
				ip: getClientAddress(),
				createdAt: new Date().toISOString()
			});
		} catch (e) {
			// ignore logging errors
		}

		let message = `Import selesai. Ditambahkan ${insertedSantri} santri, relasi kategori-tahun: ${insertedKategoriTahun}, dilewati ${skipped} duplikat.`;
		if (errors.length) {
			message += ` Error ${errors.length} baris (contoh: ${errors.slice(0, 3).join(' | ')}).`;
		}

		return { type: 'success', message };
	}
};
