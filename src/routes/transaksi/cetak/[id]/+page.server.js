import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

function getEffectiveNominal({ santriRow, jenisRow, customNominalRow }) {
	const hasCustomNominal = customNominalRow !== undefined;
	const customNominal = customNominalRow?.nominal;

	if (hasCustomNominal && customNominal !== null) {
		return Number(customNominal || 0);
	}

	const isKonsumsi = !!jenisRow?.namaPembayaran && /konsumsi/i.test(jenisRow.namaPembayaran);
	if (isKonsumsi && santriRow?.nominalKonsumsi !== undefined) {
		return Number(santriRow.nominalKonsumsi || 0);
	}

	return Number(jenisRow?.nominalDefault || 0);
}

async function getImportedTagihanTotal({ santriId, tahunAjaranId, jenisPembayaranId, bulan = null, tahunTagihan = null, keteranganKhusus = null }) {
	if (!santriId) return 0;

	const rows = await db
		.select({
			nominalTagihan: schema.tunggakanImport.nominalTagihan,
			bulan: schema.tunggakanImport.bulan,
			tahunTagihan: schema.tunggakanImport.tahunTagihan,
			keteranganKhusus: schema.tunggakanImport.keteranganKhusus
		})
		.from(schema.tunggakanImport)
		.where(and(
			eq(schema.tunggakanImport.santriId, santriId),
			eq(schema.tunggakanImport.tahunAjaranId, tahunAjaranId),
			eq(schema.tunggakanImport.jenisPembayaranId, jenisPembayaranId)
		));

	return rows
		.filter((item) =>
			String(item.bulan || '') === String(bulan || '') &&
			String(item.tahunTagihan || '') === String(tahunTagihan || '') &&
			normalizeText(item.keteranganKhusus) === normalizeText(keteranganKhusus)
		)
		.reduce((sum, item) => sum + Number(item.nominalTagihan || 0), 0);
}

async function getDefaultTagihanForItem(item, santri) {
	const [jenisRow] = await db
		.select()
		.from(schema.jenisPembayaran)
		.where(eq(schema.jenisPembayaran.id, item.jenisPembayaranId));

	if (!jenisRow) return 0;

	const kategoriTahunRows = item.santriId
		? await db.select().from(schema.santriKategoriTahun).where(eq(schema.santriKategoriTahun.santriId, item.santriId))
		: [];
	const kategoriIds = new Set(
		kategoriTahunRows
			.filter((row) => row.tahunAjaranId === item.tahunAjaranId)
			.map((row) => row.kategoriId)
	);
	if (kategoriIds.size === 0 && santri?.kategoriId) kategoriIds.add(santri.kategoriId);

	let customNominalRow;
	for (const kategoriId of kategoriIds) {
		const [row] = await db
			.select({ nominal: schema.kategoriGratis.nominal })
			.from(schema.kategoriGratis)
			.where(and(
				eq(schema.kategoriGratis.kategoriId, kategoriId),
				eq(schema.kategoriGratis.jenisPembayaranId, item.jenisPembayaranId)
			));
		if (row) {
			customNominalRow = row;
			break;
		}
	}

	return getEffectiveNominal({ santriRow: santri, jenisRow, customNominalRow });
}

