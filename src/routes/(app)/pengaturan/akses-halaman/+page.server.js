import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

const ROUTES = [
	{ id: '/master/tahun-ajaran', name: 'Master Tahun Ajaran', group: 'Data Master' },
	{ id: '/master/kategori-santri', name: 'Master Kategori Santri', group: 'Data Master' },
	{ id: '/master/jenis-pembayaran', name: 'Master Jenis Pembayaran', group: 'Data Master' },
	{ id: '/master/santri', name: 'Data Santri', group: 'Data Master' },
	{ id: '/master/keaktifan-santri', name: 'Keaktifan Santri', group: 'Data Master' },
	{ id: '/master/data-siswa-smk', name: 'Data Siswa SMK', group: 'Data Master' },
	{ id: '/master/data-siswa-smp', name: 'Data Siswa SMP', group: 'Data Master' },
	{ id: '/transaksi/input', name: 'Input Pembayaran', group: 'Transaksi' },
	{ id: '/transaksi/rekap-individu', name: 'Rekap Individu Santri', group: 'Transaksi' },
	{ id: '/transaksi/riwayat', name: 'Riwayat Pembayaran', group: 'Transaksi' },
	{ id: '/transaksi/tambah-tagihan-khusus', name: 'Input Tagihan Khusus', group: 'Transaksi' },
	{ id: '/transaksi/daftar-tagihan-khusus', name: 'Daftar Tagihan Khusus', group: 'Transaksi' },
	{ id: '/transaksi/rekapitulasi', name: 'Rekapitulasi Pembayaran', group: 'Transaksi' },
	{ id: '/transaksi/rekap-petugas', name: 'Rekap Individu Petugas', group: 'Transaksi' },
	{ id: '/transaksi/saldo-keuangan', name: 'Saldo Keuangan Masuk', group: 'Transaksi' }
];

const ROLES = ['bendahara', 'petugas'];

// Default allowed rules
const DEFAULT_RULES = {
	bendahara: [
		'/master/tahun-ajaran', '/master/kategori-santri', '/master/jenis-pembayaran', 
		'/master/santri', '/master/keaktifan-santri', '/master/data-siswa-smk', '/master/data-siswa-smp',
		'/transaksi/input', '/transaksi/tambah-tagihan-khusus', '/transaksi/daftar-tagihan-khusus',
		'/transaksi/riwayat', '/transaksi/rekapitulasi', 
		'/transaksi/rekap-individu', '/transaksi/rekap-petugas', '/transaksi/saldo-keuangan'
	],
	petugas: [
		'/master/santri', '/master/keaktifan-santri', '/master/data-siswa-smk', '/master/data-siswa-smp',
		'/transaksi/input', '/transaksi/riwayat', '/transaksi/rekapitulasi', '/transaksi/rekap-individu', '/transaksi/rekap-petugas'
	]
};

export const load = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw redirect(303, '/');

	const roleAccessRows = await db.select().from(schema.roleAccess);

	// Transform ke bentuk map untuk mempermudah frontend
	// rules[role][routeId] = boolean (isAllowed)
	let rules = {};
	
	for (const role of ROLES) {
		rules[role] = {};
		for (const route of ROUTES) {
			const dbRule = roleAccessRows.find(r => r.role === role && r.routeId === route.id);
			if (dbRule) {
				rules[role][route.id] = dbRule.isAllowed;
			} else {
				// Fallback default
				rules[role][route.id] = DEFAULT_RULES[role].includes(route.id);
			}
		}
	}

	return {
		routes: ROUTES,
		roles: ROLES,
		rules
	};
};

export const actions = {
	save: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') throw redirect(303, '/');

		const data = await request.formData();
		
		for (const role of ROLES) {
			for (const route of ROUTES) {
				const key = `access_${role}_${route.id}`;
				const isAllowed = data.get(key) === 'true';

				const existing = await db
					.select()
					.from(schema.roleAccess)
					.where(and(
						eq(schema.roleAccess.role, role),
						eq(schema.roleAccess.routeId, route.id)
					))
					.limit(1);

				if (existing.length > 0) {
					await db
						.update(schema.roleAccess)
						.set({ 
							isAllowed, 
							updatedAt: new Date().toISOString() 
						})
						.where(eq(schema.roleAccess.id, existing[0].id));
				} else {
					await db
						.insert(schema.roleAccess)
						.values({
							role,
							routeId: route.id,
							isAllowed,
							updatedAt: new Date().toISOString()
						});
				}
			}
		}

		await db.insert(schema.systemLogs).values({
			userId: locals.user.id,
			username: locals.user.username,
			role: locals.user.role,
			aksi: 'UPDATE',
			modul: 'Pengaturan Halaman',
			keterangan: 'Memperbarui akses halaman untuk role',
			ip: '',
			createdAt: new Date().toISOString()
		});

		return { success: true };
	}
};
