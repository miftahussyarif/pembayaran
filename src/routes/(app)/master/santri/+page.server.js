import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
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

export async function load() {
	const santris = await db.select().from(schema.santri);
	const kategoris = await db.select().from(schema.kategoriSantri).orderBy(schema.kategoriSantri.namaKategori);
	return { santris, kategoris };
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const nomorInduk = data.get('nomorInduk');
		const namaLengkap = data.get('namaLengkap');
		const tanggalMasuk = data.get('tanggalMasuk') || null;
		const tanggalKeluar = data.get('tanggalKeluar') || null;
		const kategoriId = data.get('kategoriId') ? Number(data.get('kategoriId')) : null;
		const isActive = data.get('isActive') === 'on';

		try {
			await db.insert(schema.santri).values({ nomorInduk, namaLengkap, tanggalMasuk, tanggalKeluar, kategoriId, isActive });
			return { success: true };
		} catch (error) {
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
		const kategoriId = data.get('kategoriId') ? Number(data.get('kategoriId')) : null;
		const isActive = data.get('isActive') === 'on';

		try {
			await db.update(schema.santri)
				.set({ nomorInduk, namaLengkap, tanggalMasuk, tanggalKeluar, kategoriId, isActive })
				.where(eq(schema.santri.id, id));
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
		const data = await request.formData();
		const id = Number(data.get('id'));

		const [current] = await db.select().from(schema.santri).where(eq(schema.santri.id, id));
		if (!current) return { success: false };

		await db.update(schema.santri).set({ isActive: !current.isActive }).where(eq(schema.santri.id, id));
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
	},

	delete: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
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

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const nomorInduk = String(pick(row, 'nomor_induk') || '').trim();
			const namaLengkap = String(pick(row, 'nama_lengkap') || '').trim();
			const tanggalMasuk = String(pick(row, 'tanggal_masuk') || '').trim() || null;
			const tanggalKeluar = String(pick(row, 'tanggal_keluar') || '').trim() || null;
			const kategoriIdRaw = String(pick(row, 'kategori_id') || '').trim();
			const kategoriRaw = String(pick(row, 'kategori') || '').trim();
			const isActive = toBool(pick(row, 'is_active'), true);

			if (!nomorInduk || !namaLengkap) {
				errors.push(`Baris ${i + 2}: nomor_induk dan nama_lengkap wajib diisi.`);
				continue;
			}

			if (seenNomor.has(nomorInduk)) {
				continue;
			}
			seenNomor.add(nomorInduk);

			let kategoriId = null;
			if (kategoriIdRaw) {
				kategoriId = kategoriById.get(kategoriIdRaw);
				if (!kategoriId) {
					errors.push(`Baris ${i + 2}: kategori_id ${kategoriIdRaw} tidak ditemukan.`);
					continue;
				}
			} else if (kategoriRaw) {
				kategoriId = kategoriByName.get(kategoriRaw.toLowerCase());
				if (!kategoriId) {
					errors.push(`Baris ${i + 2}: kategori "${kategoriRaw}" tidak ditemukan.`);
					continue;
				}
			}

			prepared.push({
				nomorInduk,
				namaLengkap,
				tanggalMasuk,
				tanggalKeluar,
				kategoriId,
				isActive
			});
		}

		if (!prepared.length) {
			return { type: 'error', message: 'Tidak ada data valid untuk diimport.' };
		}

		const existing = await db.select({ nomorInduk: schema.santri.nomorInduk }).from(schema.santri);
		const existingSet = new Set(existing.map((row) => row.nomorInduk));
		const toInsert = prepared.filter((row) => !existingSet.has(row.nomorInduk));
		const skipped = prepared.length - toInsert.length;

		try {
			await db.transaction(async (tx) => {
				if (toInsert.length) {
					await insertInBatches(tx, schema.santri, toInsert);
				}
			});
		} catch (e) {
			return { type: 'error', message: 'Gagal menyimpan data import. Periksa format CSV.' };
		}

		try {
			await db.insert(schema.systemLogs).values({
				userId: locals.user?.id || null,
				username: locals.user?.username || null,
				role: locals.user?.role || null,
				aksi: 'create',
				modul: 'master-santri',
				keterangan: `Import santri: ditambah=${toInsert.length}, duplikat=${skipped}, error=${errors.length}`,
				ip: getClientAddress(),
				createdAt: new Date().toISOString()
			});
		} catch (e) {
			// ignore logging errors
		}

		let message = `Import selesai. Ditambahkan ${toInsert.length} santri, dilewati ${skipped} duplikat.`;
		if (errors.length) {
			message += ` Error ${errors.length} baris (contoh: ${errors.slice(0, 3).join(' | ')}).`;
		}

		return { type: 'success', message };
	}
};
