import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import bcrypt from 'bcrypt';

export const load = async ({ locals }) => {
	if (locals.user?.role !== 'admin') {
		throw redirect(303, '/');
	}

	const users = await db.select().from(schema.users);
	return { users };
};

export const actions = {
	createUser: async ({ request }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString() || '';
		const password = data.get('password')?.toString() || '';
		const role = data.get('role')?.toString() || 'petugas';
		const namaLengkap = data.get('namaLengkap')?.toString() || '';

		const passwordHash = await bcrypt.hash(password, 10);

		try {
			await db.insert(schema.users).values({
				username,
				passwordHash,
				role,
				namaLengkap
			});
			return { type: 'success', message: 'User baru berhasil ditambahkan.' };
		} catch (e) {
			return { type: 'error', message: 'Gagal menambah user. Username mungkin sudah ada.' };
		}
	},

	updateUser: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const namaLengkap = data.get('namaLengkap')?.toString().trim() || '';
		const role = data.get('role')?.toString() || 'petugas';

		try {
			await db.update(schema.users)
				.set({ namaLengkap, role })
				.where(eq(schema.users.id, id));
			return { type: 'success', message: 'Data user berhasil diperbarui.' };
		} catch (e) {
			return { type: 'error', message: 'Gagal memperbarui data user.' };
		}
	},

	resetPassword: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const newPassword = data.get('newPassword')?.toString() || '';

		if (newPassword.length < 4) {
			return { type: 'error', message: 'Password minimal 4 karakter.' };
		}

		try {
			const passwordHash = await bcrypt.hash(newPassword, 10);
			await db.update(schema.users)
				.set({ passwordHash })
				.where(eq(schema.users.id, id));
			return { type: 'success', message: 'Password berhasil direset.' };
		} catch (e) {
			return { type: 'error', message: 'Gagal mereset password.' };
		}
	},

	deleteUser: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));

		try {
			await db.delete(schema.users).where(eq(schema.users.id, id));
			return { type: 'success', message: 'User berhasil dihapus.' };
		} catch (e) {
			return { type: 'error', message: 'Gagal menghapus user.' };
		}
	}
};
