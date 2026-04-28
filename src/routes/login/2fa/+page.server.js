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
			await db.insert(schema.systemLogs).values({
				userId: user.id,
				username: user.username,
				role: user.role,
				aksi: 'login',
				modul: 'auth',
				keterangan: `Login (2FA) berhasil oleh ${user.namaLengkap}`,
				ip: getClientAddress(),
				createdAt: new Date().toISOString()
			});
		} catch (e) {}

		throw redirect(303, '/');
	}
};
