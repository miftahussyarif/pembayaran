import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const load = async ({ locals }) => {
	// Pastikan hanya ADMIN yang boleh akses Pengaturan
	if (locals.user?.role !== 'admin') {
		throw redirect(303, '/');
	}
	return {};
};

export const actions = {
	updateProfil: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const namaPesantren = data.get('namaPesantren')?.toString() || '';
		const alamat = data.get('alamat')?.toString() || '';
		const noTelp = data.get('noTelp')?.toString() || '';
		const logoFile = data.get('logoFile');

		try {
			const [current] = await db
				.select()
				.from(schema.pengaturanPesantren)
				.where(eq(schema.pengaturanPesantren.id, id));

			let logoUrl = current?.logoUrl || '';

			if (logoFile && typeof logoFile === 'object' && 'arrayBuffer' in logoFile && logoFile.size > 0) {
				const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
				if (!allowed.includes(logoFile.type)) {
					return { success: false, error: 'Format logo tidak didukung. Gunakan PNG/JPG/WebP.' };
				}

				const ext = logoFile.type === 'image/png' ? 'png'
					: logoFile.type === 'image/webp' ? 'webp'
					: 'jpg';
				const uploadsDir = path.join('static', 'uploads');
				await mkdir(uploadsDir, { recursive: true });
				const filename = `logo-${id}-${Date.now()}.${ext}`;
				const filePath = path.join(uploadsDir, filename);
				const buffer = Buffer.from(await logoFile.arrayBuffer());
				await writeFile(filePath, buffer);
				logoUrl = `/uploads/${filename}`;
			}

			await db.update(schema.pengaturanPesantren)
				.set({ namaPesantren, logoUrl, alamat, noTelp })
				.where(eq(schema.pengaturanPesantren.id, id));

			return { success: true, message: 'Profil Pesantren berhasil diperbarui! Refresh halaman untuk melihat efek di Sidebar.' };
		} catch (e) {
			return { success: false, error: 'Terjadi kesalahan saat menyimpan pengaturan.' };
		}
	}
};
