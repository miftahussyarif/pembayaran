import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { sql } from 'drizzle-orm';

export const load = async ({ locals }) => {
	// Ambil profil pesantren
	const [profilPesantren] = await db
		.select()
		.from(schema.pengaturanPesantren)
		.limit(1);

	// Ambil tahun ajaran yang aktif
	const [tahunAjaranAktif] = await db
		.select()
		.from(schema.tahunAjaran)
		.where(sql`${schema.tahunAjaran.isActive} = 1`)
		.limit(1);

	// Ambil role access list untuk user saat ini
	let roleAccessList = [];
	if (locals.user && locals.user.role !== 'admin') {
		roleAccessList = await db
			.select()
			.from(schema.roleAccess)
			.where(sql`${schema.roleAccess.role} = ${locals.user.role}`);
	}

	return {
		user: locals.user,
		profilPesantren: profilPesantren || { namaPesantren: 'Pesantren Al-Hikmah' },
		tahunAjaranAktif: tahunAjaranAktif || null,
		roleAccessList
	};
};

