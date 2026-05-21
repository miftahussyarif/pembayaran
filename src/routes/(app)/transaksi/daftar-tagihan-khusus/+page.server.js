import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { dbWrite } from '$lib/server/db/writeQueue.js';

function normalizeText(value) {
	return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function ensureJenisKhusus() {
	const jenisPembayarans = await db.select().from(schema.jenisPembayaran);
	let jenisKhusus = jenisPembayarans.find(
		(item) => item.tipe === 'sekali' && item.namaPembayaran === 'Pembayaran Lain-lain'
	);

	if (jenisKhusus) return jenisKhusus;

	try {
		const [created] = await db.insert(schema.jenisPembayaran).values({
			namaPembayaran: 'Pembayaran Lain-lain',
			tipe: 'sekali',
			nominalDefault: 0
		}).returning();
		return created;
	} catch {
		const refreshed = await db.select().from(schema.jenisPembayaran);
		return refreshed.find((item) => item.namaPembayaran === 'Pembayaran Lain-lain') || null;
	}
}

export async function load() {
	const jenisKhusus = await ensureJenisKhusus();
	const tahunAjarans = await db.select().from(schema.tahunAjaran);

	const tagihanKhususRows = await db
		.select({
			id: schema.tunggakanImport.id,
			santriId: schema.tunggakanImport.santriId,
			tahunAjaranId: schema.tunggakanImport.tahunAjaranId,
			nominalTagihan: schema.tunggakanImport.nominalTagihan,
			keteranganKhusus: schema.tunggakanImport.keteranganKhusus,
			catatan: schema.tunggakanImport.catatan,
			updatedAt: schema.tunggakanImport.updatedAt,
			createdAt: schema.tunggakanImport.createdAt,
			namaSantri: schema.santri.namaLengkap,
			nomorInduk: schema.santri.nomorInduk,
			namaKategori: schema.kategoriSantri.namaKategori,
			namaTahunAjaran: schema.tahunAjaran.nama
		})
		.from(schema.tunggakanImport)
		.leftJoin(schema.santri, eq(schema.tunggakanImport.santriId, schema.santri.id))
		.leftJoin(schema.kategoriSantri, eq(schema.santri.kategoriId, schema.kategoriSantri.id))
		.innerJoin(schema.tahunAjaran, eq(schema.tunggakanImport.tahunAjaranId, schema.tahunAjaran.id))
		.where(and(
			eq(schema.tunggakanImport.jenisPembayaranId, jenisKhusus?.id || 0)
		))
		.orderBy(desc(schema.tunggakanImport.updatedAt), desc(schema.tunggakanImport.id));

	const pembayaranKhusus = await db
		.select({
			santriId: schema.pembayaran.santriId,
			tahunAjaranId: schema.pembayaran.tahunAjaranId,
			nominalDibayar: schema.pembayaran.nominalDibayar,
			keteranganKhusus: schema.pembayaran.keteranganKhusus
		})
		.from(schema.pembayaran)
		.where(eq(schema.pembayaran.jenisPembayaranId, jenisKhusus?.id || 0));

	const tagihanKhusus = tagihanKhususRows.map((item) => {
		const totalDibayar = pembayaranKhusus
			.filter((payment) =>
				payment.santriId === item.santriId &&
				payment.tahunAjaranId === item.tahunAjaranId &&
				normalizeText(payment.keteranganKhusus) === normalizeText(item.keteranganKhusus)
			)
			.reduce((sum, payment) => sum + Number(payment.nominalDibayar || 0), 0);

		return {
			...item,
			totalDibayar,
			sisa: Math.max(0, Number(item.nominalTagihan || 0) - totalDibayar)
		};
	});

	return {
		tagihanKhusus,
		tahunAjarans,
		jenisKhususId: jenisKhusus?.id || null
	};
}

export const actions = {
	delete: async ({ request, locals, getClientAddress }) => {
		return dbWrite(async () => {
		try {
			if (locals.user?.role !== 'admin') {
				return { success: false, message: 'Hanya admin yang dapat menghapus tagihan khusus.' };
			}

			const formData = await request.formData();
			const tagihanId = Number(formData.get('tagihanId'));

			if (!tagihanId) {
				return { success: false, message: 'ID tagihan tidak valid.' };
			}

			const [tagihan] = await db
				.select({
					id: schema.tunggakanImport.id,
					keteranganKhusus: schema.tunggakanImport.keteranganKhusus,
					nominalTagihan: schema.tunggakanImport.nominalTagihan,
					santriId: schema.tunggakanImport.santriId,
					namaSantri: schema.santri.namaLengkap,
					nomorInduk: schema.santri.nomorInduk
				})
				.from(schema.tunggakanImport)
				.leftJoin(schema.santri, eq(schema.tunggakanImport.santriId, schema.santri.id))
				.where(eq(schema.tunggakanImport.id, tagihanId));

			if (!tagihan) {
				return { success: false, message: 'Tagihan khusus tidak ditemukan.' };
			}

			await db.delete(schema.tunggakanImport).where(eq(schema.tunggakanImport.id, tagihanId));

			const now = new Date().toISOString();
			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'hapus',
					modul: 'tagihan_khusus',
					keterangan: `Hapus tagihan khusus "${tagihan.keteranganKhusus}" untuk santri ${tagihan.namaSantri} (${tagihan.nomorInduk}) sebesar Rp ${Number(tagihan.nominalTagihan).toLocaleString('id-ID')}`,
					ip: getClientAddress(),
					createdAt: now
				});
			} catch (error) {
				console.error('⚠️ Logging error (ignored):', error);
			}

			return { success: true, message: 'Tagihan khusus berhasil dihapus.' };
		} catch (error) {
			console.error('❌ Error delete tagihan khusus:', error);
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Gagal menghapus tagihan khusus.'
			};
		}
		}); // end dbWrite
	},

	update: async ({ request, locals, getClientAddress }) => {
		return dbWrite(async () => {
		try {
			if (locals.user?.role !== 'admin') {
				return { success: false, message: 'Hanya admin yang dapat mengedit tagihan khusus.' };
			}

			const formData = await request.formData();
			const tagihanId = Number(formData.get('tagihanId'));
			const keteranganKhusus = String(formData.get('keteranganKhusus') || '').trim();
			const catatan = String(formData.get('catatan') || '').trim() || null;
			const nominalTagihan = Number(formData.get('nominalTagihan'));

			if (!tagihanId) {
				return { success: false, message: 'ID tagihan tidak valid.' };
			}
			if (!keteranganKhusus) {
				return { success: false, message: 'Nama tagihan tidak boleh kosong.' };
			}
			if (!Number.isFinite(nominalTagihan) || nominalTagihan <= 0) {
				return { success: false, message: 'Nominal tagihan harus lebih dari 0.' };
			}

			const now = new Date().toISOString();
			await db
				.update(schema.tunggakanImport)
				.set({ keteranganKhusus, catatan, nominalTagihan, updatedAt: now })
				.where(eq(schema.tunggakanImport.id, tagihanId));

			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'edit',
					modul: 'tagihan_khusus',
					keterangan: `Edit tagihan khusus id=${tagihanId}: "${keteranganKhusus}", nominal Rp ${nominalTagihan.toLocaleString('id-ID')}`,
					ip: getClientAddress(),
					createdAt: now
				});
			} catch (error) {
				console.error('⚠️ Logging error (ignored):', error);
			}

			return { success: true, message: 'Tagihan khusus berhasil diperbarui.' };
		} catch (error) {
			console.error('❌ Error update tagihan khusus:', error);
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Gagal memperbarui tagihan khusus.'
			};
		}
		}); // end dbWrite
	}
};
