import { db } from './src/lib/server/db/index.js';
import * as schema from './src/lib/server/db/schema.js';

async function seed() {
	console.log('🌱 Seeding database...');

	// Clear existing (optional, usually seed is run once)
	try {
		await db.delete(schema.pembayaran);
		await db.delete(schema.santri);
		await db.delete(schema.kategoriSantri);
		await db.delete(schema.jenisPembayaran);
		await db.delete(schema.tahunAjaran);
		await db.delete(schema.users);
		await db.delete(schema.pengaturanPesantren);
	} catch (e) {
		console.log('Tables empty or not exist yet');
	}

	// 1. Seed Tahun Ajaran
	await db.insert(schema.tahunAjaran).values([
		{ id: 14, nama: '2026', isActive: true },
		{ id: 15, nama: '2025', isActive: false },
		{ id: 16, nama: '2024', isActive: false },
		{ id: 18, nama: '2023', isActive: false },
		{ id: 19, nama: '2022', isActive: false },
		{ id: 20, nama: '2021', isActive: false },
		{ id: 21, nama: '2020', isActive: false },
		{ id: 22, nama: '2019', isActive: false },
		{ id: 23, nama: '2018', isActive: false },
		{ id: 24, nama: '2017', isActive: false }
	]).returning();

	// 2. Seed Jenis Pembayaran
	await db.insert(schema.jenisPembayaran).values([
		{ id: 16, namaPembayaran: 'Syahriyah (SPP)', tipe: 'bulanan', nominalDefault: 150000 },
		{ id: 20, namaPembayaran: 'Pembayaran Pendaftaran', tipe: 'sekali', nominalDefault: 100000 },
		{ id: 22, namaPembayaran: 'Infaq Pembangunan', tipe: 'tahunan', nominalDefault: 1000000 },
		{ id: 23, namaPembayaran: 'Iuran Khataman 2030', tipe: 'sekali', nominalDefault: 750000 }
	]).returning();

	// 2.5. Seed Kategori Santri
	await db.insert(schema.kategoriSantri).values([
		{ id: 1, namaKategori: 'Reguler', nominalSyahriyah: 100000 },
		{ id: 2, namaKategori: 'Kakak Beradik', nominalSyahriyah: 75000 },
		{ id: 3, namaKategori: 'Yatim', nominalSyahriyah: 0 },
		{ id: 4, namaKategori: 'Dhuafa', nominalSyahriyah: 50000 }
	]).returning();

	// 3. Seed Santri
	await db.insert(schema.santri).values([
		{ id: 16, nomorInduk: '24001', namaLengkap: 'Ahmad Faisal', tanggalMasuk: '2023-07-15', kategoriId: 1, isActive: true },
		{ id: 17, nomorInduk: '24002', namaLengkap: 'Budi Santoso', tanggalMasuk: '2023-07-15', kategoriId: 2, isActive: true },
		{ id: 18, nomorInduk: '24003', namaLengkap: 'Siti Aminah', tanggalMasuk: '2024-07-10', kategoriId: 3, isActive: true }
	]).returning();

	// 4. Seed Pembayaran (Contoh: Ahmad bayar SPP Juli 2024)
	await db.insert(schema.pembayaran).values([
		{
			id: 15,
			santriId: 16,
			jenisPembayaranId: 16,
			tahunAjaranId: 14,
			bulan: 'Januari',
			tanggalBayar: '2026-03-11T18:32:43.814Z',
			nominalDibayar: 150000,
			nomorKwitansi: 'KW-1773253963814'
		},
		{
			id: 16,
			santriId: 17,
			jenisPembayaranId: 16,
			tahunAjaranId: 14,
			bulan: 'Januari',
			tanggalBayar: '2026-03-11T18:35:19.004Z',
			nominalDibayar: 150000,
			nomorKwitansi: 'KW-1773254119004'
		},
		{
			id: 18,
			santriId: 16,
			jenisPembayaranId: 16,
			tahunAjaranId: 14,
			bulan: 'Februari',
			tanggalBayar: '2026-03-11T18:50:54.499Z',
			nominalDibayar: 150000,
			nomorKwitansi: 'KW-1773255054499'
		},
		{
			id: 19,
			santriId: 17,
			jenisPembayaranId: 16,
			tahunAjaranId: 14,
			bulan: 'Februari',
			tanggalBayar: '2026-03-11T18:52:53.440Z',
			nominalDibayar: 150000,
			nomorKwitansi: 'KW-1773255173440'
		},
		{
			id: 21,
			santriId: 16,
			jenisPembayaranId: 16,
			tahunAjaranId: 14,
			bulan: 'Maret',
			tanggalBayar: '2026-03-11T19:01:11.474Z',
			nominalDibayar: 150000,
			nomorKwitansi: 'KW-1773255671474'
		},
		{
			id: 23,
			santriId: 17,
			jenisPembayaranId: 16,
			tahunAjaranId: 14,
			bulan: 'Maret',
			tanggalBayar: '2026-03-11T19:30:31.904Z',
			nominalDibayar: 150000,
			nomorKwitansi: 'KW-1773257431904'
		},
		{
			id: 24,
			santriId: 16,
			jenisPembayaranId: 16,
			tahunAjaranId: 15,
			bulan: 'Desember',
			tanggalBayar: '2026-03-11T19:38:47.163Z',
			nominalDibayar: 150000,
			nomorKwitansi: 'KW-1773257927163'
		},
		{
			id: 28,
			santriId: 16,
			jenisPembayaranId: 22,
			tahunAjaranId: 14,
			bulan: null,
			tanggalBayar: '2026-03-11T20:03:58.276Z',
			nominalDibayar: 1000000,
			nomorKwitansi: 'KW-1773259438276'
		}
	]);

	// 5. Seed Users & Profil Pesantren (NEW)
	await db.insert(schema.users).values([
		{ id: 11, username: 'admin', passwordHash: '$2b$10$dvREgjkWhltReUHMrjc21uPONjiwd4CK8HFqndSigw1CzrRw64c.e', role: 'admin', namaLengkap: 'Administrator Utama' },
		{ id: 14, username: 'bendahara', passwordHash: '$2b$10$Z3ioXj/2yO7Zv8icO7MOluYK/D8oI9x8J.6tPG8NoBaLIZ5WNp9cu', role: 'bendahara', namaLengkap: 'Bendahara' }
	]);

	await db.insert(schema.pengaturanPesantren).values([
		{
			id: 4,
			namaPesantren: 'Ponpes Al Qodiriyah',
			alamat: 'Bawang, Candisari, Kec. Windusari, Kabupaten Magelang, Jawa Tengah 56152',
			noTelp: '085171543234',
			logoUrl: '/uploads/logo-4-1773264130626.jpg'
		}
	]);

	console.log('✅ Database seeded!');
	process.exit(0);
}

seed().catch((e) => {
	console.error('Seed error:', e);
	process.exit(1);
});
