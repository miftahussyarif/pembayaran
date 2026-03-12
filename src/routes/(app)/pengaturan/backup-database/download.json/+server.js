import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';

export const GET = async ({ locals }) => {
	if (locals.user?.role !== 'admin') {
		return new Response('Forbidden', { status: 403 });
	}

	const pembayaran = await db.select().from(schema.pembayaran);
	const mutasi = await db.select().from(schema.mutasiSaldoBendahara);
	const systemLogs = await db.select().from(schema.systemLogs);
	const users = await db.select().from(schema.users);
	const pengaturan = await db.select().from(schema.pengaturanPesantren);
	const tahunAjaran = await db.select().from(schema.tahunAjaran);
	const jenisPembayaran = await db.select().from(schema.jenisPembayaran);
	const kategoriSantri = await db.select().from(schema.kategoriSantri);
	const santri = await db.select().from(schema.santri);
	const santriSmk = await db.select().from(schema.santriSmk);
	const santriSmp = await db.select().from(schema.santriSmp);

	const payload = {
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

	const json = JSON.stringify(payload, null, 2);

	return new Response(json, {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': 'attachment; filename="backup-transaksi.json"'
		}
	});
};
