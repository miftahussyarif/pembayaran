import { redirect } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { desc, eq } from 'drizzle-orm';
import * as XLSX from 'xlsx';

const BULAN_NAMES = [
	'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
	'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

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
const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const pickByAliases = (row, headerMap, aliases) => {
	for (const key of aliases) {
		const index = headerMap.get(key);
		if (index !== undefined) {
			return row[index];
		}
	}
	return '';
};

const inferTahunTagihan = (tahunAjaranNama, bulan) => {
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
	return directYearMatch ? Number(directYearMatch[1]) : new Date().getFullYear();
};

const getTahunAjaranStartYear = (tahunAjaranNama) => {
	const normalizedTahun = String(tahunAjaranNama || '').trim();
	const slashMatch = normalizedTahun.match(/^(\d{4})\s*\/\s*(\d{4})$/);
	if (slashMatch) return Number(slashMatch[1]);
	const directYearMatch = normalizedTahun.match(/(\d{4})/);
	return directYearMatch ? Number(directYearMatch[1]) : new Date().getFullYear();
};

const formatDateOnly = (year, month, day = 1) => {
	const yyyy = String(year).padStart(4, '0');
	const mm = String(month).padStart(2, '0');
	const dd = String(day).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
};

const getMonthNumber = (bulan) => BULAN_NAMES.findIndex((item) => item === bulan) + 1;

const addMonthPeriod = (bulan, tahun, offset) => {
	const monthNumber = getMonthNumber(bulan);
	const baseDate = new Date(tahun, monthNumber - 1 + offset, 1);
	return {
		bulan: BULAN_NAMES[baseDate.getMonth()],
		tahunTagihan: baseDate.getFullYear()
	};
};

const buildSignatureKey = ({
	santriId,
	pembayarLainId,
	tahunAjaranId,
	jenisPembayaranId,
	bulan,
	tahunTagihan,
	keteranganKhusus
}) =>
	[
		String(santriId || ''),
		String(pembayarLainId || ''),
		tahunAjaranId,
		jenisPembayaranId,
		String(bulan || '').trim().toLowerCase(),
		String(tahunTagihan || ''),
		normalizeText(keteranganKhusus)
	].join('::');

const buildImportReceiptNumber = (signatureKey) => `IMP-${createHash('sha1').update(signatureKey).digest('hex').slice(0, 12).toUpperCase()}`;

function getEffectiveNominal({ santriRow, jenisRow, customNominalRow }) {
	const hasCustomNominal = customNominalRow !== undefined;
	const customNominal = customNominalRow?.nominal;

	if (hasCustomNominal && customNominal !== null) {
		return Number(customNominal || 0);
	}

	const isKonsumsi = !!jenisRow?.namaPembayaran && /konsumsi/i.test(jenisRow.namaPembayaran);
	if (isKonsumsi && santriRow?.nominalKonsumsi !== undefined) {
		return Number(santriRow.nominalKonsumsi || 0);
	}

	return Number(jenisRow?.nominalDefault || 0);
}

export const load = async ({ locals }) => {
	if (locals.user?.role !== 'admin') {
		throw redirect(303, '/');
	}

	const santri = await db.select().from(schema.santri);
	const tahunAjaran = await db.select().from(schema.tahunAjaran);
	const jenisPembayaran = await db.select().from(schema.jenisPembayaran);
	const kategoris = await db.select().from(schema.kategoriSantri);
	const imports = await db
		.select({
			id: schema.tunggakanImport.id,
			nominalAsalTagihan: schema.tunggakanImport.nominalAsalTagihan,
			nominalTagihan: schema.tunggakanImport.nominalTagihan,
			bulan: schema.tunggakanImport.bulan,
			tahunTagihan: schema.tunggakanImport.tahunTagihan,
			keteranganKhusus: schema.tunggakanImport.keteranganKhusus,
			updatedAt: schema.tunggakanImport.updatedAt,
			namaSantri: schema.santri.namaLengkap,
			nomorInduk: schema.santri.nomorInduk,
			namaPembayar: schema.pembayarLain.namaPembayar,
			namaTahun: schema.tahunAjaran.nama,
			namaJenis: schema.jenisPembayaran.namaPembayaran
		})
		.from(schema.tunggakanImport)
		.leftJoin(schema.santri, eq(schema.tunggakanImport.santriId, schema.santri.id))
		.leftJoin(schema.pembayarLain, eq(schema.tunggakanImport.pembayarLainId, schema.pembayarLain.id))
		.innerJoin(schema.tahunAjaran, eq(schema.tunggakanImport.tahunAjaranId, schema.tahunAjaran.id))
		.innerJoin(schema.jenisPembayaran, eq(schema.tunggakanImport.jenisPembayaranId, schema.jenisPembayaran.id))
		.orderBy(desc(schema.tunggakanImport.updatedAt), desc(schema.tunggakanImport.id))
		.limit(100);

	return {
		santri,
		tahunAjaran,
		jenisPembayaran,
		kategoris,
		imports
	};
};

export const actions = {
	import: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const file = data.get('file');

		if (!file || typeof file === 'string') {
			return { type: 'error', message: 'File Excel/CSV wajib dipilih.' };
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
			} catch {
				return { type: 'error', message: 'Gagal membaca file .xlsx.' };
			}
		} else {
			try {
				rows = parseCsv(await file.text());
			} catch {
				return { type: 'error', message: 'Gagal membaca file CSV.' };
			}
		}

		if (!rows.length) {
			return { type: 'error', message: 'File kosong atau tidak terbaca.' };
		}

		const header = rows.shift().map(normalizeHeader);
		const headerMap = new Map();
		header.forEach((item, index) => headerMap.set(item, index));
		const requiredHeaderGroups = [
			['tahun_ajaran', 'tahun'],
			['nominal_tunggakan', 'nominal_sisa', 'sisa_tunggakan']
		];
		const missingHeaders = requiredHeaderGroups
			.filter((group) => !group.some((key) => headerMap.has(key)))
			.map((group) => group[0]);
		if (missingHeaders.length) {
			return { type: 'error', message: `Header wajib belum lengkap: ${missingHeaders.join(', ')}.` };
		}

		const santri = await db
			.select({
				id: schema.santri.id,
				nomorInduk: schema.santri.nomorInduk,
				namaLengkap: schema.santri.namaLengkap,
				tanggalMasuk: schema.santri.tanggalMasuk,
				kategoriId: schema.santri.kategoriId,
				nominalKonsumsi: schema.kategoriSantri.nominalKonsumsi
			})
			.from(schema.santri)
			.leftJoin(schema.kategoriSantri, eq(schema.santri.kategoriId, schema.kategoriSantri.id));
		const tahunAjaran = await db.select().from(schema.tahunAjaran);
		const kategoris = await db.select().from(schema.kategoriSantri);
		const kategoriGratis = await db.select().from(schema.kategoriGratis);
		let jenisPembayaran = await db.select().from(schema.jenisPembayaran);
		let jenisKhusus = jenisPembayaran.find((item) => item.namaPembayaran === 'Pembayaran Lain-lain');
		if (!jenisKhusus) {
			const [created] = await db.insert(schema.jenisPembayaran).values({
				namaPembayaran: 'Pembayaran Lain-lain',
				tipe: 'sekali',
				nominalDefault: 0
			}).returning();
			jenisKhusus = created;
			jenisPembayaran = [...jenisPembayaran, created];
		}

		const existingPembayarLain = await db.select().from(schema.pembayarLain);
		const pembayarLainByNama = new Map(
			existingPembayarLain.map((item) => [normalizeText(item.namaPembayar), item])
		);

		const santriByNomor = new Map(santri.map((item) => [item.nomorInduk, item]));
		const tahunByNama = new Map(tahunAjaran.map((item) => [normalizeText(item.nama), item]));
		const tahunById = new Map(tahunAjaran.map((item) => [String(item.id), item]));
		const jenisByNama = new Map(jenisPembayaran.map((item) => [normalizeText(item.namaPembayaran), item]));
		const jenisById = new Map(jenisPembayaran.map((item) => [String(item.id), item]));
		const kategoriByNama = new Map(kategoris.map((item) => [normalizeText(item.namaKategori), item]));
		const kategoriById = new Map(kategoris.map((item) => [String(item.id), item]));

		const prepared = [];
		const errors = [];
		const seen = new Set();
		const now = new Date().toISOString();

		for (let index = 0; index < rows.length; index++) {
			const row = rows[index];
			const nomorInduk = String(pickByAliases(row, headerMap, ['nomor_induk', 'no_induk', 'nis', 'nisn']) || '').trim();
			const namaSantri = String(pickByAliases(row, headerMap, ['nama_santri', 'nama', 'nama_lengkap']) || '').trim();
			const namaPembayarRaw = String(pickByAliases(row, headerMap, ['nama_pembayar', 'nama_wali', 'pembayar']) || '').trim();
			const tahunRaw = String(pickByAliases(row, headerMap, ['tahun_ajaran', 'tahun']) || '').trim();
			const jenisRaw = String(pickByAliases(row, headerMap, ['jenis_pembayaran', 'jenis_tagihan', 'tagihan']) || '').trim();
			const kategoriRaw = String(pickByAliases(row, headerMap, ['kategori_santri', 'status_santri', 'kategori_siswa', 'status_siswa']) || '').trim();
			const kategoriIdRaw = String(pickByAliases(row, headerMap, ['kategori_id']) || '').trim();
			const tipeRaw = normalizeText(pickByAliases(row, headerMap, ['tipe_tagihan', 'tipe']));
			const bulan = String(pickByAliases(row, headerMap, ['bulan_mulai_tunggakan', 'bulan_mulai', 'bulan_awal_tunggakan', 'bulan']) || '').trim();
			const tahunTagihanRaw = String(pickByAliases(row, headerMap, ['tahun_mulai_tunggakan', 'tahun_mulai', 'tahun_awal_tunggakan', 'tahun_tagihan', 'tahun_pembayaran']) || '').trim();
			const keteranganKhusus = String(pickByAliases(row, headerMap, ['keterangan', 'uraian']) || '').trim();
			const catatan = String(pickByAliases(row, headerMap, ['catatan', 'notes', 'note']) || '').trim() || null;
			const nominalTagihan = Number(pickByAliases(row, headerMap, ['nominal_tunggakan', 'nominal_sisa', 'sisa_tunggakan']));
			const nominalAsalRaw = String(pickByAliases(row, headerMap, ['nominal_total_tagihan', 'nominal_tagihan', 'total_tagihan']) || '').trim();
			const nominalAsalTagihanInput = nominalAsalRaw === '' ? null : Number(nominalAsalRaw);
			const rowNumber = index + 2;

			if ((!nomorInduk && !namaPembayarRaw) || !tahunRaw || !Number.isFinite(nominalTagihan) || nominalTagihan < 0) {
				errors.push(`Baris ${rowNumber}: isi nomor_induk atau nama_pembayar, lalu pastikan tahun_ajaran dan nominal_tunggakan valid.`);
				continue;
			}

			const santriRow = nomorInduk ? santriByNomor.get(nomorInduk) : null;
			const isAutoCreateSantri = !!nomorInduk && !santriRow;
			if (isAutoCreateSantri && !namaSantri) {
				errors.push(`Baris ${rowNumber}: nama_santri wajib diisi saat nomor induk ${nomorInduk} belum ada di database.`);
				continue;
			}

			if (santriRow && namaSantri && normalizeText(santriRow.namaLengkap) !== normalizeText(namaSantri)) {
				errors.push(`Baris ${rowNumber}: nama "${namaSantri}" tidak cocok dengan nomor induk ${nomorInduk}.`);
				continue;
			}

			if (!santriRow && !isAutoCreateSantri && !namaPembayarRaw) {
				errors.push(`Baris ${rowNumber}: nama_pembayar wajib diisi jika nomor_induk tidak ditemukan.`);
				continue;
			}

			const tahunRow = tahunById.get(tahunRaw) || tahunByNama.get(normalizeText(tahunRaw));
			if (!tahunRow) {
				errors.push(`Baris ${rowNumber}: tahun ajaran "${tahunRaw}" tidak ditemukan.`);
				continue;
			}

			let kategoriRow = null;
			if (kategoriIdRaw) {
				kategoriRow = kategoriById.get(kategoriIdRaw);
				if (!kategoriRow) {
					errors.push(`Baris ${rowNumber}: kategori_id ${kategoriIdRaw} tidak ditemukan.`);
					continue;
				}
			} else if (kategoriRaw) {
				kategoriRow = kategoriByNama.get(normalizeText(kategoriRaw));
				if (!kategoriRow) {
					errors.push(`Baris ${rowNumber}: kategori/status "${kategoriRaw}" tidak ditemukan.`);
					continue;
				}
			}

			let jenisRow = null;
			if (jenisRaw) {
				jenisRow = jenisById.get(jenisRaw) || jenisByNama.get(normalizeText(jenisRaw));
			}
			if (!jenisRow && keteranganKhusus) {
				jenisRow = jenisKhusus;
			}
			if (!jenisRow) {
				errors.push(`Baris ${rowNumber}: jenis_pembayaran wajib diisi atau gunakan kolom keterangan untuk tagihan custom.`);
				continue;
			}

			const inferredType = jenisRow.id === jenisKhusus.id
				? 'khusus'
				: jenisRow.tipe.includes('bulanan')
					? 'bulanan'
					: jenisRow.tipe.includes('tahunan')
						? 'tahunan'
						: 'sekali';
			const tipeTagihan = tipeRaw || inferredType;

			if (!santriRow && !isAutoCreateSantri && tipeTagihan !== 'khusus') {
				errors.push(`Baris ${rowNumber}: pembayar non-santri hanya didukung untuk tagihan custom/keterangan.`);
				continue;
			}

			let normalizedBulan = null;
			let normalizedTahunTagihan = null;
			if (tipeTagihan === 'bulanan') {
				if (!bulan || !BULAN_NAMES.includes(bulan)) {
					errors.push(`Baris ${rowNumber}: bulan wajib diisi sesuai nama bulan Indonesia.`);
					continue;
				}
				normalizedBulan = bulan;
				normalizedTahunTagihan = Number(tahunTagihanRaw || inferTahunTagihan(tahunRow.nama, bulan));
				if (!normalizedTahunTagihan || Number.isNaN(normalizedTahunTagihan)) {
					errors.push(`Baris ${rowNumber}: tahun_tagihan tidak valid.`);
					continue;
				}
			}

			if (tipeTagihan === 'khusus' && !keteranganKhusus) {
				errors.push(`Baris ${rowNumber}: keterangan wajib diisi untuk tagihan custom.`);
				continue;
			}

			const effectiveKategoriId = santriRow?.kategoriId || kategoriRow?.id || null;
			const effectiveSantriRow = santriRow || {
				kategoriId: effectiveKategoriId,
				nominalKonsumsi: kategoriRow?.nominalKonsumsi
			};
			const customNominalRow = effectiveKategoriId
				? kategoriGratis.find((item) =>
					item.kategoriId === effectiveKategoriId &&
					item.jenisPembayaranId === jenisRow.id
				)
				: undefined;
			const nominalDefault = getEffectiveNominal({
				santriRow: effectiveSantriRow,
				jenisRow,
				customNominalRow
			});

			if (['bulanan', 'tahunan', 'sekali', 'smk_bulanan', 'smk_tahunan', 'smk_sekali', 'smp_bulanan', 'smp_tahunan', 'smp_sekali'].includes(jenisRow.tipe) && nominalDefault <= 0) {
				errors.push(`Baris ${rowNumber}: jenis pembayaran "${jenisRow.namaPembayaran}" tidak berlaku untuk kategori santri ini sesuai pengaturan pembayaran.`);
				continue;
			}

			const pembayarKey = normalizeText(namaPembayarRaw);
			const rowTimestamp = new Date(Date.now() + index).toISOString();
			const tahunAjaranStartYear = getTahunAjaranStartYear(tahunRow.nama);
			const basePayload = {
				rowNumber,
				santriId: santriRow?.id || null,
				nomorInduk,
				namaSantri: santriRow?.namaLengkap || namaSantri,
				autoCreateSantri: isAutoCreateSantri,
				kategoriId: kategoriRow?.id || santriRow?.kategoriId || null,
				namaPembayarRaw: (santriRow || isAutoCreateSantri) ? '' : namaPembayarRaw,
				pembayarKey: (santriRow || isAutoCreateSantri) ? '' : pembayarKey,
				tahunAjaranId: tahunRow.id,
				tahunAjaranNama: tahunRow.nama,
				tahunAjaranStartYear,
				jenisPembayaranId: jenisRow.id,
				jenisTipe: jenisRow.tipe,
				keteranganKhusus: tipeTagihan === 'khusus' ? keteranganKhusus : null,
				catatan
			};

			if (tipeTagihan === 'bulanan') {
				if (nominalTagihan === 0) {
					continue;
				}
				if (nominalTagihan % nominalDefault !== 0) {
					errors.push(`Baris ${rowNumber}: nominal_tunggakan untuk ${jenisRow.namaPembayaran} harus kelipatan nominal bulanan ${nominalDefault.toLocaleString('id-ID')}.`);
					continue;
				}
				const jumlahBulanTunggakan = Math.round(nominalTagihan / nominalDefault);
				for (let monthOffset = 0; monthOffset < jumlahBulanTunggakan; monthOffset++) {
					const period = addMonthPeriod(normalizedBulan, normalizedTahunTagihan, monthOffset);
					const signatureKey = buildSignatureKey({
						santriId: santriRow?.id || (isAutoCreateSantri ? `ni:${nomorInduk}` : null),
						pembayarLainId: (santriRow || isAutoCreateSantri) ? null : pembayarKey,
						tahunAjaranId: tahunRow.id,
						jenisPembayaranId: jenisRow.id,
						bulan: period.bulan,
						tahunTagihan: period.tahunTagihan,
						keteranganKhusus: null
					});
					if (seen.has(signatureKey)) continue;
					seen.add(signatureKey);
					prepared.push({
						...basePayload,
						bulan: period.bulan,
						tahunTagihan: period.tahunTagihan,
						nominalAsalTagihan: nominalDefault,
						nominalTagihan: nominalDefault,
						nominalTerbayarSaatImport: 0,
						signatureKey,
						receiptNumber: buildImportReceiptNumber(signatureKey),
						createdAt: new Date(Date.parse(rowTimestamp) + monthOffset).toISOString(),
						updatedAt: new Date(Date.parse(rowTimestamp) + monthOffset).toISOString()
					});
				}
				continue;
			}

			const nominalAsalTagihan = nominalAsalTagihanInput === null
				? nominalDefault
				: Math.round(nominalAsalTagihanInput);

			if (nominalAsalTagihan < nominalTagihan) {
				errors.push(`Baris ${rowNumber}: nominal_total_tagihan tidak boleh lebih kecil dari nominal_tunggakan.`);
				continue;
			}

			const paidAtImport = Math.max(0, nominalAsalTagihan - Math.round(nominalTagihan));
			const signatureKey = buildSignatureKey({
				santriId: santriRow?.id || (isAutoCreateSantri ? `ni:${nomorInduk}` : null),
				pembayarLainId: (santriRow || isAutoCreateSantri) ? null : pembayarKey,
				tahunAjaranId: tahunRow.id,
				jenisPembayaranId: jenisRow.id,
				bulan: normalizedBulan,
				tahunTagihan: normalizedTahunTagihan,
				keteranganKhusus: tipeTagihan === 'khusus' ? keteranganKhusus : null
			});

			if (seen.has(signatureKey)) continue;
			seen.add(signatureKey);

			prepared.push({
				...basePayload,
				bulan: normalizedBulan,
				tahunTagihan: normalizedTahunTagihan,
				nominalAsalTagihan,
				nominalTagihan: Math.round(nominalTagihan),
				nominalTerbayarSaatImport: paidAtImport,
				signatureKey,
				receiptNumber: buildImportReceiptNumber(signatureKey),
				createdAt: rowTimestamp,
				updatedAt: rowTimestamp
			});
		}

		if (!prepared.length) {
			const contohError = errors.length ? ` Contoh error: ${errors.slice(0, 5).join(' | ')}` : '';
			return { type: 'error', message: `Tidak ada data tunggakan valid untuk diimport.${contohError}` };
		}

		const pondokMetaByNomor = new Map();
		const smkMetaByNomor = new Map();
		const smpMetaByNomor = new Map();
		for (const item of prepared) {
			if (!item.nomorInduk) continue;
			const pondokMeta = pondokMetaByNomor.get(item.nomorInduk);
			if (!pondokMeta || item.tahunAjaranStartYear < pondokMeta.startYear) {
				pondokMetaByNomor.set(item.nomorInduk, {
					startYear: item.tahunAjaranStartYear,
					tanggalMasuk: formatDateOnly(item.tahunAjaranStartYear, 7, 1)
				});
			}

			if (String(item.jenisTipe || '').startsWith('smk_')) {
				const smkMeta = smkMetaByNomor.get(item.nomorInduk);
				if (!smkMeta || item.tahunAjaranStartYear < smkMeta.startYear) {
					smkMetaByNomor.set(item.nomorInduk, {
						startYear: item.tahunAjaranStartYear,
						startMonth: 7,
						endYear: item.tahunAjaranStartYear + 3,
						endMonth: 6
					});
				}
			}

			if (String(item.jenisTipe || '').startsWith('smp_')) {
				const smpMeta = smpMetaByNomor.get(item.nomorInduk);
				if (!smpMeta || item.tahunAjaranStartYear < smpMeta.startYear) {
					smpMetaByNomor.set(item.nomorInduk, {
						startYear: item.tahunAjaranStartYear,
						startMonth: 7,
						endYear: item.tahunAjaranStartYear + 3,
						endMonth: 6
					});
				}
			}
		}

		try {
			db.transaction((tx) => {
				const santriRowByNomor = new Map(santri.map((item) => [item.nomorInduk, item]));
				const existingSantriSmk = tx.select().from(schema.santriSmk).all();
				const existingSantriSmp = tx.select().from(schema.santriSmp).all();
				const smkBySantriId = new Map(existingSantriSmk.map((item) => [item.santriId, item]));
				const smpBySantriId = new Map(existingSantriSmp.map((item) => [item.santriId, item]));

				for (const item of prepared) {
					if (!item.santriId && item.autoCreateSantri) {
						let resolvedSantri = santriRowByNomor.get(item.nomorInduk);
						if (!resolvedSantri) {
							const pondokMeta = pondokMetaByNomor.get(item.nomorInduk);
							const insertedSantri = tx.insert(schema.santri).values({
								nomorInduk: item.nomorInduk,
								namaLengkap: item.namaSantri,
								tanggalMasuk: pondokMeta?.tanggalMasuk || null,
								kategoriId: item.kategoriId,
								isActive: true
							}).returning().get();
							resolvedSantri = insertedSantri;
							santriRowByNomor.set(item.nomorInduk, insertedSantri);
						} else {
							const pondokMeta = pondokMetaByNomor.get(item.nomorInduk);
							const nextFields = {};
							if (!resolvedSantri.tanggalMasuk && pondokMeta?.tanggalMasuk) {
								nextFields.tanggalMasuk = pondokMeta.tanggalMasuk;
							}
							if (item.kategoriId && resolvedSantri.kategoriId !== item.kategoriId) {
								nextFields.kategoriId = item.kategoriId;
							}
							if (Object.keys(nextFields).length > 0) {
								tx.update(schema.santri)
									.set(nextFields)
									.where(eq(schema.santri.id, resolvedSantri.id))
									.run();
								resolvedSantri = { ...resolvedSantri, ...nextFields };
								santriRowByNomor.set(item.nomorInduk, resolvedSantri);
							}
						}
						item.santriId = resolvedSantri.id;

						const smkMeta = smkMetaByNomor.get(item.nomorInduk);
						if (smkMeta && !smkBySantriId.has(resolvedSantri.id)) {
							const insertedSmk = tx.insert(schema.santriSmk).values({
								santriId: resolvedSantri.id,
								startMonth: smkMeta.startMonth,
								startYear: smkMeta.startYear,
								endMonth: smkMeta.endMonth,
								endYear: smkMeta.endYear
							}).returning().get();
							smkBySantriId.set(resolvedSantri.id, insertedSmk);
						}

						const smpMeta = smpMetaByNomor.get(item.nomorInduk);
						if (smpMeta && !smpBySantriId.has(resolvedSantri.id)) {
							const insertedSmp = tx.insert(schema.santriSmp).values({
								santriId: resolvedSantri.id,
								startMonth: smpMeta.startMonth,
								startYear: smpMeta.startYear,
								endMonth: smpMeta.endMonth,
								endYear: smpMeta.endYear
							}).returning().get();
							smpBySantriId.set(resolvedSantri.id, insertedSmp);
						}
					}

					if (item.santriId && item.nomorInduk) {
						const resolvedSantri = santriRowByNomor.get(item.nomorInduk);
						const pondokMeta = pondokMetaByNomor.get(item.nomorInduk);
						const nextFields = {};
						if (resolvedSantri && !resolvedSantri.tanggalMasuk && pondokMeta?.tanggalMasuk) {
							nextFields.tanggalMasuk = pondokMeta.tanggalMasuk;
						}
						if (resolvedSantri && item.kategoriId && resolvedSantri.kategoriId !== item.kategoriId) {
							nextFields.kategoriId = item.kategoriId;
						}
						if (resolvedSantri && Object.keys(nextFields).length > 0) {
							tx.update(schema.santri)
								.set(nextFields)
								.where(eq(schema.santri.id, resolvedSantri.id))
								.run();
							santriRowByNomor.set(item.nomorInduk, { ...resolvedSantri, ...nextFields });
						}

						const smkMeta = smkMetaByNomor.get(item.nomorInduk);
						if (smkMeta && !smkBySantriId.has(item.santriId)) {
							const insertedSmk = tx.insert(schema.santriSmk).values({
								santriId: item.santriId,
								startMonth: smkMeta.startMonth,
								startYear: smkMeta.startYear,
								endMonth: smkMeta.endMonth,
								endYear: smkMeta.endYear
							}).returning().get();
							smkBySantriId.set(item.santriId, insertedSmk);
						}

						const smpMeta = smpMetaByNomor.get(item.nomorInduk);
						if (smpMeta && !smpBySantriId.has(item.santriId)) {
							const insertedSmp = tx.insert(schema.santriSmp).values({
								santriId: item.santriId,
								startMonth: smpMeta.startMonth,
								startYear: smpMeta.startYear,
								endMonth: smpMeta.endMonth,
								endYear: smpMeta.endYear
							}).returning().get();
							smpBySantriId.set(item.santriId, insertedSmp);
						}
					}

					let pembayarLainId = null;
					if (!item.santriId) {
						const existingPembayar = pembayarLainByNama.get(item.pembayarKey);
						if (existingPembayar) {
							pembayarLainId = existingPembayar.id;
						} else {
							const insertedPembayar = tx.insert(schema.pembayarLain).values({
								namaPembayar: item.namaPembayarRaw,
								createdAt: item.createdAt
							}).returning().get();
							pembayarLainId = insertedPembayar.id;
							pembayarLainByNama.set(item.pembayarKey, insertedPembayar);
						}
					}

					tx.delete(schema.tunggakanImport).where(eq(schema.tunggakanImport.signatureKey, item.signatureKey)).run();
					tx.insert(schema.tunggakanImport).values({
						santriId: item.santriId,
						pembayarLainId,
						tahunAjaranId: item.tahunAjaranId,
						jenisPembayaranId: item.jenisPembayaranId,
						bulan: item.bulan,
						tahunTagihan: item.tahunTagihan,
						nominalAsalTagihan: item.nominalAsalTagihan,
						nominalTagihan: item.nominalTagihan,
						keteranganKhusus: item.keteranganKhusus,
						catatan: item.catatan,
						signatureKey: item.signatureKey,
						createdAt: item.createdAt,
						updatedAt: item.updatedAt
					}).run();

					const existingPayment = tx
						.select()
						.from(schema.pembayaran)
						.where(eq(schema.pembayaran.nomorKwitansi, item.receiptNumber))
						.get();

					if (item.nominalTerbayarSaatImport > 0) {
						const paymentPayload = {
							santriId: item.santriId,
							pembayarLainId,
							jenisPembayaranId: item.jenisPembayaranId,
							tahunAjaranId: item.tahunAjaranId,
							bulan: item.bulan,
							tahunTagihan: item.tahunTagihan,
							tanggalBayar: item.createdAt,
							nominalDibayar: item.nominalTerbayarSaatImport,
							nomorKwitansi: item.receiptNumber,
							inputById: locals.user?.id || null,
							keteranganKhusus: item.keteranganKhusus
						};

						if (existingPayment) {
							tx.update(schema.pembayaran)
								.set(paymentPayload)
								.where(eq(schema.pembayaran.id, existingPayment.id))
								.run();
						} else {
							tx.insert(schema.pembayaran).values(paymentPayload).run();
						}
					} else if (existingPayment) {
						tx.delete(schema.pembayaran).where(eq(schema.pembayaran.id, existingPayment.id)).run();
					}
				}
			});
		} catch (error) {
			console.error(error);
			return { type: 'error', message: 'Gagal menyimpan data tunggakan impor.' };
		}

		try {
			await db.insert(schema.systemLogs).values({
				userId: locals.user?.id || null,
				username: locals.user?.username || null,
				role: locals.user?.role || null,
				aksi: 'import',
				modul: 'tunggakan-import',
				keterangan: `Import tunggakan: ${prepared.length} baris, auto-bayar=${prepared.filter((item) => item.nominalTerbayarSaatImport > 0).length}, error=${errors.length}`,
				ip: getClientAddress(),
				createdAt: now
			});
		} catch {
			// ignore logging errors
		}

		let message = `Import tunggakan selesai. ${prepared.length} baris disimpan atau diperbarui.`;
		const autoPaid = prepared.filter((item) => item.nominalTerbayarSaatImport > 0).length;
		if (autoPaid > 0) {
			message += ` ${autoPaid} baris juga otomatis dibuatkan kwitansi histori dengan tanggal bayar saat import.`;
		}
		if (errors.length) {
			message += ` Error ${errors.length} baris (contoh: ${errors.slice(0, 3).join(' | ')}).`;
		}
		return { type: 'success', message };
	}
};
