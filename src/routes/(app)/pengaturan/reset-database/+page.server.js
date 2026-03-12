import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export const load = async ({ locals }) => {
	if (locals.user?.role !== 'admin') {
		throw redirect(303, '/');
	}
	return {};
};

export const actions = {
	reset: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') {
			throw redirect(303, '/');
		}

		const data = await request.formData();
		const password = data.get('password')?.toString() || '';

		if (!password) {
			return { type: 'error', message: 'Password wajib diisi.' };
		}

		const [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.id, locals.user.id));

		if (!user) {
			return { type: 'error', message: 'User admin tidak ditemukan.' };
		}

		const isValid = await bcrypt.compare(password, user.passwordHash);
		if (!isValid) {
			return { type: 'error', message: 'Password admin salah.' };
		}

		try {
			await db.delete(schema.pembayaran);
			await db.delete(schema.mutasiSaldoBendahara);
			await db.delete(schema.systemLogs);
			return { type: 'success', message: 'Database berhasil direset (riwayat pembayaran, mutasi saldo, dan system log).' };
		} catch (e) {
			return { type: 'error', message: 'Gagal reset database.' };
		}
	}
};
