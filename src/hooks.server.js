import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { generateBackup, sendBackupToTelegram } from '$lib/server/backup.js';
import {
	buildSessionCookieValue,
	getSessionCookieName,
	getSessionCookieOptions,
	parseSessionCookieValue
} from '$lib/server/auth.js';

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
	const sessionCookieName = getSessionCookieName();
	const sessionCookie = event.cookies.get(sessionCookieName);
	let sessionUser = null;

	if (sessionCookie) {
		const parsedSession = parseSessionCookieValue(sessionCookie);
		if (parsedSession) {
			const [userInDb] = await db
				.select({
					id: schema.users.id,
					username: schema.users.username,
					role: schema.users.role,
					namaLengkap: schema.users.namaLengkap,
					signatureUrl: schema.users.signatureUrl,
					sessionId: schema.users.sessionId
				})
				.from(schema.users)
				.where(eq(schema.users.id, parsedSession.userId))
				.limit(1);

			if (userInDb?.sessionId && userInDb.sessionId === parsedSession.sessionId) {
				sessionUser = {
					id: userInDb.id,
					username: userInDb.username,
					role: userInDb.role,
					namaLengkap: userInDb.namaLengkap,
					signatureUrl: userInDb.signatureUrl,
					sessionId: userInDb.sessionId
				};

				event.cookies.set(
					sessionCookieName,
					buildSessionCookieValue({
						userId: userInDb.id,
						sessionId: userInDb.sessionId
					}),
					getSessionCookieOptions()
				);
			} else {
				event.cookies.delete(sessionCookieName, { path: '/' });
			}
		} else {
			event.cookies.delete(sessionCookieName, { path: '/' });
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
			// Petugas boleh akses dashboard, menu transaksi tertentu, dan data master
			const isAllowedForPetugas =
				path === '/' ||
				path === '/master/santri' ||
				path.startsWith('/master/santri/') ||
				path === '/master/data-siswa-smk' ||
				path.startsWith('/master/data-siswa-smk/') ||
				path === '/master/data-siswa-smp' ||
				path.startsWith('/master/data-siswa-smp/') ||
				path === '/transaksi/input' ||
				path === '/transaksi/riwayat' ||
				path === '/transaksi/rekapitulasi' ||
				path === '/transaksi/rekap-individu' ||
				path === '/transaksi/rekap-petugas' ||
				path.startsWith('/transaksi/cetak/') ||
				path === '/logout';
			
			if (!isAllowedForPetugas) {
				throw redirect(303, '/');
			}
		}
	}

	// 3. Melekatkan session info ke `event.locals` agar bisa diakses oleh Svelte di components / layout
	event.locals.user = sessionUser || undefined;

	const response = await resolve(event);

	response.headers.set('x-frame-options', 'DENY');
	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'permissions-policy',
		'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
	);
	response.headers.set(
		'content-security-policy',
		"base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'"
	);

	return response;
};
