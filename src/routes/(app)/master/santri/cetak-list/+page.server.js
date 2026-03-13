import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';

export async function load({ url }) {
	const sortBy = url.searchParams.get('sortBy') || 'kategori';
	const filter = url.searchParams.get('filter') || '';

	const santris = await db.select().from(schema.santri);
	const santriDetails = await db.select().from(schema.santriDetail);
	const kategoris = await db.select().from(schema.kategoriSantri).orderBy(schema.kategoriSantri.namaKategori);

	const detailBySantriId = new Map(santriDetails.map((d) => [d.santriId, d]));
	const kategoriById = new Map(kategoris.map((k) => [k.id, k.namaKategori]));

	const santrisWithDetail = santris.map((s) => ({
		...s,
		detail: detailBySantriId.get(s.id) || null,
		kategoriNama: s.kategoriId ? (kategoriById.get(s.kategoriId) || '') : ''
	}));

	const getSortValue = (santri) => {
		if (sortBy === 'kategori') return santri.kategoriNama || '';
		if (sortBy === 'kabupaten') return santri.detail?.kabupaten || '';
		if (sortBy === 'kecamatan') return santri.detail?.kecamatan || '';
		if (sortBy === 'provinsi') return santri.detail?.provinsi || '';
		return '';
	};

	let filtered = santrisWithDetail;
	if (filter) {
		const needle = filter.toString().toLowerCase();
		filtered = santrisWithDetail.filter((s) => {
			const value = getSortValue(s);
			return value && value.toString().toLowerCase() === needle;
		});
	}

	filtered.sort((a, b) => {
		const av = getSortValue(a).toString().toLowerCase();
		const bv = getSortValue(b).toString().toLowerCase();
		if (!av && bv) return 1;
		if (av && !bv) return -1;
		return av.localeCompare(bv, 'id');
	});

	return {
		sortBy,
		filter,
		santris: filtered
	};
}
