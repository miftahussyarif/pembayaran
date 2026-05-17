import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const load = async ({ params, parent }) => {
	const parentData = await parent();
	const nomorInduk = params.nomorInduk?.trim();

	if (!nomorInduk) {
		throw error(404, 'Nomor Induk tidak valid');
	}

	try {
		const filePath = path.join('static', 'public-data', 'tanggungan.json');
		const raw = await readFile(filePath, 'utf-8');
		const data = JSON.parse(raw);

		const santri = data.santri?.find(s => s.nomorInduk === nomorInduk);

		if (!santri) {
			throw error(404, 'Santri tidak ditemukan');
		}

		return {
			...parentData,
			santri,
			namaPesantren: data.namaPesantren || parentData.profilPesantren?.namaPesantren || 'Pesantren',
			generatedAt: data.generatedAt
		};
	} catch (e) {
		if (e?.status === 404) throw e;
		throw error(404, 'Data belum tersedia. Silakan coba lagi nanti.');
	}
};
