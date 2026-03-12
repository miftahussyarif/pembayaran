import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, notInArray } from 'drizzle-orm';

export async function load() {
	const dataSmk = await db
		.select({
			id: schema.santriSmk.id,
			santriId: schema.santriSmk.santriId,
			namaLengkap: schema.santri.namaLengkap,
			nomorInduk: schema.santri.nomorInduk,
			startMonth: schema.santriSmk.startMonth,
			startYear: schema.santriSmk.startYear,
			endMonth: schema.santriSmk.endMonth,
			endYear: schema.santriSmk.endYear
		})
		.from(schema.santriSmk)
		.leftJoin(schema.santri, eq(schema.santriSmk.santriId, schema.santri.id));

	const smkSantriIds = dataSmk.map((d) => d.santriId);
	const santriList = smkSantriIds.length
		? await db.select().from(schema.santri).where(notInArray(schema.santri.id, smkSantriIds))
		: await db.select().from(schema.santri);

	return { dataSmk, santriList };
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const santriId = Number(data.get('santriId'));
		const startMonth = Number(data.get('startMonth'));
		const startYear = Number(data.get('startYear'));
		const endMonth = data.get('endMonth') ? Number(data.get('endMonth')) : null;
		const endYear = data.get('endYear') ? Number(data.get('endYear')) : null;

		if (!santriId || !startMonth || !startYear) {
			return { success: false, message: 'Data tidak lengkap.' };
		}
		if ((endMonth && !endYear) || (!endMonth && endYear)) {
			return { success: false, message: 'Periode selesai harus lengkap (bulan dan tahun).' };
		}
		if (endMonth && endYear) {
			const startKey = startYear * 12 + startMonth;
			const endKey = endYear * 12 + endMonth;
			if (endKey < startKey) {
				return { success: false, message: 'Periode selesai tidak boleh sebelum periode mulai.' };
			}
		}

		await db.insert(schema.santriSmk).values({
			santriId,
			startMonth,
			startYear,
			endMonth,
			endYear
		});

		return { success: true };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const startMonth = Number(data.get('startMonth'));
		const startYear = Number(data.get('startYear'));
		const endMonth = data.get('endMonth') ? Number(data.get('endMonth')) : null;
		const endYear = data.get('endYear') ? Number(data.get('endYear')) : null;

		if (!id || !startMonth || !startYear) {
			return { success: false, message: 'Data tidak lengkap.' };
		}
		if ((endMonth && !endYear) || (!endMonth && endYear)) {
			return { success: false, message: 'Periode selesai harus lengkap (bulan dan tahun).' };
		}
		if (endMonth && endYear) {
			const startKey = startYear * 12 + startMonth;
			const endKey = endYear * 12 + endMonth;
			if (endKey < startKey) {
				return { success: false, message: 'Periode selesai tidak boleh sebelum periode mulai.' };
			}
		}

		await db.update(schema.santriSmk)
			.set({ startMonth, startYear, endMonth, endYear })
			.where(eq(schema.santriSmk.id, id));

		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		await db.delete(schema.santriSmk).where(eq(schema.santriSmk.id, id));
		return { success: true };
	}
};
