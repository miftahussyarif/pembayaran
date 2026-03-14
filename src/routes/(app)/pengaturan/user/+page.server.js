import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const saveSignature = async (file) => {
	if (!file || typeof file !== 'object' || !('arrayBuffer' in file) || file.size === 0) return '';
	const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
	if (!allowed.includes(file.type)) {
		throw new Error('Format tanda tangan harus JPG/JPEG atau PNG.');
	}
	const uploadsDir = path.join('static', 'uploads');
	await mkdir(uploadsDir, { recursive: true });
	const ext = file.type === 'image/png' ? 'png' : 'jpg';
	const filename = `signature-${Date.now()}.${ext}`;
	const filePath = path.join(uploadsDir, filename);
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(filePath, buffer);
	return `/uploads/${filename}`;
};

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
		const signatureFile = data.get('signatureFile');

		const passwordHash = await bcrypt.hash(password, 10);
		let signatureUrl = '';

		try {
			if (signatureFile && typeof signatureFile === 'object' && signatureFile.size > 0) {
				signatureUrl = await saveSignature(signatureFile);
			}
			await db.insert(schema.users).values({
				username,
				passwordHash,
				role,
				namaLengkap,
				signatureUrl
			});
			return { type: 'success', message: 'User baru berhasil ditambahkan.' };
		} catch (e) {
			if (e?.message?.includes('JPG') || e?.message?.includes('PNG')) {
				return { type: 'error', message: e.message };
			}
			return { type: 'error', message: 'Gagal menambah user. Username mungkin sudah ada.' };
		}
	},

	updateUser: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const namaLengkap = data.get('namaLengkap')?.toString().trim() || '';
		const role = data.get('role')?.toString() || 'petugas';
		const signatureFile = data.get('signatureFile');

		try {
			let signatureUrl;
			if (signatureFile && typeof signatureFile === 'object' && signatureFile.size > 0) {
				signatureUrl = await saveSignature(signatureFile);
			}
			const updateData = signatureUrl ? { namaLengkap, role, signatureUrl } : { namaLengkap, role };
			await db.update(schema.users)
				.set(updateData)
				.where(eq(schema.users.id, id));
			return { type: 'success', message: 'Data user berhasil diperbarui.' };
		} catch (e) {
			if (e?.message?.includes('JPG') || e?.message?.includes('PNG')) {
				return { type: 'error', message: e.message };
			}
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
