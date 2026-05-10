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

	// Ambil semua kategori santri per tahun ajaran (relasi baru)
	const kategoriTahunRows = await db.select().from(schema.santriKategoriTahun)
		.where(eq(schema.santriKategoriTahun.santriId, santriId));

	const allKategoris = await db.select().from(schema.kategoriSantri);
	const allTahunAjarans = await db.select().from(schema.tahunAjaran);

	// Group by tahun ajaran, sort by tahun_ajaran_id desc
	const byTahun = new Map();
	for (const row of kategoriTahunRows) {
		if (!byTahun.has(row.tahunAjaranId)) byTahun.set(row.tahunAjaranId, []);
		byTahun.get(row.tahunAjaranId).push(row.kategoriId);
	}
	// Helper: extract first year number from tahun ajaran name for proper sorting
	const extractYear = (nama) => {
		const match = String(nama || '').match(/(\d{4})/);
		return match ? Number(match[1]) : 0;
	};

	const kategoriTahunList = [...byTahun.entries()]
		.map(([tahunAjaranId, kategoriIds]) => ({
			tahunNama: allTahunAjarans.find((t) => t.id === tahunAjaranId)?.nama || String(tahunAjaranId),
			tahunAjaranId,
			kategoriNama: kategoriIds
				.map((kid) => allKategoris.find((k) => k.id === kid)?.namaKategori || '')
				.filter(Boolean)
		}))
		.sort((a, b) => extractYear(a.tahunNama) - extractYear(b.tahunNama));

	// Fallback: jika belum ada di relasi baru, pakai kategoriId lama
	let kategori = null;
	if (santri.kategoriId && kategoriTahunList.length === 0) {
		const [kat] = await db.select().from(schema.kategoriSantri).where(eq(schema.kategoriSantri.id, santri.kategoriId));
		kategori = kat || null;
	}

	return {
		santri,
		detail: detail || {},
		kategori,
		kategoriTahunList
	};
}

