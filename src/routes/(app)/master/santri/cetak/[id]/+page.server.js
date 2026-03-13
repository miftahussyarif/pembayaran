import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const santriId = Number(params.id);
	if (!santriId) throw error(404, 'Santri tidak ditemukan');

	const [santri] = await db.select().from(schema.santri).where(eq(schema.santri.id, santriId));
	if (!santri) throw error(404, 'Santri tidak ditemukan');

	const [detail] = await db
		.select()
		.from(schema.santriDetail)
		.where(eq(schema.santriDetail.santriId, santriId));

	let kategori = null;
	if (santri.kategoriId) {
		const [kat] = await db.select().from(schema.kategoriSantri).where(eq(schema.kategoriSantri.id, santri.kategoriId));
		kategori = kat || null;
	}

	return {
		santri,
		detail: detail || {},
		kategori
	};
}
