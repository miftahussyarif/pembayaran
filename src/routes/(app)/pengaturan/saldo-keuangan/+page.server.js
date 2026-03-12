import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, sum, desc, isNotNull, inArray } from 'drizzle-orm';

export const load = async ({ locals }) => {
	if (locals.user?.role !== 'admin' && locals.user?.role !== 'bendahara') {
		throw redirect(303, '/');
	}

	const penerimaIdsRaw = await db
		.select({ id: schema.pembayaran.inputById })
		.from(schema.pembayaran)
		.where(isNotNull(schema.pembayaran.inputById))
		.groupBy(schema.pembayaran.inputById);
	const penerimaIds = penerimaIdsRaw.map((r) => r.id).filter(Boolean);

	const bendaharaList = penerimaIds.length
		? await db
			.select({
				id: schema.users.id,
				namaLengkap: schema.users.namaLengkap,
				username: schema.users.username,
				role: schema.users.role
			})
			.from(schema.users)
			.where(inArray(schema.users.id, penerimaIds))
		: [];

	const pemasukanPerBendahara = await db
		.select({
			bendaharaId: schema.pembayaran.inputById,
			totalMasuk: sum(schema.pembayaran.nominalDibayar)
		})
		.from(schema.pembayaran)
		.where(isNotNull(schema.pembayaran.inputById))
		.groupBy(schema.pembayaran.inputById);

	const mutasiPerBendahara = await db
		.select({
			bendaharaId: schema.mutasiSaldoBendahara.bendaharaId,
			totalMutasi: sum(schema.mutasiSaldoBendahara.nominal)
		})
		.from(schema.mutasiSaldoBendahara)
		.groupBy(schema.mutasiSaldoBendahara.bendaharaId);

	const pemasukanMap = new Map(
		pemasukanPerBendahara.map((r) => [r.bendaharaId, Number(r.totalMasuk || 0)])
	);
	const mutasiMap = new Map(
		mutasiPerBendahara.map((r) => [r.bendaharaId, Number(r.totalMutasi || 0)])
	);

	const rekap = bendaharaList.map((b) => {
		const totalMasuk = pemasukanMap.get(b.id) || 0;
		const totalMutasi = mutasiMap.get(b.id) || 0;
		return {
			...b,
			totalMasuk,
			totalMutasi,
			saldo: totalMasuk - totalMutasi
		};
	});

	const mutasiList = await db
		.select({
			id: schema.mutasiSaldoBendahara.id,
			bendaharaId: schema.mutasiSaldoBendahara.bendaharaId,
			nominal: schema.mutasiSaldoBendahara.nominal,
			catatan: schema.mutasiSaldoBendahara.catatan,
			tanggal: schema.mutasiSaldoBendahara.tanggal,
			inputById: schema.mutasiSaldoBendahara.inputById,
			bendaharaNama: schema.users.namaLengkap
		})
		.from(schema.mutasiSaldoBendahara)
		.leftJoin(schema.users, eq(schema.mutasiSaldoBendahara.bendaharaId, schema.users.id))
		.orderBy(desc(schema.mutasiSaldoBendahara.id))
		.limit(50);

	return { rekap, bendaharaList, mutasiList };
};

export const actions = {
	createMutasi: async ({ request, locals, getClientAddress }) => {
		if (locals.user?.role !== 'admin') {
			throw redirect(303, '/');
		}

		const data = await request.formData();
		const bendaharaId = Number(data.get('bendaharaId'));
		const nominal = Number(data.get('nominal'));
		const catatan = data.get('catatan')?.toString().trim() || '';

		if (!bendaharaId || nominal <= 0) {
			return { type: 'error', message: 'Data mutasi tidak lengkap atau nominal harus > 0.' };
		}
		
		const [bendaharaRow] = await db
			.select({ id: schema.users.id })
			.from(schema.users)
			.where(eq(schema.users.id, bendaharaId));

		if (!bendaharaRow) {
			return { type: 'error', message: 'Penerima tidak ditemukan.' };
		}

		try {
			await db.insert(schema.mutasiSaldoBendahara).values({
				bendaharaId,
				nominal,
				catatan,
				tanggal: new Date().toISOString(),
				inputById: locals.user?.id || null
			});
			try {
				await db.insert(schema.systemLogs).values({
					userId: locals.user?.id || null,
					username: locals.user?.username || null,
					role: locals.user?.role || null,
					aksi: 'mutasi',
					modul: 'saldo-keuangan',
					keterangan: `Mutasi ${nominal} untuk penerima ${bendaharaId}${catatan ? ` (${catatan})` : ''}`,
					ip: getClientAddress(),
					createdAt: new Date().toISOString()
				});
			} catch (e) {
				// ignore logging errors
			}
			return { type: 'success', message: 'Mutasi saldo berhasil disimpan.' };
		} catch (e) {
			return { type: 'error', message: 'Gagal menyimpan mutasi saldo.' };
		}
	}
};
