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

// ==========================================
// KONFIGURASI KEAMANAN LOGIN
// ==========================================
const ATTEMPT_WINDOW_MS = 30 * 60 * 1000;        // 30 menit — auto-reset jika tidak ada gagal login dalam 30 menit
const SOFT_THRESHOLD = 3;                          // Setelah 3x gagal → password benar wajib OTP
const HARD_THRESHOLD = 10;                         // Setelah 10x gagal → blokir IP total
const HARD_BLOCK_DURATION_MS = 60 * 60 * 1000;    // Blokir IP selama 1 jam (hard block)

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

		const now = new Date();

		// ==========================================
		// 1. Ambil record percobaan untuk IP ini
		// ==========================================
		let [attemptRecord] = await db.select().from(schema.loginAttempts).where(eq(schema.loginAttempts.ip, ipAddress));

		// ==========================================
		// 2. Auto-reset jika sudah lewat window (TTL)
		//    Jika percobaan terakhir lebih dari 30 menit lalu, reset counter
		// ==========================================
		if (attemptRecord && attemptRecord.lastAttemptAt) {
			const lastAttempt = new Date(attemptRecord.lastAttemptAt);
			const timeSinceLastAttempt = now.getTime() - lastAttempt.getTime();
			if (timeSinceLastAttempt > ATTEMPT_WINDOW_MS) {
				// Sudah lewat window, reset record
				await db.update(schema.loginAttempts)
					.set({ attempts: 0, lockUntil: null, lastAttemptAt: null })
					.where(eq(schema.loginAttempts.ip, ipAddress));
				attemptRecord = { ...attemptRecord, attempts: 0, lockUntil: null, lastAttemptAt: null };
			}
		}

		// ==========================================
		// 3. Cek hard block (IP terblokir karena brute force >= 10x gagal)
		// ==========================================
		if (attemptRecord && attemptRecord.lockUntil && new Date(attemptRecord.lockUntil) > now) {
			const lockEnd = new Date(attemptRecord.lockUntil);
			const sisaMenit = Math.ceil((lockEnd.getTime() - now.getTime()) / 60000);
			return { error: `IP Anda diblokir karena terlalu banyak percobaan gagal. Coba lagi dalam ${sisaMenit} menit.` };
		}

		// ==========================================
		// 4. Validasi input dasar
		// ==========================================
		if (!username || !password) {
			return { error: 'Username dan Password wajib diisi!' };
		}

		if (!isValidUsername(username)) {
			return { error: invalidCredentialsMessage };
		}

		// ==========================================
		// 5. Fungsi untuk mencatat percobaan gagal
		// ==========================================
		const handleFailedLogin = async () => {
			const nowISO = now.toISOString();
			let newAttempts = 1;
			let newLockUntil = null;

			if (attemptRecord) {
				newAttempts = attemptRecord.attempts + 1;

				// Hard block jika mencapai threshold brute force
				if (newAttempts >= HARD_THRESHOLD) {
					newLockUntil = new Date(now.getTime() + HARD_BLOCK_DURATION_MS).toISOString();
				}

				await db.update(schema.loginAttempts)
					.set({ attempts: newAttempts, lockUntil: newLockUntil, lastAttemptAt: nowISO })
					.where(eq(schema.loginAttempts.ip, ipAddress));
			} else {
				await db.insert(schema.loginAttempts).values({
					ip: ipAddress,
					attempts: 1,
					lockUntil: null,
					lastAttemptAt: nowISO
				});
			}

			// Update local reference
			attemptRecord = {
				ip: ipAddress,
				attempts: newAttempts,
				lockUntil: newLockUntil,
				lastAttemptAt: nowISO
			};
		};

		// ==========================================
		// 6. Cari user berdasarkan username
		// ==========================================
		const [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.username, username));

		if (!user) {
			await handleFailedLogin();
			// Pesan tambahan jika mendekati hard block
			if (attemptRecord && attemptRecord.attempts >= HARD_THRESHOLD) {
				return { error: `IP Anda diblokir selama ${HARD_BLOCK_DURATION_MS / 60000} menit karena terlalu banyak percobaan gagal.` };
			}
			return { error: invalidCredentialsMessage };
		}

		// ==========================================
		// 7. Validasi password Hash
		// ==========================================
		const isValidPW = await bcrypt.compare(password, user.passwordHash);

		if (!isValidPW) {
			await handleFailedLogin();
			// Pesan tambahan jika mendekati hard block
			if (attemptRecord && attemptRecord.attempts >= HARD_THRESHOLD) {
				return { error: `IP Anda diblokir selama ${HARD_BLOCK_DURATION_MS / 60000} menit karena terlalu banyak percobaan gagal.` };
			}
			return { error: invalidCredentialsMessage };
		}

		// ==========================================
		// 8. Password BENAR — cek apakah perlu security OTP challenge
		//    Jika IP sudah gagal >= SOFT_THRESHOLD kali, wajib verifikasi OTP
		//    meskipun password benar (untuk memastikan bukan brute force yang beruntung)
		// ==========================================
		const currentAttempts = attemptRecord ? attemptRecord.attempts : 0;
		const needsSecurityChallenge = currentAttempts >= SOFT_THRESHOLD;

		if (needsSecurityChallenge) {
			// Kirim OTP challenge untuk verifikasi keamanan
			try {
				const [pengaturan] = await db.select().from(schema.pengaturanPesantren).limit(1);
				const customToken = user.telegramBotToken;
				const customChatId = user.telegramChatId;
				const systemToken = pengaturan?.telegramBotToken;
				const systemChatId = pengaturan?.telegramChatId;

				if (!((customToken && customChatId) || (systemToken && systemChatId))) {
					// Tidak ada Telegram yang dikonfigurasi, fallback: tetap blokir
					return { error: 'Terlalu banyak percobaan gagal. Tidak ada kanal verifikasi keamanan yang tersedia. Hubungi administrator.' };
				}

				// Generate OTP baru untuk security challenge
				const existingPending = pendingOtps.get(user.id);
				const hasValidExistingOtp = existingPending && Date.now() < existingPending.expiresAt;

				if (!hasValidExistingOtp) {
					const otp = generateOTP(5);
					const userAgent = request.headers.get('user-agent')?.trim() || 'Tidak diketahui';
					const loginTime = now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' });

					const message = [
						'⚠️ VERIFIKASI KEAMANAN LOGIN',
						'',
						`Terdeteksi ${currentAttempts}x percobaan gagal login dari IP ${ipAddress}.`,
						`Seseorang berhasil memasukkan password yang benar untuk akun ${user.namaLengkap}.`,
						'',
						`Kode OTP Anda: ${otp}`,
						'',
						`URL Login: ${loginUrl}`,
						`Waktu: ${loginTime}`,
						`User-Agent: ${userAgent.slice(0, 180)}`,
						'',
						'Masukkan kode ini di halaman verifikasi. Kode berlaku 5 menit.',
						'Jika bukan Anda, segera ganti password!'
					].join('\n');

					let messageSent = false;
					// Prioritas: bot personal user dulu
					if (customToken && customChatId) {
						try {
							await sendTelegramTextMessage(customToken, customChatId, message);
							messageSent = true;
						} catch (e) {
							console.error('[Auth] Gagal mengirim OTP ke bot custom user:', e.message);
						}
					}
					// Fallback: bot sistem
					if (!messageSent && systemToken && systemChatId) {
						try {
							await sendTelegramTextMessage(systemToken, systemChatId, message);
							messageSent = true;
						} catch (e) {
							console.error('[Auth] Gagal mengirim OTP ke bot sistem:', e.message);
						}
					}

					if (!messageSent) {
						return { error: 'Gagal mengirim kode verifikasi keamanan. Hubungi administrator.' };
					}

					pendingOtps.set(user.id, {
						otp,
						expiresAt: Date.now() + 5 * 60 * 1000, // 5 menit
						isSecurityChallenge: true // Tandai ini security challenge
					});
				}

				// Set temp cookie untuk identifikasi user selama verifikasi
				cookies.set('temp_2fa_user', user.id.toString(), {
					path: '/',
					maxAge: 5 * 60 // 5 menit
				});

				console.log(`[Auth] Security OTP challenge for user ${user.id} (${currentAttempts}x failed attempts from IP ${ipAddress})`);
				throw redirect(303, '/login/2fa');
			} catch (e) {
				if (e?.status === 303) throw e; // Re-throw redirect
				console.error('[Auth] Error in security challenge flow:', e.message);
				return { error: 'Terjadi kesalahan saat verifikasi keamanan. Coba lagi nanti.' };
			}
		}

		// ==========================================
		// 9. Password benar & tidak perlu security challenge
		//    Hapus record percobaan gagal (reset)
		// ==========================================
		if (attemptRecord) {
			await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.ip, ipAddress));
		}

		// ==========================================
		// 10. Fungsi untuk melanjutkan login sukses
		// ==========================================
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

		// ==========================================
		// 11. 2FA Logic (untuk user yang mengaktifkan OTP 2FA)
		// ==========================================
		let shouldRedirectTo2FA = false;
		try {
			const [pengaturan] = await db.select().from(schema.pengaturanPesantren).limit(1);
			const customToken = user.telegramBotToken;
			const customChatId = user.telegramChatId;
			const systemToken = pengaturan?.telegramBotToken;
			const systemChatId = pengaturan?.telegramChatId;

			if (user.otp2faEnabled !== false && ((customToken && customChatId) || (systemToken && systemChatId))) {
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
