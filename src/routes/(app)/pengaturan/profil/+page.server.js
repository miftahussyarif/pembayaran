import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { upload } from '$lib/server/storage.js';

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
		const stampFile = data.get('stampFile');

		try {
			const [current] = await db
				.select()
				.from(schema.pengaturanPesantren)
				.where(eq(schema.pengaturanPesantren.id, id));

			let logoUrl = current?.logoUrl || '';
			let stampUrl = current?.stampUrl || '';

			if (logoFile && typeof logoFile === 'object' && 'arrayBuffer' in logoFile && logoFile.size > 0) {
				const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
				if (!allowed.includes(logoFile.type)) {
					return { success: false, error: 'Format logo tidak didukung. Gunakan PNG/JPG/WebP.' };
				}

				const ext = logoFile.type === 'image/png' ? 'png'
					: logoFile.type === 'image/webp' ? 'webp'
					: 'jpg';
				const filename = `logo-${id}-${Date.now()}.${ext}`;
				const buffer = Buffer.from(await logoFile.arrayBuffer());
				logoUrl = await upload(buffer, filename, 'profil');
			}

			if (stampFile && typeof stampFile === 'object' && 'arrayBuffer' in stampFile && stampFile.size > 0) {
				const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
				if (!allowed.includes(stampFile.type)) {
					return { success: false, error: 'Format stempel tidak didukung. Gunakan PNG/JPG/WebP.' };
				}

				const ext = stampFile.type === 'image/png' ? 'png'
					: stampFile.type === 'image/webp' ? 'webp'
					: 'jpg';
				const filename = `stamp-${id}-${Date.now()}.${ext}`;
				const buffer = Buffer.from(await stampFile.arrayBuffer());
				stampUrl = await upload(buffer, filename, 'profil');
			}

			await db.update(schema.pengaturanPesantren)
				.set({ namaPesantren, logoUrl, stampUrl, alamat, noTelp })
				.where(eq(schema.pengaturanPesantren.id, id));

			return { success: true, message: 'Profil Pesantren berhasil diperbarui! Refresh halaman untuk melihat efek di Sidebar.' };
		} catch (e) {
			return { success: false, error: 'Terjadi kesalahan saat menyimpan pengaturan.' };
		}
	}
};
