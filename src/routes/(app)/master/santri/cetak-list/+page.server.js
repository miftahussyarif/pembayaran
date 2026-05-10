import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';

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

export async function load({ url }) {
	const sortBy = url.searchParams.get('sortBy') || 'nama';
	const filter = url.searchParams.get('filter') || '';
	const search = url.searchParams.get('search') || '';

	const santris = await db.select().from(schema.santri);
	const santriDetails = await db.select().from(schema.santriDetail);
	const kategoris = await db.select().from(schema.kategoriSantri).orderBy(schema.kategoriSantri.namaKategori);
	const tahunAjarans = sortTahunAjarans(await db.select().from(schema.tahunAjaran));
	const kategoriTahunRows = await db.select().from(schema.santriKategoriTahun);

	const detailBySantriId = new Map(santriDetails.map((d) => [d.santriId, d]));

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
		kategoriTahun: kategoriTahunBySantriId.get(s.id) || []
	}));

	const getKategoriName = (id) => kategoris.find((k) => k.id === id)?.namaKategori || '';
	const getTahunNama = (id) => tahunAjarans.find((t) => t.id === id)?.nama || '';
	const getTahunOrder = (id) => {
		const index = tahunAjarans.findIndex((t) => t.id === Number(id));
		return index === -1 ? Number.MAX_SAFE_INTEGER : index;
	};

	const getLatestKategoriLabels = (santri) => {
		if (!santri.kategoriTahun?.length) return [];
		const byTahun = new Map();
		for (const kt of santri.kategoriTahun) {
			if (!byTahun.has(kt.tahunAjaranId)) byTahun.set(kt.tahunAjaranId, []);
			byTahun.get(kt.tahunAjaranId).push(kt.kategoriId);
		}
		const allTahunIds = [...byTahun.keys()].sort((a, b) => getTahunOrder(a) - getTahunOrder(b));
		const latestTahunId = allTahunIds[0];
		const latestKatIds = byTahun.get(latestTahunId) || [];
		return latestKatIds.map((id) => getKategoriName(id)).filter(Boolean);
	};

	let filtered = santrisWithDetail;

	if (search) {
		const sq = search.trim().toLowerCase();
		filtered = filtered.filter((s) => {
			const nama = String(s.namaLengkap || '').toLowerCase();
			const nomor = String(s.nomorInduk || '').toLowerCase();
			return nama.includes(sq) || nomor.includes(sq);
		});
	}

	if (filter) {
		const needle = filter.toString().toLowerCase();
		if (sortBy === 'kategori') {
			filtered = filtered.filter((s) => getLatestKategoriLabels(s).some((l) => l.toLowerCase() === needle));
		} else if (sortBy === 'tahun_ajaran') {
			filtered = filtered.filter((s) => s.kategoriTahun?.some((kt) => getTahunNama(kt.tahunAjaranId).toLowerCase() === needle));
		} else {
			filtered = filtered.filter((s) => {
				const value = s.detail?.[sortBy];
				return value && value.toString().toLowerCase() === needle;
			});
		}
	}

	filtered.sort((a, b) => {
		const av = String(a.namaLengkap || '').toLowerCase();
		const bv = String(b.namaLengkap || '').toLowerCase();
		return av.localeCompare(bv, 'id');
	});

	// For display purpose in the view
	const santrisForView = filtered.map(s => {
		return {
			...s,
			kategoriNama: getLatestKategoriLabels(s).join(', ')
		}
	});

	return {
		sortBy,
		filter,
		search,
		santris: santrisForView
	};
}
