import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { and, eq } from 'drizzle-orm';

const BULAN = [
	'Januari',
	'Februari',
	'Maret',
	'April',
	'Mei',
	'Juni',
	'Juli',
	'Agustus',
	'September',
	'Oktober',
	'November',
	'Desember'
];

const parseTahunAjaranEndYear = (nama) => {
	const normalized = String(nama || '').trim();
	const slashMatch = normalized.match(/^(\d{4})\s*\/\s*(\d{4})$/);
	if (slashMatch) return Number(slashMatch[2]);

	const years = normalized.match(/\d{4}/g);
	if (years?.length) return Math.max(...years.map(Number));

	return null;
};

const parseTahunAjaranStartYear = (nama) => {
	const normalized = String(nama || '').trim();
	const slashMatch = normalized.match(/^(\d{4})\s*\/\s*(\d{4})$/);
	if (slashMatch) return Number(slashMatch[1]);

	const years = normalized.match(/\d{4}/g);
	if (years?.length) return Math.min(...years.map(Number));

	return null;
};

const getSystemYearRange = (tahunAjarans) => {
	const currentYear = new Date().getFullYear();
	const startYears = tahunAjarans.map((item) => parseTahunAjaranStartYear(item.nama)).filter(Boolean);
	const endYears = tahunAjarans.map((item) => parseTahunAjaranEndYear(item.nama)).filter(Boolean);

	return {
		startYear: startYears.length ? Math.min(...startYears) : currentYear,
		endYear: endYears.length ? Math.max(...endYears) : currentYear
	};
};

const normalizeStartDate = (tanggalMasuk, fallbackYear) => {
	if (tanggalMasuk) {
		const parsed = new Date(`${tanggalMasuk}T00:00:00`);
		if (!Number.isNaN(parsed.getTime())) {
			return {
				month: parsed.getMonth() + 1,
				year: parsed.getFullYear()
			};
		}
	}

	return {
		month: 1,
		year: fallbackYear
	};
};

const keyOf = (tahun, bulan) => `${tahun}-${String(bulan).padStart(2, '0')}`;

const getCurrentPeriod = () => {
	const now = new Date();
	return {
		bulan: now.getMonth() + 1,
		tahun: now.getFullYear(),
		key: keyOf(now.getFullYear(), now.getMonth() + 1)
	};
};

function buildSantriPeriods(santri, tahunAjarans) {
	const { startYear, endYear } = getSystemYearRange(tahunAjarans);
	const start = normalizeStartDate(santri.tanggalMasuk, startYear);
	
	let effectiveEndYear = Math.max(endYear, start.year);
	let effectiveEndMonth = 12;

	const isKeluar = !santri.isActive && santri.tanggalKeluar;
	if (isKeluar) {
		const end = normalizeStartDate(santri.tanggalKeluar, effectiveEndYear);
		effectiveEndYear = end.year;
		effectiveEndMonth = end.month;
	}

	// Safeguard in case data is anomalous (keluar before masuk)
	if (effectiveEndYear < start.year) {
		effectiveEndYear = start.year;
		effectiveEndMonth = start.month;
	}

	const periods = [];

	for (let year = start.year; year <= effectiveEndYear; year++) {
		const firstMonth = year === start.year ? start.month : 1;
		let lastMonth = 12;
		if (year === effectiveEndYear && isKeluar) {
			lastMonth = effectiveEndMonth;
		}
		
		const months = [];
		for (let month = firstMonth; month <= lastMonth; month++) {
			months.push({
				bulan: month,
				namaBulan: BULAN[month - 1],
				tahun: year,
				key: keyOf(year, month)
			});
		}
		if (months.length > 0) {
			periods.push({ tahun: year, months });
		}
	}

	return periods;
}

const logAction = async ({ locals, getClientAddress, aksi, keterangan }) => {
	try {
		await db.insert(schema.systemLogs).values({
			userId: locals.user?.id || null,
			username: locals.user?.username || null,
			role: locals.user?.role || null,
			aksi,
			modul: 'master-keaktifan-santri',
			keterangan,
			ip: getClientAddress(),
			createdAt: new Date().toISOString()
		});
	} catch (e) {
		// ignore logging errors
	}
};

