import { generateBackup } from '$lib/server/backup.js';

export const GET = async ({ locals }) => {
	if (locals.user?.role !== 'admin') {
		return new Response('Forbidden', { status: 403 });
	}

	const payload = await generateBackup();
	const json = JSON.stringify(payload, null, 2);

	return new Response(json, {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': 'attachment; filename="backup-transaksi.json"'
		}
	});
};
