import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { generateBackup, sendBackupToTelegram } from '$lib/server/backup.js';

export const load = async ({ locals }) => {
	if (locals.user?.role !== 'admin') {
		throw redirect(303, '/');
	}

	const pengaturan = await db.select().from(schema.pengaturanPesantren).limit(1);

	return {
		pengaturan: pengaturan[0] || {}
	};
};

export const actions = {
	saveSettings: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403);

		const formData = await request.formData();
		const botToken = formData.get('botToken');
		const chatId = formData.get('chatId');

		const pengaturan = await db.select().from(schema.pengaturanPesantren).limit(1);

		if (pengaturan.length > 0) {
			await db.update(schema.pengaturanPesantren)
				.set({
					telegramBotToken: botToken,
					telegramChatId: chatId
				})
				.where(eq(schema.pengaturanPesantren.id, pengaturan[0].id));
		} else {
			await db.insert(schema.pengaturanPesantren).values({
				telegramBotToken: botToken,
				telegramChatId: chatId
			});
		}

		return { success: true, message: 'Pengaturan Telegram berhasil disimpan' };
	},

	testTelegram: async ({ locals }) => {
		if (locals.user?.role !== 'admin') return fail(403);

		const pengaturan = await db.select().from(schema.pengaturanPesantren).limit(1);
		if (!pengaturan[0]?.telegramBotToken || !pengaturan[0]?.telegramChatId) {
			return fail(400, { message: 'Token Bot atau Chat ID belum dikonfigurasi' });
		}

		try {
			// Minimal test: sending a simple message
			const url = `https://api.telegram.org/bot${pengaturan[0].telegramBotToken}/sendMessage`;
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: pengaturan[0].telegramChatId,
					text: `✅ Koneksi Bot Telegram Berhasil!\nSistem siap mengirim backup otomatis.`
				})
			});
			const result = await response.json();

			if (result.ok) {
				return { success: true, message: 'Tes koneksi berhasil terkirim ke Telegram' };
			} else {
				return fail(500, { message: `Gagal: ${result.description || 'Unknown error'}` });
			}
		} catch (error) {
			return fail(500, { message: `Gagal: ${error.message}` });
		}
	},

	backupNow: async ({ locals }) => {
		if (locals.user?.role !== 'admin') return fail(403);

		const pengaturan = await db.select().from(schema.pengaturanPesantren).limit(1);
		if (!pengaturan[0]?.telegramBotToken || !pengaturan[0]?.telegramChatId) {
			return fail(400, { message: 'Token Bot atau Chat ID belum dikonfigurasi' });
		}

		try {
			const backupData = await generateBackup();
			const result = await sendBackupToTelegram(
				pengaturan[0].telegramBotToken,
				pengaturan[0].telegramChatId,
				backupData
			);

			if (result.ok) {
				return { success: true, message: 'Backup berhasil dikirim ke Telegram sekarang' };
			} else {
				return fail(500, { message: `Gagal mengirim ke Telegram: ${result.description || 'Unknown error'}` });
			}
		} catch (error) {
			console.error('Backup Now Error:', error);
			return fail(500, { message: `Gagal mengirim backup: ${error.message}` });
		}
	}
};
