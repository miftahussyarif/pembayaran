import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { desc, eq, inArray, isNotNull } from 'drizzle-orm';

const BULAN_LIST = [
	'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
	'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const formatStatus = (nominalDibayar, nominalTermutasi) => {
	if (nominalTermutasi <= 0) {
		return 'Saldo masih di bawa petugas';
	}
	if (nominalTermutasi >= nominalDibayar) {
		return 'Sudah termutasi';
	}
	return 'Sebagian termutasi';
};

const cocokStatus = (statusFilter, payment) => {
	if (statusFilter === 'belum') return payment.sisaDiPetugas > 0;
	if (statusFilter === 'sudah') return payment.sisaDiPetugas <= 0;
	return true;
};

const sortByWaktu = (a, b) => {
	const aTime = new Date(a.waktu).getTime();
	const bTime = new Date(b.waktu).getTime();
	if (aTime !== bTime) return aTime - bTime;
	if (a.tipe !== b.tipe) return a.tipe === 'pembayaran' ? -1 : 1;
	return a.id - b.id;
};

export const load = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const petugasParam = url.searchParams.get('petugas') || '';
	const bulanParam = url.searchParams.get('bulan') || 'all';
	const tahunParam = url.searchParams.get('tahun') || 'all';
	const statusParam = url.searchParams.get('status') || 'all';

	const petugasIdsRaw = await db
		.select({ id: schema.pembayaran.inputById })
		.from(schema.pembayaran)
		.where(isNotNull(schema.pembayaran.inputById))
		.groupBy(schema.pembayaran.inputById);

	const petugasIds = petugasIdsRaw.map((row) => row.id).filter(Boolean);
	const allPetugas = petugasIds.length
		? await db
			.select({
				id: schema.users.id,
				namaLengkap: schema.users.namaLengkap,
				username: schema.users.username,
				role: schema.users.role
			})
			.from(schema.users)
			.where(inArray(schema.users.id, petugasIds))
		: [];

	const petugasTerpilihId = locals.user.role === 'petugas'
		? locals.user.id
		: (petugasParam ? Number(petugasParam) : null);

	const pembayaranRows = await db
		.select({
			id: schema.pembayaran.id,
			inputById: schema.pembayaran.inputById,
			tanggalBayar: schema.pembayaran.tanggalBayar,
			nomorKwitansi: schema.pembayaran.nomorKwitansi,
			nominalDibayar: schema.pembayaran.nominalDibayar,
			bulan: schema.pembayaran.bulan,
			keteranganKhusus: schema.pembayaran.keteranganKhusus,
			namaSantri: schema.santri.namaLengkap,
			nomorInduk: schema.santri.nomorInduk,
			namaPembayarLain: schema.pembayarLain.namaPembayar,
			namaPembayaran: schema.jenisPembayaran.namaPembayaran
		})
		.from(schema.pembayaran)
		.leftJoin(schema.santri, eq(schema.pembayaran.santriId, schema.santri.id))
		.leftJoin(schema.pembayarLain, eq(schema.pembayaran.pembayarLainId, schema.pembayarLain.id))
		.leftJoin(schema.jenisPembayaran, eq(schema.pembayaran.jenisPembayaranId, schema.jenisPembayaran.id))
		.where(
			petugasTerpilihId
				? eq(schema.pembayaran.inputById, petugasTerpilihId)
				: isNotNull(schema.pembayaran.inputById)
		)
		.orderBy(desc(schema.pembayaran.tanggalBayar), desc(schema.pembayaran.id));

	const mutasiRows = await db
		.select({
			id: schema.mutasiSaldoBendahara.id,
			bendaharaId: schema.mutasiSaldoBendahara.bendaharaId,
			nominal: schema.mutasiSaldoBendahara.nominal,
			catatan: schema.mutasiSaldoBendahara.catatan,
			tanggal: schema.mutasiSaldoBendahara.tanggal
		})
		.from(schema.mutasiSaldoBendahara)
		.where(
			petugasTerpilihId
				? eq(schema.mutasiSaldoBendahara.bendaharaId, petugasTerpilihId)
				: isNotNull(schema.mutasiSaldoBendahara.bendaharaId)
		)
		.orderBy(desc(schema.mutasiSaldoBendahara.tanggal), desc(schema.mutasiSaldoBendahara.id));

	const tahunList = Array.from(
		new Set(
			pembayaranRows
				.map((row) => row.tanggalBayar ? String(new Date(row.tanggalBayar).getFullYear()) : null)
				.filter(Boolean)
		)
	).sort((a, b) => Number(b) - Number(a));

	const pembayaranByPetugas = new Map();
	for (const row of pembayaranRows) {
		if (!row.inputById) continue;
		const current = pembayaranByPetugas.get(row.inputById) || [];
		current.push({
			...row,
			namaPembayar: row.namaSantri || row.namaPembayarLain || '-',
			nominalTermutasi: 0,
			sisaDiPetugas: Number(row.nominalDibayar || 0)
		});
		pembayaranByPetugas.set(row.inputById, current);
	}

	const mutasiByPetugas = new Map();
	for (const row of mutasiRows) {
		const current = mutasiByPetugas.get(row.bendaharaId) || [];
		current.push(row);
		mutasiByPetugas.set(row.bendaharaId, current);
	}

	const filteredPetugas = allPetugas.filter((petugas) => {
		if (locals.user.role === 'petugas') return petugas.id === locals.user.id;
		if (!petugasTerpilihId) return true;
		return petugas.id === petugasTerpilihId;
	});

	const rekapPetugas = filteredPetugas.map((petugas) => {
		const pembayaranPetugas = (pembayaranByPetugas.get(petugas.id) || []).map((item) => ({ ...item }));
		const mutasiPetugas = (mutasiByPetugas.get(petugas.id) || []).map((item) => ({ ...item }));

		const paymentMap = new Map(pembayaranPetugas.map((item) => [item.id, item]));
		const queue = [];
		const events = [
			...pembayaranPetugas.map((item) => ({
				tipe: 'pembayaran',
				id: item.id,
				waktu: item.tanggalBayar,
				refId: item.id
			})),
			...mutasiPetugas.map((item) => ({
				tipe: 'mutasi',
				id: item.id,
				waktu: item.tanggal,
				refId: item.id,
				nominal: Number(item.nominal || 0)
			}))
		].sort(sortByWaktu);

		for (const event of events) {
			if (event.tipe === 'pembayaran') {
				const payment = paymentMap.get(event.refId);
				if (payment) queue.push(payment);
				continue;
			}

			let nominalMutasi = Number(event.nominal || 0);
			for (const payment of queue) {
				if (nominalMutasi <= 0) break;
				if (payment.sisaDiPetugas <= 0) continue;
				const allocated = Math.min(payment.sisaDiPetugas, nominalMutasi);
				payment.nominalTermutasi += allocated;
				payment.sisaDiPetugas -= allocated;
				nominalMutasi -= allocated;
			}
		}

		const pembayaranTampil = pembayaranPetugas
			.sort((a, b) => {
				const dateDiff = new Date(b.tanggalBayar).getTime() - new Date(a.tanggalBayar).getTime();
				if (dateDiff !== 0) return dateDiff;
				return b.id - a.id;
			})
			.map((item) => ({
				...item,
				statusMutasi: formatStatus(Number(item.nominalDibayar || 0), Number(item.nominalTermutasi || 0)),
				tahunTransaksi: item.tanggalBayar ? String(new Date(item.tanggalBayar).getFullYear()) : '',
				bulanTransaksi: item.tanggalBayar ? BULAN_LIST[new Date(item.tanggalBayar).getMonth()] : ''
			}))
			.filter((item) => {
				const cocokBulan = bulanParam === 'all' ? true : item.bulanTransaksi === bulanParam;
				const cocokTahun = tahunParam === 'all' ? true : item.tahunTransaksi === tahunParam;
				return cocokBulan && cocokTahun && cocokStatus(statusParam, item);
			});

		const totalMasuk = pembayaranTampil.reduce((sum, item) => sum + Number(item.nominalDibayar || 0), 0);
		const totalMutasi = pembayaranTampil.reduce((sum, item) => sum + Number(item.nominalTermutasi || 0), 0);
		const saldo = pembayaranTampil.reduce((sum, item) => sum + Number(item.sisaDiPetugas || 0), 0);

		return {
			...petugas,
			totalMasuk,
			totalMutasi,
			saldo,
			jumlahTransaksi: pembayaranTampil.length,
			pembayaran: pembayaranTampil
		};
	}).filter((petugas) => petugas.pembayaran.length > 0 || !petugasTerpilihId);

	return {
		bulanList: BULAN_LIST,
		filterPetugasId: petugasTerpilihId ? String(petugasTerpilihId) : '',
		filterBulan: bulanParam,
		filterStatus: statusParam,
		filterTahun: tahunParam,
		isPetugas: locals.user.role === 'petugas',
		petugasList: allPetugas,
		rekapPetugas,
		tahunList
	};
};
