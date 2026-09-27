import { generateBackup, sendBackupToTelegram } from '$lib/server/backup.js';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';

const allowedSecret = process.env.CRON_SECRET || '';

export const GET = async ({ request }) => {
	const authHeader = request.headers.get('authorization') || '';
	const secret = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

	if (!allowedSecret || secret !== allowedSecret) {
		return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const pengaturan = await db.select().from(schema.pengaturanPesantren).limit(1);
		if (!pengaturan[0]?.telegramBotToken || !pengaturan[0]?.telegramChatId) {
			return new Response(JSON.stringify({ ok: false, error: 'Telegram not configured' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
		});
		}

		const backupData = await generateBackup();
		const result = await sendBackupToTelegram(
			pengaturan[0].telegramBotToken,
			pengaturan[0].telegramChatId,
			backupData
		);

		return new Response(JSON.stringify({ ok: Boolean(result?.ok), result }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('[Cron Backup] Failed:', error);
		return new Response(JSON.stringify({ ok: false, error: String(error?.message || error) }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
