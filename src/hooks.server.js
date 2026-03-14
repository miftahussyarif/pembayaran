import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { generateBackup, sendBackupToTelegram } from '$lib/server/backup.js';

// Setup Daily Backup Cron (Every Minute Check)
let lastBackupDate = '';

if (typeof process !== 'undefined') {
	setInterval(async () => {
		const now = new Date();
		const today = now.toISOString().split('T')[0];
		const hour = now.getHours();
		const minute = now.getMinutes();

		// Check if it's 12:00 PM and we haven't backed up today
		if (hour === 12 && minute === 0 && lastBackupDate !== today) {
			console.log(`[Backup] Starting scheduled backup for ${today}...`);
			try {
				const pengaturan = await db.select().from(schema.pengaturanPesantren).limit(1);
				if (pengaturan[0]?.telegramBotToken && pengaturan[0]?.telegramChatId) {
					const backupData = await generateBackup();
					const result = await sendBackupToTelegram(
						pengaturan[0].telegramBotToken,
						pengaturan[0].telegramChatId,
						backupData
					);
					
					if (result.ok) {
						console.log(`[Backup] Scheduled backup sent to Telegram: ${today}`);
						lastBackupDate = today;
					} else {
						console.error(`[Backup] Failed to send scheduled backup:`, result);
					}
				} else {
					console.log(`[Backup] Telegram not configured, skipping scheduled backup.`);
					// Mark as done even if skipped to avoid repeating logs every minute during the hour 12:00
					lastBackupDate = today;
				}
			} catch (error) {
				console.error(`[Backup] Scheduled backup error:`, error);
			}
		}
	}, 60000); // Pulse every 1 minute
}

export const handle = async ({ event, resolve }) => {
	// 1. Ambil session cookie
	const sessionCookie = event.cookies.get('sessionid');
	let sessionUser = null;

	if (sessionCookie) {
		try {
			sessionUser = JSON.parse(sessionCookie);
			if (sessionUser?.id && sessionUser?.sessionId) {
				const userInDb = await db.select({ sessionId: schema.users.sessionId }).from(schema.users).where(eq(schema.users.id, sessionUser.id)).limit(1);
				if (userInDb.length > 0 && userInDb[0].sessionId === sessionUser.sessionId) {
					// Session valid, perpanjang cookie
					event.cookies.set('sessionid', sessionCookie, {
						path: '/',
						httpOnly: true,
						sameSite: 'strict',
						maxAge: 60 * 60 * 6 // 6 jam
					});
				} else {
					// Session tidak valid (Multi login detect / session expired)
					sessionUser = null;
					event.cookies.delete('sessionid', { path: '/' });
				}
			} else {
				// Format cookie lama yang belum ada sessionId, suruh relogin
				sessionUser = null;
				event.cookies.delete('sessionid', { path: '/' });
			}
		} catch (e) {
			// invalid cookie JSON
		}
	}

	// 2. Proteksi Halaman Internal
	// Jika user BUKAN di halaman /login, dan dia TIDAK PUNYA session -> Redirect ke /login
	if (event.url.pathname !== '/login' && !sessionUser) {
		throw redirect(303, '/login');
	}

	// Jika Punya session, dan malah mencoba buka halaman /login -> Redirect ke dashboard (/)
	if (event.url.pathname === '/login' && sessionUser) {
		throw redirect(303, '/');
	}

	// 2.5 Role-Based Page Access Protection
	if (sessionUser) {
		const path = event.url.pathname;
		
		if (sessionUser.role === 'bendahara') {
			// Bendahara is only allowed on /, /master/*, /transaksi/*, and /logout
			const isAllowedForBendahara = 
				path === '/' || 
				path.startsWith('/master/') || 
				path.startsWith('/transaksi/') ||
				path === '/pengaturan/saldo-keuangan' ||
				path === '/logout';
				
			if (!isAllowedForBendahara) {
				throw redirect(303, '/');
			}
		}
		
		if (sessionUser.role === 'petugas') {
			// Petugas hanya boleh akses dashboard dan menu transaksi tertentu
			const isAllowedForPetugas =
				path === '/' ||
				path === '/transaksi/input' ||
				path === '/transaksi/riwayat' ||
				path === '/transaksi/rekapitulasi' ||
				path === '/transaksi/rekap-individu' ||
				path.startsWith('/transaksi/cetak/') ||
				path === '/logout';
			
			if (!isAllowedForPetugas) {
				throw redirect(303, '/');
			}
		}
	}

	// 3. Melekatkan session info ke `event.locals` agar bisa diakses oleh Svelte di components / layout
	event.locals.user = sessionUser || undefined;

	return resolve(event);
};
