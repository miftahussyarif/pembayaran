import { json } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET({ params }) {
	const nomorInduk = params.nomorInduk?.trim();

	if (!nomorInduk) {
		return json({ found: false, error: 'Nomor Induk tidak valid' });
	}

	try {
		const filePath = path.join('static', 'public-data', 'tanggungan.json');
		const raw = await readFile(filePath, 'utf-8');
		const data = JSON.parse(raw);

		const santri = data.santri?.find(s => s.nomorInduk === nomorInduk);

		if (santri) {
			return json({ found: true, nomorInduk: santri.nomorInduk });
		} else {
			return json({ found: false });
		}
	} catch {
		return json({ found: false, error: 'Data belum tersedia' });
	}
}
