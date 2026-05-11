import { getSemuaRekap } from '$lib/server/rekapIndividu.js';

export async function load({ url }) {
	const santriParam = url.searchParams.get('santriId') || '';
	const levelParam = url.searchParams.get('level') || 'all';

	const { rekapIndividu, santris, smkBySantriId, smpBySantriId } = await getSemuaRekap();

	let filteredRekap = santriParam
		? rekapIndividu.filter(r => String(r.id) === santriParam)
		: [];
	if (levelParam === 'smk') {
		filteredRekap = filteredRekap.filter(r => smkBySantriId.has(r.id));
	}
	if (levelParam === 'smp') {
		filteredRekap = filteredRekap.filter(r => smpBySantriId.has(r.id));
	}

	return {
		rekapIndividu: filteredRekap,
		santriList: santris.map(s => ({ id: s.id, nomorInduk: s.nomorInduk, namaLengkap: s.namaLengkap })),
		filterSantriId: santriParam,
		filterLevel: levelParam
	};
}