export async function load({ params }) {
	const trxId = Number(params.id);
	
	const [pembayaranAwal] = await db.select().from(schema.pembayaran).where(eq(schema.pembayaran.id, trxId));
	if (!pembayaranAwal) throw error(404, 'Transaksi tidak ditemukan');

	// Query SEMUA pembayaran dengan santri, tahun ajaran, dan tanggal bayar yang SAMA
	// Ini untuk menggabungkan batch payments menjadi 1 kwitansi
	const pembayaranList = await db
		.select({
			id: schema.pembayaran.id,
			santriId: schema.pembayaran.santriId,
			pembayarLainId: schema.pembayaran.pembayarLainId,
			jenisPembayaranId: schema.pembayaran.jenisPembayaranId,
			tahunAjaranId: schema.pembayaran.tahunAjaranId,
			bulan: schema.pembayaran.bulan,
			tahunTagihan: schema.pembayaran.tahunTagihan,
			tanggalBayar: schema.pembayaran.tanggalBayar,
			nominalDibayar: schema.pembayaran.nominalDibayar,
			nomorKwitansi: schema.pembayaran.nomorKwitansi,
			inputById: schema.pembayaran.inputById,
			keteranganKhusus: schema.pembayaran.keteranganKhusus,
			namaPembayaran: schema.jenisPembayaran.namaPembayaran,
			tipe: schema.jenisPembayaran.tipe,
			nominalDefault: schema.jenisPembayaran.nominalDefault
		})
		.from(schema.pembayaran)
		.leftJoin(schema.jenisPembayaran, eq(schema.pembayaran.jenisPembayaranId, schema.jenisPembayaran.id))
		.where(and(
			eq(schema.pembayaran.tahunAjaranId, pembayaranAwal.tahunAjaranId),
			eq(schema.pembayaran.tanggalBayar, pembayaranAwal.tanggalBayar)
		));
	const pembayaranListFiltered = pembayaranList.filter((item) => {
		if (pembayaranAwal.santriId) {
			return item.santriId === pembayaranAwal.santriId;
		}
		return item.pembayarLainId === pembayaranAwal.pembayarLainId;
	});
	const pembayaran = pembayaranListFiltered[0];
	
	const [santri] = pembayaran.santriId
		? await db.select().from(schema.santri).where(eq(schema.santri.id, pembayaran.santriId))
		: [null];
	const [pembayarLain] = pembayaran.pembayarLainId
		? await db.select().from(schema.pembayarLain).where(eq(schema.pembayarLain.id, pembayaran.pembayarLainId))
		: [null];
	const [jenisPembayaran] = await db.select().from(schema.jenisPembayaran).where(eq(schema.jenisPembayaran.id, pembayaran.jenisPembayaranId));
	const [tahunAjaran] = await db.select().from(schema.tahunAjaran).where(eq(schema.tahunAjaran.id, pembayaran.tahunAjaranId));
	const currentReceiptIds = new Set(pembayaranListFiltered.map((item) => item.id));
	const pembayaranListWithDetail = [];

	for (const item of pembayaranListFiltered) {
		let keteranganDetail = '';
		const isTahunan = ['tahunan', 'smk_tahunan', 'smp_tahunan'].includes(item.tipe || '');

		if (isTahunan && item.santriId) {
			const importedTotal = await getImportedTagihanTotal({
				santriId: item.santriId,
				tahunAjaranId: item.tahunAjaranId,
				jenisPembayaranId: item.jenisPembayaranId
			});
			const defaultTagihan = await getDefaultTagihanForItem(item, santri);
			const totalTagihan = importedTotal > 0 ? importedTotal : defaultTagihan;

			const existingPayments = await db
				.select({
					id: schema.pembayaran.id,
					nominalDibayar: schema.pembayaran.nominalDibayar,
					keteranganKhusus: schema.pembayaran.keteranganKhusus
				})
				.from(schema.pembayaran)
				.where(and(
					eq(schema.pembayaran.santriId, item.santriId),
					eq(schema.pembayaran.tahunAjaranId, item.tahunAjaranId),
					eq(schema.pembayaran.jenisPembayaranId, item.jenisPembayaranId)
				));

			const totalSebelumKwitansi = existingPayments
				.filter((payment) => !currentReceiptIds.has(payment.id) && !payment.keteranganKhusus)
				.reduce((sum, payment) => sum + Number(payment.nominalDibayar || 0), 0);
			const totalSetelahBayar = totalSebelumKwitansi + Number(item.nominalDibayar || 0);
			const tahunLabel = tahunAjaran?.nama || String(item.tahunAjaranId);

			if (totalTagihan > 0 && totalSebelumKwitansi > 0 && totalSetelahBayar >= totalTagihan) {
				keteranganDetail = `Melunasi pembayaran tahun ${tahunLabel}`;
			} else if (totalTagihan > 0 && totalSetelahBayar < totalTagihan) {
				keteranganDetail = `Mencicil pembayaran tahun ${tahunLabel}`;
			} else {
				keteranganDetail = `Pembayaran penuh tahun ${tahunLabel}`;
			}
		}

		pembayaranListWithDetail.push({
			...item,
			keteranganDetail
		});
	}
	
	let petugas = 'Admin';
	let petugasSignatureUrl = '';
	if (pembayaran.inputById) {
		const [userRow] = await db.select().from(schema.users).where(eq(schema.users.id, pembayaran.inputById));
		if (userRow) {
			petugas = userRow.namaLengkap;
			petugasSignatureUrl = userRow.signatureUrl || '';
		}
	}
	
	return {
		pembayaran,
		pembayaranList: pembayaranListWithDetail,
		totalNominal: pembayaranListFiltered.reduce((sum, item) => sum + Number(item.nominalDibayar || 0), 0),
		santri,
		pembayarLain,
		jenisPembayaran,
		tahunAjaran,
		petugas,
		petugasSignatureUrl
	};
}
