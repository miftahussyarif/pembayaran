import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import {
	buildSessionCookieValue,
	createSessionToken,
	getSessionCookieName,
	getSessionCookieOptions,
	isValidUsername,
	normalizeUsername
} from '$lib/server/auth.js';
import { sendTelegramTextMessage } from '$lib/server/backup.js';

export const actions = {
	login: async ({ request, cookies, getClientAddress }) => {
		const ipAddress = getClientAddress();
		const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
		const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
		const requestUrl = new URL(request.url);
		const loginOrigin = forwardedProto && forwardedHost
			? `${forwardedProto}://${forwardedHost}`
			: requestUrl.origin;
		const loginUrl = `${loginOrigin}/login`;
		const data = await request.formData();
		const username = normalizeUsername(data.get('username') ?? '');
		const password = data.get('password')?.toString() || '';
		const invalidCredentialsMessage = 'Username atau password tidak valid.';

		const [attemptRecord] = await db.select().from(schema.loginAttempts).where(eq(schema.loginAttempts.ip, ipAddress));
		if (attemptRecord) {
			if (attemptRecord.lockUntil && new Date(attemptRecord.lockUntil) > new Date()) {
				return { error: 'Terlalu banyak percobaan gagal. IP Anda diblokir selama 24 jam.' };
			}
		}

		if (!username || !password) {
			return { error: 'Username dan Password wajib diisi!' };
		}

		if (!isValidUsername(username)) {
			return { error: invalidCredentialsMessage };
		}

		const handleFailedLogin = async () => {
			const now = new Date();
			let newAttempts = 1;
			let newLockUntil = null;
			
			if (attemptRecord) {
				if (attemptRecord.lockUntil && new Date(attemptRecord.lockUntil) <= now) {
					newAttempts = 1; 
				} else {
					newAttempts = attemptRecord.attempts + 1;
				}
				
				if (newAttempts >= 3) {
					newLockUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
				}
				await db.update(schema.loginAttempts)
					.set({ attempts: newAttempts, lockUntil: newLockUntil })
					.where(eq(schema.loginAttempts.ip, ipAddress));
			} else {
				await db.insert(schema.loginAttempts).values({
					ip: ipAddress,
					attempts: 1,
					lockUntil: null
				});
			}
		};

		// Cari user berdasarkan username
		const [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.username, username));

		if (!user) {
			await handleFailedLogin();
			return { error: invalidCredentialsMessage };
		}

		// Validasi passsword Hash
		const isValidPW = await bcrypt.compare(password, user.passwordHash);
		
		if (!isValidPW) {
			await handleFailedLogin();
			return { error: invalidCredentialsMessage };
		}

		if (attemptRecord) {
			await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.ip, ipAddress));
		}

		const newSessionId = createSessionToken();

		// Update sessionId in database
		await db.update(schema.users)
			.set({ sessionId: newSessionId })
			.where(eq(schema.users.id, user.id));

		// Generate token session / nyimpan ID nRole (Sementara pake cookie biasa HTTP-Only)
		cookies.set(
			getSessionCookieName(),
			buildSessionCookieValue({ userId: user.id, sessionId: newSessionId }),
			getSessionCookieOptions()
		);

		try {
			await db.insert(schema.systemLogs).values({
				userId: user.id,
				username: user.username,
				role: user.role,
				aksi: 'login',
				modul: 'auth',
				keterangan: `Login berhasil oleh ${user.namaLengkap}`,
				ip: ipAddress,
				createdAt: new Date().toISOString()
			});
		} catch (e) {
			// ignore logging errors
		}

		try {
			const [pengaturan] = await db.select().from(schema.pengaturanPesantren).limit(1);
			if (pengaturan?.telegramBotToken && pengaturan?.telegramChatId) {
				const userAgent = request.headers.get('user-agent')?.trim() || 'Tidak diketahui';
				const loginTime = new Date().toLocaleString('id-ID', {
					dateStyle: 'medium',
					timeStyle: 'medium'
				});
				const message = [
					'🔐 Login user berhasil',
					`URL Login: ${loginUrl}`,
					`Nama: ${user.namaLengkap}`,
					`Username: ${user.username}`,
					`Role: ${user.role}`,
					`IP: ${ipAddress}`,
					`Waktu: ${loginTime}`,
					`User-Agent: ${userAgent.slice(0, 180)}`
				].join('\n');

				void sendTelegramTextMessage(
					pengaturan.telegramBotToken,
					pengaturan.telegramChatId,
					message
				).catch((error) => {
					console.error('[Auth] Gagal mengirim notifikasi login ke Telegram:', error.message);
				});
			}
		} catch (error) {
			console.error('[Auth] Gagal membaca konfigurasi Telegram:', error.message);
		}

		throw redirect(303, '/');
	}
};
