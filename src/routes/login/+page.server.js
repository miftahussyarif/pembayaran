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
	normalizeUsername,
	generateOTP,
	pendingOtps
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

		// Prepare function for final successful login
		const proceedWithLogin = async () => {
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
			} catch (e) {}

			// Send telegram notification for normal login if not using 2FA
			try {
				const [pengaturan] = await db.select().from(schema.pengaturanPesantren).limit(1);
				const customToken = user.telegramBotToken;
				const customChatId = user.telegramChatId;
				const systemToken = pengaturan?.telegramBotToken;
				const systemChatId = pengaturan?.telegramChatId;

				if ((customToken && customChatId) || (systemToken && systemChatId)) {
					const userAgent = request.headers.get('user-agent')?.trim() || 'Tidak diketahui';
					const loginTime = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' });
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
					
					let sent = false;
					if (customToken && customChatId) {
						try {
							await sendTelegramTextMessage(customToken, customChatId, message);
							sent = true;
						} catch (e) {}
					}
					if (!sent && systemToken && systemChatId) {
						await sendTelegramTextMessage(systemToken, systemChatId, message).catch(() => {});
					}
				}
			} catch (e) {}
		};

		// 2FA Logic
		let shouldRedirectTo2FA = false;
		try {
			const [pengaturan] = await db.select().from(schema.pengaturanPesantren).limit(1);
			const customToken = user.telegramBotToken;
			const customChatId = user.telegramChatId;
			const systemToken = pengaturan?.telegramBotToken;
			const systemChatId = pengaturan?.telegramChatId;

			if ((customToken && customChatId) || (systemToken && systemChatId)) {
				const existingPending = pendingOtps.get(user.id);
				const hasValidExistingOtp = existingPending && Date.now() < existingPending.expiresAt;

				if (!hasValidExistingOtp) {
					// Generate new OTP and send via Telegram
					const otp = generateOTP(5);
					const userAgent = request.headers.get('user-agent')?.trim() || 'Tidak diketahui';
					const loginTime = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' });
					
					const message = [
						'🔐 KODE KEAMANAN LOGIN',
						'',
						`Seseorang sedang mencoba login sebagai ${user.namaLengkap}.`,
						`IP: ${ipAddress}`,
						`Waktu: ${loginTime}`,
						'',
						`Kode OTP Anda: ${otp}`,
						'',
						'Masukkan kode ini di halaman Security Landing. Kode berlaku 5 menit.'
					].join('\n');

					let messageSent = false;
					if (customToken && customChatId) {
						try {
							await sendTelegramTextMessage(customToken, customChatId, message);
							messageSent = true;
						} catch (e) {
							console.error('[Auth] Gagal mengirim OTP ke bot custom user:', e.message);
						}
					}

					if (!messageSent && systemToken && systemChatId) {
						await sendTelegramTextMessage(systemToken, systemChatId, message);
						messageSent = true;
					}

					if (!messageSent) {
						throw new Error('Kedua metode pengiriman Telegram gagal');
					}

					// If successful, store new pending state
					pendingOtps.set(user.id, {
						otp,
						expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
					});
				}

				// Set temp cookie to identify user during 2FA
				cookies.set('temp_2fa_user', user.id.toString(), {
					path: '/',
					maxAge: 5 * 60 // 5 minutes
				});

				console.log(`[Auth] 2FA OTP generated/reused for user ${user.id}, redirecting to /login/2fa`);
				shouldRedirectTo2FA = true;
			} else {
				await proceedWithLogin();
			}
		} catch (error) {
			console.error('[Auth] Gagal mengirim OTP atau membaca config Telegram:', error.message);
			// Fallback to normal login if bot is misconfigured or fails
			await proceedWithLogin();
		}

		if (shouldRedirectTo2FA) {
			console.log(`[Auth] Throwing redirect to /login/2fa`);
			throw redirect(303, '/login/2fa');
		} else {
			throw redirect(303, '/');
		}
	}
};
