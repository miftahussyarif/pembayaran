import { boolean, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const tahunAjaran = pgTable('tahun_ajaran', {
	id: serial('id').primaryKey(),
	nama: text('nama').notNull(), // e.g. "2023/2024"
	isActive: boolean('is_active').default(false)
});

export const jenisPembayaran = pgTable('jenis_pembayaran', {
	id: serial('id').primaryKey(),
	namaPembayaran: text('nama_pembayaran').notNull(),
	tipe: text('tipe', { enum: ['bulanan', 'tahunan', 'sekali', 'smk_bulanan', 'smk_tahunan', 'smk_sekali', 'smp_bulanan', 'smp_tahunan', 'smp_sekali'] }).notNull(),
	nominalDefault: integer('nominal_default').notNull()
});

export const kategoriSantri = pgTable('kategori_santri', {
	id: serial('id').primaryKey(),
	namaKategori: text('nama_kategori').notNull().unique(),
	nominalSyahriyah: integer('nominal_syahriyah').notNull().default(0),
	nominalKonsumsi: integer('nominal_konsumsi').notNull().default(0)
});

export const santri = pgTable('santri', {
	id: serial('id').primaryKey(),
	nomorInduk: text('nomor_induk').notNull().unique(),
	namaLengkap: text('nama_lengkap').notNull(),
	tanggalMasuk: text('tanggal_masuk'),
	tanggalKeluar: text('tanggal_keluar'),
	kategoriId: integer('kategori_id').references(() => kategoriSantri.id),
	isActive: boolean('is_active').default(true)
});

export const santriDetail = pgTable('santri_detail', {
	id: serial('id').primaryKey(),
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

export const santriSmk = pgTable('santri_smk', {
	id: serial('id').primaryKey(),
	santriId: integer('santri_id').references(() => santri.id).notNull().unique(),
	startMonth: integer('start_month').notNull(),
	startYear: integer('start_year').notNull(),
	endMonth: integer('end_month'),
	endYear: integer('end_year')
});

export const santriSmp = pgTable('santri_smp', {
	id: serial('id').primaryKey(),
	santriId: integer('santri_id').references(() => santri.id).notNull().unique(),
	startMonth: integer('start_month').notNull(),
	startYear: integer('start_year').notNull(),
	endMonth: integer('end_month'),
	endYear: integer('end_year')
});

export const santriKeaktifan = pgTable('santri_keaktifan', {
	id: serial('id').primaryKey(),
	santriId: integer('santri_id').references(() => santri.id).notNull(),
	bulan: integer('bulan').notNull(),
	tahun: integer('tahun').notNull(),
	isActive: boolean('is_active').notNull().default(true),
	updatedAt: text('updated_at').notNull()
});

export const pembayarLain = pgTable('pembayar_lain', {
	id: serial('id').primaryKey(),
	namaPembayar: text('nama_pembayar').notNull(),
	createdAt: text('created_at').notNull()
});

export const pembayaran = pgTable('pembayaran', {
	id: serial('id').primaryKey(),
	santriId: integer('santri_id').references(() => santri.id),
	pembayarLainId: integer('pembayar_lain_id').references(() => pembayarLain.id),
	jenisPembayaranId: integer('jenis_pembayaran_id').references(() => jenisPembayaran.id).notNull(),
	tahunAjaranId: integer('tahun_ajaran_id').references(() => tahunAjaran.id).notNull(),
	bulan: text('bulan'), // e.g. "Januari", "Februari" - Null if 'sekali'
	tahunTagihan: integer('tahun_tagihan'),
	tanggalBayar: text('tanggal_bayar').notNull(),
	nominalDibayar: integer('nominal_dibayar').notNull(),
	nomorKwitansi: text('nomor_kwitansi').notNull().unique(),
	inputById: integer('input_by_id').references(() => users.id),
	keteranganKhusus: text('keterangan_khusus') // for custom/special payments
});

export const tunggakanImport = pgTable('tunggakan_import', {
	id: serial('id').primaryKey(),
	santriId: integer('santri_id').references(() => santri.id),
	pembayarLainId: integer('pembayar_lain_id').references(() => pembayarLain.id),
	tahunAjaranId: integer('tahun_ajaran_id').references(() => tahunAjaran.id).notNull(),
	jenisPembayaranId: integer('jenis_pembayaran_id').references(() => jenisPembayaran.id).notNull(),
	bulan: text('bulan'),
	tahunTagihan: integer('tahun_tagihan'),
	nominalAsalTagihan: integer('nominal_asal_tagihan'),
	nominalTagihan: integer('nominal_tagihan').notNull(),
	keteranganKhusus: text('keterangan_khusus'),
	catatan: text('catatan'),
	signatureKey: text('signature_key').notNull().unique(),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['admin', 'bendahara', 'petugas'] }).notNull().default('admin'),
	namaLengkap: text('nama_lengkap').notNull(),
	signatureUrl: text('signature_url'),
	sessionId: text('session_id'),
	telegramBotToken: text('telegram_bot_token'),
	telegramChatId: text('telegram_chat_id'),
	otp2faEnabled: boolean('otp_2fa_enabled').notNull().default(true)
});

export const mutasiSaldoBendahara = pgTable('mutasi_saldo_bendahara', {
	id: serial('id').primaryKey(),
	bendaharaId: integer('bendahara_id').references(() => users.id).notNull(),
	nominal: integer('nominal').notNull(),
	catatan: text('catatan'),
	tanggal: text('tanggal').notNull(),
	inputById: integer('input_by_id').references(() => users.id)
});

export const systemLogs = pgTable('system_logs', {
	id: serial('id').primaryKey(),
	userId: integer('user_id').references(() => users.id),
	username: text('username'),
	role: text('role'),
	aksi: text('aksi').notNull(),
	modul: text('modul').notNull(),
	keterangan: text('keterangan'),
	ip: text('ip'),
	stackTrace: text('stack_trace'),
	createdAt: text('created_at').notNull()
});

export const pengaturanPesantren = pgTable('pengaturan_pesantren', {
	id: serial('id').primaryKey(),
	namaPesantren: text('nama_pesantren').notNull().default('Pesantren Al-Hikmah'),
	alamat: text('alamat').notNull().default('Jl. Pendidikan No. 123, Kota Santri'),
	noTelp: text('no_telp').notNull().default('(021) 1234567'),
	logoUrl: text('logo_url').default(''),
	stampUrl: text('stamp_url').default(''),
	telegramBotToken: text('telegram_bot_token'),
	telegramChatId: text('telegram_chat_id')
});
export const kategoriGratis = pgTable('kategori_gratis', {
	id: serial('id').primaryKey(),
	kategoriId: integer('kategori_id').references(() => kategoriSantri.id).notNull(),
	jenisPembayaranId: integer('jenis_pembayaran_id').references(() => jenisPembayaran.id).notNull(),
	nominal: integer('nominal').default(0) // 0 = gratis, null = use default
});

// Relasi multi-kategori per santri per tahun ajaran
export const santriKategoriTahun = pgTable('santri_kategori_tahun', {
  id: serial('id').primaryKey(),
  santriId: integer('santri_id').references(() => santri.id).notNull(),
  tahunAjaranId: integer('tahun_ajaran_id').references(() => tahunAjaran.id).notNull(),
  kategoriId: integer('kategori_id').references(() => kategoriSantri.id).notNull(),
});

export const loginAttempts = pgTable('login_attempts', {
	ip: text('ip').primaryKey(),
	attempts: integer('attempts').notNull().default(0),
	lockUntil: text('lock_until'),
	lastAttemptAt: text('last_attempt_at')
});

export const roleAccess = pgTable('role_access', {
	id: serial('id').primaryKey(),
	role: text('role').notNull(),
	routeId: text('route_id').notNull(),
	isAllowed: boolean('is_allowed').notNull().default(true),
	updatedAt: text('updated_at')
});

