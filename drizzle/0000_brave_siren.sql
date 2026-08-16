CREATE TABLE "jenis_pembayaran" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_pembayaran" text NOT NULL,
	"tipe" text NOT NULL,
	"nominal_default" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kategori_gratis" (
	"id" serial PRIMARY KEY NOT NULL,
	"kategori_id" integer NOT NULL,
	"jenis_pembayaran_id" integer NOT NULL,
	"nominal" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "kategori_santri" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_kategori" text NOT NULL,
	"nominal_syahriyah" integer DEFAULT 0 NOT NULL,
	"nominal_konsumsi" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "kategori_santri_nama_kategori_unique" UNIQUE("nama_kategori")
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"ip" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lock_until" text,
	"last_attempt_at" text
);
--> statement-breakpoint
CREATE TABLE "mutasi_saldo_bendahara" (
	"id" serial PRIMARY KEY NOT NULL,
	"bendahara_id" integer NOT NULL,
	"nominal" integer NOT NULL,
	"catatan" text,
	"tanggal" text NOT NULL,
	"input_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "pembayar_lain" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_pembayar" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pembayaran" (
	"id" serial PRIMARY KEY NOT NULL,
	"santri_id" integer,
	"pembayar_lain_id" integer,
	"jenis_pembayaran_id" integer NOT NULL,
	"tahun_ajaran_id" integer NOT NULL,
	"bulan" text,
	"tahun_tagihan" integer,
	"tanggal_bayar" text NOT NULL,
	"nominal_dibayar" integer NOT NULL,
	"nomor_kwitansi" text NOT NULL,
	"input_by_id" integer,
	"keterangan_khusus" text,
	CONSTRAINT "pembayaran_nomor_kwitansi_unique" UNIQUE("nomor_kwitansi")
);
--> statement-breakpoint
CREATE TABLE "pengaturan_pesantren" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_pesantren" text DEFAULT 'Pesantren Al-Hikmah' NOT NULL,
	"alamat" text DEFAULT 'Jl. Pendidikan No. 123, Kota Santri' NOT NULL,
	"no_telp" text DEFAULT '(021) 1234567' NOT NULL,
	"logo_url" text DEFAULT '',
	"stamp_url" text DEFAULT '',
	"telegram_bot_token" text,
	"telegram_chat_id" text
);
--> statement-breakpoint
CREATE TABLE "role_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"route_id" text NOT NULL,
	"is_allowed" boolean DEFAULT true NOT NULL,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "santri" (
	"id" serial PRIMARY KEY NOT NULL,
	"nomor_induk" text NOT NULL,
	"nama_lengkap" text NOT NULL,
	"tanggal_masuk" text,
	"tanggal_keluar" text,
	"kategori_id" integer,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "santri_nomor_induk_unique" UNIQUE("nomor_induk")
);
--> statement-breakpoint
CREATE TABLE "santri_detail" (
	"id" serial PRIMARY KEY NOT NULL,
	"santri_id" integer NOT NULL,
	"tempat_lahir" text,
	"tanggal_lahir" text,
	"jenis_kelamin" text,
	"golongan_darah" text,
	"nik" text,
	"no_kk" text,
	"anak_ke" integer,
	"jumlah_saudara" integer,
	"tinggi_cm" integer,
	"berat_kg" integer,
	"alamat_lengkap" text,
	"rt" text,
	"rw" text,
	"desa_kelurahan" text,
	"kecamatan" text,
	"kabupaten" text,
	"provinsi" text,
	"no_kip" text,
	"no_kis_kps_pkh" text,
	"kebutuhan_khusus" text,
	"nama_ayah" text,
	"tanggal_lahir_ayah" text,
	"pendidikan_ayah" text,
	"nik_ayah" text,
	"alamat_ayah" text,
	"no_hp_ayah" text,
	"pekerjaan_ayah" text,
	"penghasilan_ayah" integer,
	"nama_ibu" text,
	"tanggal_lahir_ibu" text,
	"pendidikan_ibu" text,
	"nik_ibu" text,
	"alamat_ibu" text,
	"pekerjaan_ibu" text,
	"penghasilan_ibu" integer,
	CONSTRAINT "santri_detail_santri_id_unique" UNIQUE("santri_id")
);
--> statement-breakpoint
CREATE TABLE "santri_kategori_tahun" (
	"id" serial PRIMARY KEY NOT NULL,
	"santri_id" integer NOT NULL,
	"tahun_ajaran_id" integer NOT NULL,
	"kategori_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "santri_keaktifan" (
	"id" serial PRIMARY KEY NOT NULL,
	"santri_id" integer NOT NULL,
	"bulan" integer NOT NULL,
	"tahun" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "santri_smk" (
	"id" serial PRIMARY KEY NOT NULL,
	"santri_id" integer NOT NULL,
	"start_month" integer NOT NULL,
	"start_year" integer NOT NULL,
	"end_month" integer,
	"end_year" integer,
	CONSTRAINT "santri_smk_santri_id_unique" UNIQUE("santri_id")
);
--> statement-breakpoint
CREATE TABLE "santri_smp" (
	"id" serial PRIMARY KEY NOT NULL,
	"santri_id" integer NOT NULL,
	"start_month" integer NOT NULL,
	"start_year" integer NOT NULL,
	"end_month" integer,
	"end_year" integer,
	CONSTRAINT "santri_smp_santri_id_unique" UNIQUE("santri_id")
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"username" text,
	"role" text,
	"aksi" text NOT NULL,
	"modul" text NOT NULL,
	"keterangan" text,
	"ip" text,
	"stack_trace" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tahun_ajaran" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"is_active" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "tunggakan_import" (
	"id" serial PRIMARY KEY NOT NULL,
	"santri_id" integer,
	"pembayar_lain_id" integer,
	"tahun_ajaran_id" integer NOT NULL,
	"jenis_pembayaran_id" integer NOT NULL,
	"bulan" text,
	"tahun_tagihan" integer,
	"nominal_asal_tagihan" integer,
	"nominal_tagihan" integer NOT NULL,
	"keterangan_khusus" text,
	"catatan" text,
	"signature_key" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "tunggakan_import_signature_key_unique" UNIQUE("signature_key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"nama_lengkap" text NOT NULL,
	"signature_url" text,
	"session_id" text,
	"telegram_bot_token" text,
	"telegram_chat_id" text,
	"otp_2fa_enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "kategori_gratis" ADD CONSTRAINT "kategori_gratis_kategori_id_kategori_santri_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."kategori_santri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kategori_gratis" ADD CONSTRAINT "kategori_gratis_jenis_pembayaran_id_jenis_pembayaran_id_fk" FOREIGN KEY ("jenis_pembayaran_id") REFERENCES "public"."jenis_pembayaran"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutasi_saldo_bendahara" ADD CONSTRAINT "mutasi_saldo_bendahara_bendahara_id_users_id_fk" FOREIGN KEY ("bendahara_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutasi_saldo_bendahara" ADD CONSTRAINT "mutasi_saldo_bendahara_input_by_id_users_id_fk" FOREIGN KEY ("input_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_santri_id_santri_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_pembayar_lain_id_pembayar_lain_id_fk" FOREIGN KEY ("pembayar_lain_id") REFERENCES "public"."pembayar_lain"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_jenis_pembayaran_id_jenis_pembayaran_id_fk" FOREIGN KEY ("jenis_pembayaran_id") REFERENCES "public"."jenis_pembayaran"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_tahun_ajaran_id_tahun_ajaran_id_fk" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "public"."tahun_ajaran"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_input_by_id_users_id_fk" FOREIGN KEY ("input_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santri" ADD CONSTRAINT "santri_kategori_id_kategori_santri_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."kategori_santri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santri_detail" ADD CONSTRAINT "santri_detail_santri_id_santri_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santri_kategori_tahun" ADD CONSTRAINT "santri_kategori_tahun_santri_id_santri_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santri_kategori_tahun" ADD CONSTRAINT "santri_kategori_tahun_tahun_ajaran_id_tahun_ajaran_id_fk" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "public"."tahun_ajaran"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santri_kategori_tahun" ADD CONSTRAINT "santri_kategori_tahun_kategori_id_kategori_santri_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."kategori_santri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santri_keaktifan" ADD CONSTRAINT "santri_keaktifan_santri_id_santri_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santri_smk" ADD CONSTRAINT "santri_smk_santri_id_santri_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santri_smp" ADD CONSTRAINT "santri_smp_santri_id_santri_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tunggakan_import" ADD CONSTRAINT "tunggakan_import_santri_id_santri_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tunggakan_import" ADD CONSTRAINT "tunggakan_import_pembayar_lain_id_pembayar_lain_id_fk" FOREIGN KEY ("pembayar_lain_id") REFERENCES "public"."pembayar_lain"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tunggakan_import" ADD CONSTRAINT "tunggakan_import_tahun_ajaran_id_tahun_ajaran_id_fk" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "public"."tahun_ajaran"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tunggakan_import" ADD CONSTRAINT "tunggakan_import_jenis_pembayaran_id_jenis_pembayaran_id_fk" FOREIGN KEY ("jenis_pembayaran_id") REFERENCES "public"."jenis_pembayaran"("id") ON DELETE no action ON UPDATE no action;