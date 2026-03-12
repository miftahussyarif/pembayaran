import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';

export const GET = async ({ locals }) => {
	if (locals.user?.role !== 'admin') {
		return new Response('Forbidden', { status: 403 });
	}

	const payload = await db.transaction(async (tx) => {
		const pembayaran = await tx.select().from(schema.pembayaran);
		const mutasi = await tx.select().from(schema.mutasiSaldoBendahara);
		const systemLogs = await tx.select().from(schema.systemLogs);
		const users = await tx.select().from(schema.users);
		const pengaturan = await tx.select().from(schema.pengaturanPesantren);
		const tahunAjaran = await tx.select().from(schema.tahunAjaran);
		const jenisPembayaran = await tx.select().from(schema.jenisPembayaran);
		const kategoriSantri = await tx.select().from(schema.kategoriSantri);
		const santri = await tx.select().from(schema.santri);
		const santriSmk = await tx.select().from(schema.santriSmk);
		const santriSmp = await tx.select().from(schema.santriSmp);

		return {
			type: 'pesantren-backup',
			version: 1,
			exportedAt: new Date().toISOString(),
			data: {
				users,
				pengaturan,
				tahunAjaran,
				jenisPembayaran,
				kategoriSantri,
				santri,
				santriSmk,
				santriSmp,
				pembayaran,
				mutasi,
				systemLogs
			}
		};
	});

	const json = JSON.stringify(payload, null, 2);

	return new Response(json, {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': 'attachment; filename="backup-transaksi.json"'
		}
	});
};
