import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import {
	buildSessionCookieValue,
	createSessionToken,
	getSessionCookieName,
	getSessionCookieOptions,
	pendingOtps
} from '$lib/server/auth.js';

export async function load({ cookies }) {
	const tempUserId = cookies.get('temp_2fa_user');
	console.log(`[2FA Load] temp_2fa_user cookie:`, tempUserId);
	if (!tempUserId) {
		console.log(`[2FA Load] No temp_2fa_user cookie found. Redirecting to /login`);
		throw redirect(303, '/login');
	}
	return {};
}

export const actions = {
	verify: async ({ request, cookies, getClientAddress }) => {
		const tempUserId = cookies.get('temp_2fa_user');
		if (!tempUserId) return { error: 'Sesi kedaluwarsa. Silakan login kembali.' };

		const userId = parseInt(tempUserId);
		const data = await request.formData();
		const otpInput = data.get('otp')?.toString().toUpperCase().trim();

		if (!otpInput || otpInput.length !== 5) {
			return { error: 'Kode OTP harus berupa 5 digit.' };
		}

		const pending = pendingOtps.get(userId);
		if (!pending) return { error: 'Sesi OTP tidak valid atau sudah kedaluwarsa. Silakan login kembali.' };
		
		if (Date.now() > pending.expiresAt) {
			pendingOtps.delete(userId);
			return { error: 'Kode OTP sudah kedaluwarsa. Silakan login kembali.' };
		}

		if (pending.otp !== otpInput) {
			return { error: 'Kode OTP salah. Silakan coba lagi.' };
		}

		// Valid OTP, log the user in!
		// We do NOT delete the OTP from the map.
		// This allows the user to log out and log back in within 5 minutes using the same OTP.

		const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
		if (!user) return { error: 'User tidak ditemukan.' };

		const ipAddress = getClientAddress();

		// Hapus record login attempts untuk IP ini (reset setelah berhasil verifikasi)
		try {
			await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.ip, ipAddress));
		} catch (e) {}

		const newSessionId = createSessionToken();

		await db.update(schema.users)
			.set({ sessionId: newSessionId })
			.where(eq(schema.users.id, user.id));

		cookies.set(
			getSessionCookieName(),
			buildSessionCookieValue({ userId: user.id, sessionId: newSessionId }),
			getSessionCookieOptions()
		);

		// Remove temporary 2FA cookie
		cookies.delete('temp_2fa_user', { path: '/' });

		try {
			const isSecurityChallenge = pending.isSecurityChallenge === true;
			await db.insert(schema.systemLogs).values({
				userId: user.id,
				username: user.username,
				role: user.role,
				aksi: 'login',
				modul: 'auth',
				keterangan: isSecurityChallenge
					? `Login (Security Challenge OTP) berhasil oleh ${user.namaLengkap}`
					: `Login (2FA) berhasil oleh ${user.namaLengkap}`,
				ip: ipAddress,
				createdAt: new Date().toISOString()
			});
		} catch (e) {}

		// Send telegram notification to system backup bot
		try {
			const { sendTelegramTextMessage } = await import('$lib/server/backup.js');
			const [pengaturan] = await db.select().from(schema.pengaturanPesantren).limit(1);
			const systemToken = pengaturan?.telegramBotToken;
			const systemChatId = pengaturan?.telegramChatId;

			if (systemToken && systemChatId) {
				const userAgent = request.headers.get('user-agent')?.trim() || 'Tidak diketahui';
				const loginTime = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' });
				
				const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
				const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
				const requestUrl = new URL(request.url);
				const loginOrigin = forwardedProto && forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestUrl.origin;

				const message = [
					`🔐 Login user berhasil (${pending.isSecurityChallenge ? 'Security Challenge' : 'Dengan 2FA'})`,
					`URL Login: ${loginOrigin}/login`,
					`Nama: ${user.namaLengkap}`,
					`Username: ${user.username}`,
					`Role: ${user.role}`,
					`IP: ${ipAddress}`,
					`Waktu: ${loginTime}`,
					`User-Agent: ${userAgent.slice(0, 180)}`
				].join('\n');
				
				await sendTelegramTextMessage(systemToken, systemChatId, message).catch(() => {});
			}
		} catch (e) {}

		throw redirect(303, '/');
	}
};

