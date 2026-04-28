import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

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
	const santris = await db
		.select({
			id: schema.santri.id,
			nomorInduk: schema.santri.nomorInduk,
			namaLengkap: schema.santri.namaLengkap,
			kategoriId: schema.santri.kategoriId,
			namaKategori: schema.kategoriSantri.namaKategori,
			isActive: schema.santri.isActive
		})
		.from(schema.santri)
		.leftJoin(schema.kategoriSantri, eq(schema.santri.kategoriId, schema.kategoriSantri.id))
		.where(eq(schema.santri.isActive, true));

	const tahunAjarans = await db.select().from(schema.tahunAjaran);
	const [tahunAjaranAktif] = tahunAjarans.filter((item) => item.isActive);
	const jenisKhusus = await ensureJenisKhusus();

	const tagihanKhususRows = await db
		.select({
			id: schema.tunggakanImport.id,
			santriId: schema.tunggakanImport.santriId,
			tahunAjaranId: schema.tunggakanImport.tahunAjaranId,
			nominalTagihan: schema.tunggakanImport.nominalTagihan,
			keteranganKhusus: schema.tunggakanImport.keteranganKhusus,
			catatan: schema.tunggakanImport.catatan,
			updatedAt: schema.tunggakanImport.updatedAt,
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
		santris,
		tahunAjarans,
		tahunAjaranAktif: tahunAjaranAktif || null,
		jenisKhususId: jenisKhusus?.id || null,
		tagihanKhusus
	};
}

export const actions = {
	create: async ({ request, locals, getClientAddress }) => {
		try {
			const formData = await request.formData();
			const santriId = Number(formData.get('santriId'));
			const tahunAjaranId = Number(formData.get('tahunAjaranId'));
			const namaTagihan = String(formData.get('namaTagihan') || '').trim();
			const nominalTagihan = Number(formData.get('nominalTagihan'));
			const catatan = String(formData.get('catatan') || '').trim() || null;

			if (!santriId || !tahunAjaranId || !namaTagihan) {
				return { success: false, message: 'Santri, tahun ajaran, dan nama tagihan wajib diisi.' };
			}

			if (!Number.isFinite(nominalTagihan) || nominalTagihan <= 0) {
				return { success: false, message: 'Nominal tagihan harus lebih dari 0.' };
			}

			const [santri] = await db.select().from(schema.santri).where(eq(schema.santri.id, santriId));
			if (!santri) {
				return { success: false, message: 'Santri tidak ditemukan.' };
			}

			const [tahunAjaran] = await db.select().from(schema.tahunAjaran).where(eq(schema.tahunAjaran.id, tahunAjaranId));
			if (!tahunAjaran) {
				return { success: false, message: 'Tahun ajaran tidak ditemukan.' };
			}

			const jenisKhusus = await ensureJenisKhusus();
			if (!jenisKhusus?.id) {
				return { success: false, message: 'Jenis pembayaran khusus belum tersedia.' };
			}

			const now = new Date().toISOString();
			const signatureKey = `manual-khusus-${santriId}-${tahunAjaranId}-${Date.now()}`;

			await db.insert(schema.tunggakanImport).values({
				santriId,
				pembayarLainId: null,
				tahunAjaranId,
				jenisPembayaranId: jenisKhusus.id,
				bulan: null,
				tahunTagihan: null,
				nominalAsalTagihan: nominalTagihan,
				nominalTagihan,
				keteranganKhusus: namaTagihan,
				catatan,
				signatureKey,
				createdAt: now,
				updatedAt: now
			});

			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'input',
					modul: 'tagihan_khusus',
					keterangan: `Tambah tagihan khusus "${namaTagihan}" untuk santri ${santri.namaLengkap} (${tahunAjaran.nama}) sebesar Rp ${nominalTagihan.toLocaleString('id-ID')}`,
					ip: getClientAddress(),
					createdAt: now
				});
			} catch (error) {
				console.error('⚠️ Logging error (ignored):', error);
			}

			return { success: true, message: 'Tagihan khusus berhasil ditambahkan.' };
		} catch (error) {
			console.error('❌ Error create tagihan khusus:', error);
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Gagal menambahkan tagihan khusus.'
			};
		}
	},

	delete: async ({ request, locals, getClientAddress }) => {
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
	}
};
