import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tahunAjaran = sqliteTable('tahun_ajaran', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nama: text('nama').notNull(), // e.g. "2023/2024"
	isActive: integer('is_active', { mode: 'boolean' }).default(false)
});

export const jenisPembayaran = sqliteTable('jenis_pembayaran', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	namaPembayaran: text('nama_pembayaran').notNull(),
	tipe: text('tipe', { enum: ['bulanan', 'tahunan', 'sekali', 'smk_bulanan', 'smk_tahunan', 'smk_sekali', 'smp_bulanan', 'smp_tahunan', 'smp_sekali'] }).notNull(),
	nominalDefault: integer('nominal_default').notNull()
});

export const kategoriSantri = sqliteTable('kategori_santri', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	namaKategori: text('nama_kategori').notNull().unique(),
	nominalSyahriyah: integer('nominal_syahriyah').notNull().default(0),
	nominalKonsumsi: integer('nominal_konsumsi').notNull().default(0)
});

export const santri = sqliteTable('santri', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nomorInduk: text('nomor_induk').notNull().unique(),
	namaLengkap: text('nama_lengkap').notNull(),
	tanggalMasuk: text('tanggal_masuk'),
	tanggalKeluar: text('tanggal_keluar'),
	kategoriId: integer('kategori_id').references(() => kategoriSantri.id),
	isActive: integer('is_active', { mode: 'boolean' }).default(true)
});

export const santriDetail = sqliteTable('santri_detail', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	santriId: integer('santri_id').references(() => santri.id).notNull().unique(),
	tempatLahir: text('tempat_lahir'),
	tanggalLahir: text('tanggal_lahir'),
	jenisKelamin: text('jenis_kelamin'),
	golonganDarah: text('golongan_darah'),
	nik: text('nik'),
	noKk: text('no_kk'),
	anakKe: integer('anak_ke'),
	jumlahSaudara: integer('jumlah_saudara'),
	tinggiCm: integer('tinggi_cm'),
	beratKg: integer('berat_kg'),
	alamatLengkap: text('alamat_lengkap'),
	rt: text('rt'),
	rw: text('rw'),
	desaKelurahan: text('desa_kelurahan'),
	kecamatan: text('kecamatan'),
	kabupaten: text('kabupaten'),
	provinsi: text('provinsi'),
	noKip: text('no_kip'),
	noKisKpsPkh: text('no_kis_kps_pkh'),
	kebutuhanKhusus: text('kebutuhan_khusus'),
	namaAyah: text('nama_ayah'),
	tanggalLahirAyah: text('tanggal_lahir_ayah'),
	pendidikanAyah: text('pendidikan_ayah'),
	nikAyah: text('nik_ayah'),
	alamatAyah: text('alamat_ayah'),
	noHpAyah: text('no_hp_ayah'),
	pekerjaanAyah: text('pekerjaan_ayah'),
	penghasilanAyah: integer('penghasilan_ayah'),
	namaIbu: text('nama_ibu'),
	tanggalLahirIbu: text('tanggal_lahir_ibu'),
	pendidikanIbu: text('pendidikan_ibu'),
	nikIbu: text('nik_ibu'),
	alamatIbu: text('alamat_ibu'),
	pekerjaanIbu: text('pekerjaan_ibu'),
	penghasilanIbu: integer('penghasilan_ibu')
});

export const santriSmk = sqliteTable('santri_smk', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	santriId: integer('santri_id').references(() => santri.id).notNull().unique(),
	startMonth: integer('start_month').notNull(),
	startYear: integer('start_year').notNull(),
	endMonth: integer('end_month'),
	endYear: integer('end_year')
});

export const santriSmp = sqliteTable('santri_smp', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	santriId: integer('santri_id').references(() => santri.id).notNull().unique(),
	startMonth: integer('start_month').notNull(),
	startYear: integer('start_year').notNull(),
	endMonth: integer('end_month'),
	endYear: integer('end_year')
});

export const pembayaran = sqliteTable('pembayaran', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	santriId: integer('santri_id').references(() => santri.id).notNull(),
	jenisPembayaranId: integer('jenis_pembayaran_id').references(() => jenisPembayaran.id).notNull(),
	tahunAjaranId: integer('tahun_ajaran_id').references(() => tahunAjaran.id).notNull(),
	bulan: text('bulan'), // e.g. "Januari", "Februari" - Null if 'sekali'
	tanggalBayar: text('tanggal_bayar').notNull(),
	nominalDibayar: integer('nominal_dibayar').notNull(),
	nomorKwitansi: text('nomor_kwitansi').notNull().unique(),
	inputById: integer('input_by_id').references(() => users.id),
	keteranganKhusus: text('keterangan_khusus') // for custom/special payments
});

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['admin', 'bendahara', 'petugas'] }).notNull().default('admin'),
	namaLengkap: text('nama_lengkap').notNull(),
	signatureUrl: text('signature_url'),
	sessionId: text('session_id')
});

export const mutasiSaldoBendahara = sqliteTable('mutasi_saldo_bendahara', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	bendaharaId: integer('bendahara_id').references(() => users.id).notNull(),
	nominal: integer('nominal').notNull(),
	catatan: text('catatan'),
	tanggal: text('tanggal').notNull(),
	inputById: integer('input_by_id').references(() => users.id)
});

export const systemLogs = sqliteTable('system_logs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').references(() => users.id),
	username: text('username'),
	role: text('role'),
	aksi: text('aksi').notNull(),
	modul: text('modul').notNull(),
	keterangan: text('keterangan'),
	ip: text('ip'),
	createdAt: text('created_at').notNull()
});

export const pengaturanPesantren = sqliteTable('pengaturan_pesantren', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	namaPesantren: text('nama_pesantren').notNull().default('Pesantren Al-Hikmah'),
	alamat: text('alamat').notNull().default('Jl. Pendidikan No. 123, Kota Santri'),
	noTelp: text('no_telp').notNull().default('(021) 1234567'),
	logoUrl: text('logo_url').default(''),
	stampUrl: text('stamp_url').default(''),
	telegramBotToken: text('telegram_bot_token'),
	telegramChatId: text('telegram_chat_id')
});
export const kategoriGratis = sqliteTable('kategori_gratis', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	kategoriId: integer('kategori_id').references(() => kategoriSantri.id).notNull(),
	jenisPembayaranId: integer('jenis_pembayaran_id').references(() => jenisPembayaran.id).notNull(),
	nominal: integer('nominal').default(0) // 0 = gratis, null = use default
});

export const loginAttempts = sqliteTable('login_attempts', {
	ip: text('ip').primaryKey(),
	attempts: integer('attempts').notNull().default(0),
	lockUntil: text('lock_until')
});