export async function load() {
	const santris = await db
		.select({
			id: schema.santri.id,
			nomorInduk: schema.santri.nomorInduk,
			namaLengkap: schema.santri.namaLengkap,
			tanggalMasuk: schema.santri.tanggalMasuk,
			tanggalKeluar: schema.santri.tanggalKeluar,
			kategoriId: schema.santri.kategoriId,
			isActive: schema.santri.isActive
		})
		.from(schema.santri);
	const kategoris = await db.select().from(schema.kategoriSantri);
	const tahunAjarans = await db.select().from(schema.tahunAjaran);
	const kategoriTahunRows = await db.select().from(schema.santriKategoriTahun);
	const keaktifanRows = await db.select().from(schema.santriKeaktifan);
	const currentPeriod = getCurrentPeriod();
	const kategoriById = new Map(kategoris.map((kategori) => [kategori.id, kategori.namaKategori]));

	const keaktifanBySantri = new Map();
	for (const row of keaktifanRows) {
		if (!keaktifanBySantri.has(row.santriId)) keaktifanBySantri.set(row.santriId, []);
		keaktifanBySantri.get(row.santriId).push({
			...row,
			key: keyOf(row.tahun, row.bulan)
		});
	}

	const kategoriTahunBySantri = new Map();
	for (const row of kategoriTahunRows) {
		if (!kategoriTahunBySantri.has(row.santriId)) kategoriTahunBySantri.set(row.santriId, []);
		kategoriTahunBySantri.get(row.santriId).push(row);
	}

	const santrisWithKeaktifan = santris
		.map((santri) => {
			const periods = buildSantriPeriods(santri, tahunAjarans);
			const rows = keaktifanBySantri.get(santri.id) || [];
			const activeKeys = rows.filter((row) => row.isActive).map((row) => row.key);
			const kategoriTahun = kategoriTahunBySantri.get(santri.id) || [];
			const latestTahunId = kategoriTahun.length
				? Math.max(...kategoriTahun.map((row) => Number(row.tahunAjaranId)))
				: null;
			const kategoriLabels = latestTahunId
				? kategoriTahun
					.filter((row) => row.tahunAjaranId === latestTahunId)
					.map((row) => kategoriById.get(row.kategoriId))
					.filter(Boolean)
				: [];
			if (!kategoriLabels.length && santri.kategoriId) {
				const fallbackKategori = kategoriById.get(santri.kategoriId);
				if (fallbackKategori) kategoriLabels.push(fallbackKategori);
			}

			return {
				...santri,
				kategoriLabels,
				periods,
				activeKeys,
				currentMonthActive: activeKeys.includes(currentPeriod.key),
				tahunMasuk: santri.tanggalMasuk ? parseInt(santri.tanggalMasuk.split('-')[0]) : null
			};
		})
		.sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap, 'id'));

	const tahunMasukOptions = tahunAjarans
		.map((t) => ({
			label: t.nama,
			value: parseTahunAjaranStartYear(t.nama)
		}))
		.filter((t) => t.value)
		.sort((a, b) => b.value - a.value);

	return {
		santris: santrisWithKeaktifan,
		tahunAjarans,
		currentPeriod,
		monthNames: BULAN,
		tahunMasukOptions
	};
}

export const actions = {
	quickCheck: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const santriId = Number(data.get('santriId'));
		if (!santriId) return { success: false, error: 'Santri tidak valid.' };

		const currentPeriod = getCurrentPeriod();
		const now = new Date().toISOString();
		const [existing] = await db
			.select()
			.from(schema.santriKeaktifan)
			.where(
				and(
					eq(schema.santriKeaktifan.santriId, santriId),
					eq(schema.santriKeaktifan.bulan, currentPeriod.bulan),
					eq(schema.santriKeaktifan.tahun, currentPeriod.tahun)
				)
			);

		if (existing) {
			await db
				.update(schema.santriKeaktifan)
				.set({ isActive: true, updatedAt: now })
				.where(eq(schema.santriKeaktifan.id, existing.id));
		} else {
			await db.insert(schema.santriKeaktifan).values({
				santriId,
				bulan: currentPeriod.bulan,
				tahun: currentPeriod.tahun,
				isActive: true,
				updatedAt: now
			});
		}

		await db.update(schema.santri).set({ isActive: true }).where(eq(schema.santri.id, santriId));
		await logAction({
			locals,
			getClientAddress,
			aksi: 'update',
			keterangan: `Ceklis aktif bulan ini untuk santri id=${santriId} (${currentPeriod.bulan}/${currentPeriod.tahun})`
		});

		return { success: true, message: 'Keaktifan bulan ini berhasil diceklis.' };
	},

	save: async ({ request, locals, getClientAddress }) => {
		const data = await request.formData();
		const santriId = Number(data.get('santriId'));
		let activeKeys = [];

		try {
			activeKeys = JSON.parse(data.get('activeKeys') || '[]');
		} catch (e) {
			activeKeys = [];
		}

		if (!santriId) return { success: false, error: 'Santri tidak valid.' };
		if (!Array.isArray(activeKeys)) activeKeys = [];

		const allowedKeys = new Set();
		const [santri] = await db.select().from(schema.santri).where(eq(schema.santri.id, santriId));
		if (!santri) return { success: false, error: 'Santri tidak ditemukan.' };

		const tahunAjarans = await db.select().from(schema.tahunAjaran);
		for (const group of buildSantriPeriods(santri, tahunAjarans)) {
			for (const month of group.months) {
				allowedKeys.add(month.key);
			}
		}

		const normalizedKeys = [...new Set(activeKeys)]
			.map((item) => String(item))
			.filter((item) => allowedKeys.has(item));
		const now = new Date().toISOString();
		const currentPeriod = getCurrentPeriod();
		const currentIsActive = normalizedKeys.includes(currentPeriod.key);

		await db.transaction(async (tx) => {
			await tx.delete(schema.santriKeaktifan)
				.where(eq(schema.santriKeaktifan.santriId, santriId))
				;

			for (const key of normalizedKeys) {
				const [tahun, bulan] = key.split('-').map(Number);
				if (!tahun || !bulan) continue;
				await tx.insert(schema.santriKeaktifan)
					.values({ santriId, bulan, tahun, isActive: true, updatedAt: now });
			}

			await tx.update(schema.santri)
				.set({ isActive: currentIsActive })
				.where(eq(schema.santri.id, santriId));
		});

		await logAction({
			locals,
			getClientAddress,
			aksi: 'update',
			keterangan: `Update keaktifan santri id=${santriId}: ${normalizedKeys.length} bulan aktif`
		});

		return { success: true, message: 'Keaktifan santri berhasil disimpan.' };
	}
};
