import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

export const actions = {
	login: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString() || '';
		const password = data.get('password')?.toString() || '';

		if (!username || !password) {
			return { error: 'Username dan Password wajib diisi!' };
		}

		// Cari user berdasarkan username
		const [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.username, username));

		if (!user) {
			return { error: 'Username tidak ditemukan' };
		}

		// Validasi passsword Hash
		const isValidPW = await bcrypt.compare(password, user.passwordHash);
		
		if (!isValidPW) {
			return { error: 'Password yang Anda masukkan salah.' };
		}

		const newSessionId = crypto.randomUUID();

		// Update sessionId in database
		await db.update(schema.users)
			.set({ sessionId: newSessionId })
			.where(eq(schema.users.id, user.id));

		// Generate token session / nyimpan ID nRole (Sementara pake cookie biasa HTTP-Only)
		const sessionData = {
			id: user.id,
			username: user.username,
			role: user.role,
			namaLengkap: user.namaLengkap,
			sessionId: newSessionId
		};

		cookies.set('sessionid', JSON.stringify(sessionData), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 6 // 6 jam 
		});

		try {
			await db.insert(schema.systemLogs).values({
				userId: user.id,
				username: user.username,
				role: user.role,
				aksi: 'login',
				modul: 'auth',
				keterangan: `Login berhasil oleh ${user.namaLengkap}`,
				ip: getClientAddress(),
				createdAt: new Date().toISOString()
			});
		} catch (e) {
			// ignore logging errors
		}

		throw redirect(303, '/');
	}
};
