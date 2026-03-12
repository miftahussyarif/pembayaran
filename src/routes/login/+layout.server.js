import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';

export const load = async () => {
	const [profilPesantren] = await db
		.select()
		.from(schema.pengaturanPesantren)
		.limit(1);

	return {
		profilPesantren: profilPesantren || { namaPesantren: 'Pesantren Al-Hikmah' }
	};
};
