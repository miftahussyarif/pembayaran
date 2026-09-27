--
-- PostgreSQL database dump
--

\restrict UerJ8tDh8yH9JFy7AQMMKkdoUPBBbLQEGbUB5oNlDvSOEfhpvcRH2FwgYLa42ou

-- Dumped from database version 18.4 (Ubuntu 18.4-0ubuntu0.26.04.1)
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: jenis_pembayaran; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.jenis_pembayaran (
    id integer NOT NULL,
    nama_pembayaran text NOT NULL,
    tipe text NOT NULL,
    nominal_default integer NOT NULL
);


ALTER TABLE public.jenis_pembayaran OWNER TO devuser;

--
-- Name: jenis_pembayaran_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.jenis_pembayaran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jenis_pembayaran_id_seq OWNER TO devuser;

--
-- Name: jenis_pembayaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.jenis_pembayaran_id_seq OWNED BY public.jenis_pembayaran.id;


--
-- Name: kategori_gratis; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.kategori_gratis (
    id integer NOT NULL,
    kategori_id integer NOT NULL,
    jenis_pembayaran_id integer NOT NULL,
    nominal integer DEFAULT 0
);


ALTER TABLE public.kategori_gratis OWNER TO devuser;

--
-- Name: kategori_gratis_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.kategori_gratis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kategori_gratis_id_seq OWNER TO devuser;

--
-- Name: kategori_gratis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.kategori_gratis_id_seq OWNED BY public.kategori_gratis.id;


--
-- Name: kategori_santri; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.kategori_santri (
    id integer NOT NULL,
    nama_kategori text NOT NULL,
    nominal_syahriyah integer DEFAULT 0 NOT NULL,
    nominal_konsumsi integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.kategori_santri OWNER TO devuser;

--
-- Name: kategori_santri_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.kategori_santri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kategori_santri_id_seq OWNER TO devuser;

--
-- Name: kategori_santri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.kategori_santri_id_seq OWNED BY public.kategori_santri.id;


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.login_attempts (
    ip text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    lock_until text,
    last_attempt_at text
);


ALTER TABLE public.login_attempts OWNER TO devuser;

--
-- Name: mutasi_saldo_bendahara; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.mutasi_saldo_bendahara (
    id integer NOT NULL,
    bendahara_id integer NOT NULL,
    nominal integer NOT NULL,
    catatan text,
    tanggal text NOT NULL,
    input_by_id integer
);


ALTER TABLE public.mutasi_saldo_bendahara OWNER TO devuser;

--
-- Name: mutasi_saldo_bendahara_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.mutasi_saldo_bendahara_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mutasi_saldo_bendahara_id_seq OWNER TO devuser;

--
-- Name: mutasi_saldo_bendahara_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.mutasi_saldo_bendahara_id_seq OWNED BY public.mutasi_saldo_bendahara.id;


--
-- Name: pembayar_lain; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.pembayar_lain (
    id integer NOT NULL,
    nama_pembayar text NOT NULL,
    created_at text NOT NULL
);


ALTER TABLE public.pembayar_lain OWNER TO devuser;

--
-- Name: pembayar_lain_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.pembayar_lain_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pembayar_lain_id_seq OWNER TO devuser;

--
-- Name: pembayar_lain_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.pembayar_lain_id_seq OWNED BY public.pembayar_lain.id;


--
-- Name: pembayaran; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.pembayaran (
    id integer NOT NULL,
    santri_id integer,
    pembayar_lain_id integer,
    jenis_pembayaran_id integer NOT NULL,
    tahun_ajaran_id integer NOT NULL,
    bulan text,
    tahun_tagihan integer,
    tanggal_bayar text NOT NULL,
    nominal_dibayar integer NOT NULL,
    nomor_kwitansi text NOT NULL,
    input_by_id integer,
    keterangan_khusus text
);


ALTER TABLE public.pembayaran OWNER TO devuser;

--
-- Name: pembayaran_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.pembayaran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pembayaran_id_seq OWNER TO devuser;

--
-- Name: pembayaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.pembayaran_id_seq OWNED BY public.pembayaran.id;


--
-- Name: pengaturan_pesantren; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.pengaturan_pesantren (
    id integer NOT NULL,
    nama_pesantren text DEFAULT 'Pesantren Al-Hikmah'::text NOT NULL,
    alamat text DEFAULT 'Jl. Pendidikan No. 123, Kota Santri'::text NOT NULL,
    no_telp text DEFAULT '(021) 1234567'::text NOT NULL,
    logo_url text DEFAULT ''::text,
    stamp_url text DEFAULT ''::text,
    telegram_bot_token text,
    telegram_chat_id text
);


ALTER TABLE public.pengaturan_pesantren OWNER TO devuser;

--
-- Name: pengaturan_pesantren_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.pengaturan_pesantren_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengaturan_pesantren_id_seq OWNER TO devuser;

--
-- Name: pengaturan_pesantren_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.pengaturan_pesantren_id_seq OWNED BY public.pengaturan_pesantren.id;


--
-- Name: role_access; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.role_access (
    id integer NOT NULL,
    role text NOT NULL,
    route_id text NOT NULL,
    is_allowed boolean DEFAULT true NOT NULL,
    updated_at text
);


ALTER TABLE public.role_access OWNER TO devuser;

--
-- Name: role_access_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.role_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_access_id_seq OWNER TO devuser;

--
-- Name: role_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.role_access_id_seq OWNED BY public.role_access.id;


--
-- Name: santri; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.santri (
    id integer NOT NULL,
    nomor_induk text NOT NULL,
    nama_lengkap text NOT NULL,
    tanggal_masuk text,
    tanggal_keluar text,
    kategori_id integer,
    is_active boolean DEFAULT true
);


ALTER TABLE public.santri OWNER TO devuser;

--
-- Name: santri_detail; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.santri_detail (
    id integer NOT NULL,
    santri_id integer NOT NULL,
    tempat_lahir text,
    tanggal_lahir text,
    jenis_kelamin text,
    golongan_darah text,
    nik text,
    no_kk text,
    anak_ke integer,
    jumlah_saudara integer,
    tinggi_cm integer,
    berat_kg integer,
    alamat_lengkap text,
    rt text,
    rw text,
    desa_kelurahan text,
    kecamatan text,
    kabupaten text,
    provinsi text,
    no_kip text,
    no_kis_kps_pkh text,
    kebutuhan_khusus text,
    nama_ayah text,
    tanggal_lahir_ayah text,
    pendidikan_ayah text,
    nik_ayah text,
    alamat_ayah text,
    no_hp_ayah text,
    pekerjaan_ayah text,
    penghasilan_ayah integer,
    nama_ibu text,
    tanggal_lahir_ibu text,
    pendidikan_ibu text,
    nik_ibu text,
    alamat_ibu text,
    pekerjaan_ibu text,
    penghasilan_ibu integer
);


ALTER TABLE public.santri_detail OWNER TO devuser;

--
-- Name: santri_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.santri_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.santri_detail_id_seq OWNER TO devuser;

--
-- Name: santri_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.santri_detail_id_seq OWNED BY public.santri_detail.id;


--
-- Name: santri_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.santri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.santri_id_seq OWNER TO devuser;

--
-- Name: santri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.santri_id_seq OWNED BY public.santri.id;


--
-- Name: santri_kategori_tahun; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.santri_kategori_tahun (
    id integer NOT NULL,
    santri_id integer NOT NULL,
    tahun_ajaran_id integer NOT NULL,
    kategori_id integer NOT NULL
);


ALTER TABLE public.santri_kategori_tahun OWNER TO devuser;

--
-- Name: santri_kategori_tahun_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.santri_kategori_tahun_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.santri_kategori_tahun_id_seq OWNER TO devuser;

--
-- Name: santri_kategori_tahun_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.santri_kategori_tahun_id_seq OWNED BY public.santri_kategori_tahun.id;


--
-- Name: santri_keaktifan; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.santri_keaktifan (
    id integer NOT NULL,
    santri_id integer NOT NULL,
    bulan integer NOT NULL,
    tahun integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    updated_at text NOT NULL
);


ALTER TABLE public.santri_keaktifan OWNER TO devuser;

--
-- Name: santri_keaktifan_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.santri_keaktifan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.santri_keaktifan_id_seq OWNER TO devuser;

--
-- Name: santri_keaktifan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.santri_keaktifan_id_seq OWNED BY public.santri_keaktifan.id;


--
-- Name: santri_smk; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.santri_smk (
    id integer NOT NULL,
    santri_id integer NOT NULL,
    start_month integer NOT NULL,
    start_year integer NOT NULL,
    end_month integer,
    end_year integer
);


ALTER TABLE public.santri_smk OWNER TO devuser;

--
-- Name: santri_smk_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.santri_smk_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.santri_smk_id_seq OWNER TO devuser;

--
-- Name: santri_smk_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.santri_smk_id_seq OWNED BY public.santri_smk.id;


--
-- Name: santri_smp; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.santri_smp (
    id integer NOT NULL,
    santri_id integer NOT NULL,
    start_month integer NOT NULL,
    start_year integer NOT NULL,
    end_month integer,
    end_year integer
);


ALTER TABLE public.santri_smp OWNER TO devuser;

--
-- Name: santri_smp_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.santri_smp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.santri_smp_id_seq OWNER TO devuser;

--
-- Name: santri_smp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.santri_smp_id_seq OWNED BY public.santri_smp.id;


--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.system_logs (
    id integer NOT NULL,
    user_id integer,
    username text,
    role text,
    aksi text NOT NULL,
    modul text NOT NULL,
    keterangan text,
    ip text,
    stack_trace text,
    created_at text NOT NULL
);


ALTER TABLE public.system_logs OWNER TO devuser;

--
-- Name: system_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.system_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_logs_id_seq OWNER TO devuser;

--
-- Name: system_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.system_logs_id_seq OWNED BY public.system_logs.id;


--
-- Name: tahun_ajaran; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.tahun_ajaran (
    id integer NOT NULL,
    nama text NOT NULL,
    is_active boolean DEFAULT false
);


ALTER TABLE public.tahun_ajaran OWNER TO devuser;

--
-- Name: tahun_ajaran_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.tahun_ajaran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tahun_ajaran_id_seq OWNER TO devuser;

--
-- Name: tahun_ajaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.tahun_ajaran_id_seq OWNED BY public.tahun_ajaran.id;


--
-- Name: tunggakan_import; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.tunggakan_import (
    id integer NOT NULL,
    santri_id integer,
    pembayar_lain_id integer,
    tahun_ajaran_id integer NOT NULL,
    jenis_pembayaran_id integer NOT NULL,
    bulan text,
    tahun_tagihan integer,
    nominal_asal_tagihan integer,
    nominal_tagihan integer NOT NULL,
    keterangan_khusus text,
    catatan text,
    signature_key text NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL
);


ALTER TABLE public.tunggakan_import OWNER TO devuser;

--
-- Name: tunggakan_import_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.tunggakan_import_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tunggakan_import_id_seq OWNER TO devuser;

--
-- Name: tunggakan_import_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.tunggakan_import_id_seq OWNED BY public.tunggakan_import.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: devuser
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    nama_lengkap text NOT NULL,
    signature_url text,
    session_id text,
    telegram_bot_token text,
    telegram_chat_id text,
    otp_2fa_enabled boolean DEFAULT true NOT NULL
);


ALTER TABLE public.users OWNER TO devuser;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: devuser
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO devuser;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: devuser
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: jenis_pembayaran id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.jenis_pembayaran ALTER COLUMN id SET DEFAULT nextval('public.jenis_pembayaran_id_seq'::regclass);


--
-- Name: kategori_gratis id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.kategori_gratis ALTER COLUMN id SET DEFAULT nextval('public.kategori_gratis_id_seq'::regclass);


--
-- Name: kategori_santri id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.kategori_santri ALTER COLUMN id SET DEFAULT nextval('public.kategori_santri_id_seq'::regclass);


--
-- Name: mutasi_saldo_bendahara id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.mutasi_saldo_bendahara ALTER COLUMN id SET DEFAULT nextval('public.mutasi_saldo_bendahara_id_seq'::regclass);


--
-- Name: pembayar_lain id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.pembayar_lain ALTER COLUMN id SET DEFAULT nextval('public.pembayar_lain_id_seq'::regclass);


--
-- Name: pembayaran id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.pembayaran ALTER COLUMN id SET DEFAULT nextval('public.pembayaran_id_seq'::regclass);


--
-- Name: pengaturan_pesantren id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.pengaturan_pesantren ALTER COLUMN id SET DEFAULT nextval('public.pengaturan_pesantren_id_seq'::regclass);


--
-- Name: role_access id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.role_access ALTER COLUMN id SET DEFAULT nextval('public.role_access_id_seq'::regclass);


--
-- Name: santri id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri ALTER COLUMN id SET DEFAULT nextval('public.santri_id_seq'::regclass);


--
-- Name: santri_detail id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_detail ALTER COLUMN id SET DEFAULT nextval('public.santri_detail_id_seq'::regclass);


--
-- Name: santri_kategori_tahun id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_kategori_tahun ALTER COLUMN id SET DEFAULT nextval('public.santri_kategori_tahun_id_seq'::regclass);


--
-- Name: santri_keaktifan id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_keaktifan ALTER COLUMN id SET DEFAULT nextval('public.santri_keaktifan_id_seq'::regclass);


--
-- Name: santri_smk id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_smk ALTER COLUMN id SET DEFAULT nextval('public.santri_smk_id_seq'::regclass);


--
-- Name: santri_smp id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_smp ALTER COLUMN id SET DEFAULT nextval('public.santri_smp_id_seq'::regclass);


--
-- Name: system_logs id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.system_logs ALTER COLUMN id SET DEFAULT nextval('public.system_logs_id_seq'::regclass);


--
-- Name: tahun_ajaran id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.tahun_ajaran ALTER COLUMN id SET DEFAULT nextval('public.tahun_ajaran_id_seq'::regclass);


--
-- Name: tunggakan_import id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.tunggakan_import ALTER COLUMN id SET DEFAULT nextval('public.tunggakan_import_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: jenis_pembayaran; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.jenis_pembayaran (id, nama_pembayaran, tipe, nominal_default) FROM stdin;
\.


--
-- Data for Name: kategori_gratis; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.kategori_gratis (id, kategori_id, jenis_pembayaran_id, nominal) FROM stdin;
\.


--
-- Data for Name: kategori_santri; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.kategori_santri (id, nama_kategori, nominal_syahriyah, nominal_konsumsi) FROM stdin;
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.login_attempts (ip, attempts, lock_until, last_attempt_at) FROM stdin;
\.


--
-- Data for Name: mutasi_saldo_bendahara; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.mutasi_saldo_bendahara (id, bendahara_id, nominal, catatan, tanggal, input_by_id) FROM stdin;
\.


--
-- Data for Name: pembayar_lain; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.pembayar_lain (id, nama_pembayar, created_at) FROM stdin;
\.


--
-- Data for Name: pembayaran; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.pembayaran (id, santri_id, pembayar_lain_id, jenis_pembayaran_id, tahun_ajaran_id, bulan, tahun_tagihan, tanggal_bayar, nominal_dibayar, nomor_kwitansi, input_by_id, keterangan_khusus) FROM stdin;
\.


--
-- Data for Name: pengaturan_pesantren; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.pengaturan_pesantren (id, nama_pesantren, alamat, no_telp, logo_url, stamp_url, telegram_bot_token, telegram_chat_id) FROM stdin;
\.


--
-- Data for Name: role_access; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.role_access (id, role, route_id, is_allowed, updated_at) FROM stdin;
\.


--
-- Data for Name: santri; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.santri (id, nomor_induk, nama_lengkap, tanggal_masuk, tanggal_keluar, kategori_id, is_active) FROM stdin;
\.


--
-- Data for Name: santri_detail; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.santri_detail (id, santri_id, tempat_lahir, tanggal_lahir, jenis_kelamin, golongan_darah, nik, no_kk, anak_ke, jumlah_saudara, tinggi_cm, berat_kg, alamat_lengkap, rt, rw, desa_kelurahan, kecamatan, kabupaten, provinsi, no_kip, no_kis_kps_pkh, kebutuhan_khusus, nama_ayah, tanggal_lahir_ayah, pendidikan_ayah, nik_ayah, alamat_ayah, no_hp_ayah, pekerjaan_ayah, penghasilan_ayah, nama_ibu, tanggal_lahir_ibu, pendidikan_ibu, nik_ibu, alamat_ibu, pekerjaan_ibu, penghasilan_ibu) FROM stdin;
\.


--
-- Data for Name: santri_kategori_tahun; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.santri_kategori_tahun (id, santri_id, tahun_ajaran_id, kategori_id) FROM stdin;
\.


--
-- Data for Name: santri_keaktifan; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.santri_keaktifan (id, santri_id, bulan, tahun, is_active, updated_at) FROM stdin;
\.


--
-- Data for Name: santri_smk; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.santri_smk (id, santri_id, start_month, start_year, end_month, end_year) FROM stdin;
\.


--
-- Data for Name: santri_smp; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.santri_smp (id, santri_id, start_month, start_year, end_month, end_year) FROM stdin;
\.


--
-- Data for Name: system_logs; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.system_logs (id, user_id, username, role, aksi, modul, keterangan, ip, stack_trace, created_at) FROM stdin;
\.


--
-- Data for Name: tahun_ajaran; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.tahun_ajaran (id, nama, is_active) FROM stdin;
\.


--
-- Data for Name: tunggakan_import; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.tunggakan_import (id, santri_id, pembayar_lain_id, tahun_ajaran_id, jenis_pembayaran_id, bulan, tahun_tagihan, nominal_asal_tagihan, nominal_tagihan, keterangan_khusus, catatan, signature_key, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: devuser
--

COPY public.users (id, username, password_hash, role, nama_lengkap, signature_url, session_id, telegram_bot_token, telegram_chat_id, otp_2fa_enabled) FROM stdin;
2	localadmin	$2b$10$N7yzSM7cSEYBSADpGVk8BO.rbeccvWjhYAK/YHmXHJHTZ5Tp3w4DO	admin	Local Admin	\N	\N	\N	\N	f
\.


--
-- Name: jenis_pembayaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.jenis_pembayaran_id_seq', 1, false);


--
-- Name: kategori_gratis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.kategori_gratis_id_seq', 1, false);


--
-- Name: kategori_santri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.kategori_santri_id_seq', 1, false);


--
-- Name: mutasi_saldo_bendahara_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.mutasi_saldo_bendahara_id_seq', 1, false);


--
-- Name: pembayar_lain_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.pembayar_lain_id_seq', 1, false);


--
-- Name: pembayaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.pembayaran_id_seq', 1, false);


--
-- Name: pengaturan_pesantren_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.pengaturan_pesantren_id_seq', 1, false);


--
-- Name: role_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.role_access_id_seq', 1, false);


--
-- Name: santri_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.santri_detail_id_seq', 1, false);


--
-- Name: santri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.santri_id_seq', 1, false);


--
-- Name: santri_kategori_tahun_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.santri_kategori_tahun_id_seq', 1, false);


--
-- Name: santri_keaktifan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.santri_keaktifan_id_seq', 1, false);


--
-- Name: santri_smk_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.santri_smk_id_seq', 1, false);


--
-- Name: santri_smp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.santri_smp_id_seq', 1, false);


--
-- Name: system_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.system_logs_id_seq', 1, false);


--
-- Name: tahun_ajaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.tahun_ajaran_id_seq', 1, false);


--
-- Name: tunggakan_import_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.tunggakan_import_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: devuser
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: jenis_pembayaran jenis_pembayaran_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.jenis_pembayaran
    ADD CONSTRAINT jenis_pembayaran_pkey PRIMARY KEY (id);


--
-- Name: kategori_gratis kategori_gratis_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.kategori_gratis
    ADD CONSTRAINT kategori_gratis_pkey PRIMARY KEY (id);


--
-- Name: kategori_santri kategori_santri_nama_kategori_unique; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.kategori_santri
    ADD CONSTRAINT kategori_santri_nama_kategori_unique UNIQUE (nama_kategori);


--
-- Name: kategori_santri kategori_santri_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.kategori_santri
    ADD CONSTRAINT kategori_santri_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (ip);


--
-- Name: mutasi_saldo_bendahara mutasi_saldo_bendahara_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.mutasi_saldo_bendahara
    ADD CONSTRAINT mutasi_saldo_bendahara_pkey PRIMARY KEY (id);


--
-- Name: pembayar_lain pembayar_lain_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.pembayar_lain
    ADD CONSTRAINT pembayar_lain_pkey PRIMARY KEY (id);


--
-- Name: pembayaran pembayaran_nomor_kwitansi_unique; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT pembayaran_nomor_kwitansi_unique UNIQUE (nomor_kwitansi);


--
-- Name: pembayaran pembayaran_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT pembayaran_pkey PRIMARY KEY (id);


--
-- Name: pengaturan_pesantren pengaturan_pesantren_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.pengaturan_pesantren
    ADD CONSTRAINT pengaturan_pesantren_pkey PRIMARY KEY (id);


--
-- Name: role_access role_access_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.role_access
    ADD CONSTRAINT role_access_pkey PRIMARY KEY (id);


--
-- Name: santri_detail santri_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_detail
    ADD CONSTRAINT santri_detail_pkey PRIMARY KEY (id);


--
-- Name: santri_detail santri_detail_santri_id_unique; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_detail
    ADD CONSTRAINT santri_detail_santri_id_unique UNIQUE (santri_id);


--
-- Name: santri_kategori_tahun santri_kategori_tahun_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_kategori_tahun
    ADD CONSTRAINT santri_kategori_tahun_pkey PRIMARY KEY (id);


--
-- Name: santri_keaktifan santri_keaktifan_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_keaktifan
    ADD CONSTRAINT santri_keaktifan_pkey PRIMARY KEY (id);


--
-- Name: santri santri_nomor_induk_unique; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri
    ADD CONSTRAINT santri_nomor_induk_unique UNIQUE (nomor_induk);


--
-- Name: santri santri_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri
    ADD CONSTRAINT santri_pkey PRIMARY KEY (id);


--
-- Name: santri_smk santri_smk_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_smk
    ADD CONSTRAINT santri_smk_pkey PRIMARY KEY (id);


--
-- Name: santri_smk santri_smk_santri_id_unique; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_smk
    ADD CONSTRAINT santri_smk_santri_id_unique UNIQUE (santri_id);


--
-- Name: santri_smp santri_smp_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_smp
    ADD CONSTRAINT santri_smp_pkey PRIMARY KEY (id);


--
-- Name: santri_smp santri_smp_santri_id_unique; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_smp
    ADD CONSTRAINT santri_smp_santri_id_unique UNIQUE (santri_id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: tahun_ajaran tahun_ajaran_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.tahun_ajaran
    ADD CONSTRAINT tahun_ajaran_pkey PRIMARY KEY (id);


--
-- Name: tunggakan_import tunggakan_import_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.tunggakan_import
    ADD CONSTRAINT tunggakan_import_pkey PRIMARY KEY (id);


--
-- Name: tunggakan_import tunggakan_import_signature_key_unique; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.tunggakan_import
    ADD CONSTRAINT tunggakan_import_signature_key_unique UNIQUE (signature_key);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: kategori_gratis kategori_gratis_jenis_pembayaran_id_jenis_pembayaran_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.kategori_gratis
    ADD CONSTRAINT kategori_gratis_jenis_pembayaran_id_jenis_pembayaran_id_fk FOREIGN KEY (jenis_pembayaran_id) REFERENCES public.jenis_pembayaran(id);


--
-- Name: kategori_gratis kategori_gratis_kategori_id_kategori_santri_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.kategori_gratis
    ADD CONSTRAINT kategori_gratis_kategori_id_kategori_santri_id_fk FOREIGN KEY (kategori_id) REFERENCES public.kategori_santri(id);


--
-- Name: mutasi_saldo_bendahara mutasi_saldo_bendahara_bendahara_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.mutasi_saldo_bendahara
    ADD CONSTRAINT mutasi_saldo_bendahara_bendahara_id_users_id_fk FOREIGN KEY (bendahara_id) REFERENCES public.users(id);


--
-- Name: mutasi_saldo_bendahara mutasi_saldo_bendahara_input_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.mutasi_saldo_bendahara
    ADD CONSTRAINT mutasi_saldo_bendahara_input_by_id_users_id_fk FOREIGN KEY (input_by_id) REFERENCES public.users(id);


--
-- Name: pembayaran pembayaran_input_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT pembayaran_input_by_id_users_id_fk FOREIGN KEY (input_by_id) REFERENCES public.users(id);


--
-- Name: pembayaran pembayaran_jenis_pembayaran_id_jenis_pembayaran_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT pembayaran_jenis_pembayaran_id_jenis_pembayaran_id_fk FOREIGN KEY (jenis_pembayaran_id) REFERENCES public.jenis_pembayaran(id);


--
-- Name: pembayaran pembayaran_pembayar_lain_id_pembayar_lain_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT pembayaran_pembayar_lain_id_pembayar_lain_id_fk FOREIGN KEY (pembayar_lain_id) REFERENCES public.pembayar_lain(id);


--
-- Name: pembayaran pembayaran_santri_id_santri_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT pembayaran_santri_id_santri_id_fk FOREIGN KEY (santri_id) REFERENCES public.santri(id);


--
-- Name: pembayaran pembayaran_tahun_ajaran_id_tahun_ajaran_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT pembayaran_tahun_ajaran_id_tahun_ajaran_id_fk FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: santri_detail santri_detail_santri_id_santri_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_detail
    ADD CONSTRAINT santri_detail_santri_id_santri_id_fk FOREIGN KEY (santri_id) REFERENCES public.santri(id);


--
-- Name: santri santri_kategori_id_kategori_santri_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri
    ADD CONSTRAINT santri_kategori_id_kategori_santri_id_fk FOREIGN KEY (kategori_id) REFERENCES public.kategori_santri(id);


--
-- Name: santri_kategori_tahun santri_kategori_tahun_kategori_id_kategori_santri_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_kategori_tahun
    ADD CONSTRAINT santri_kategori_tahun_kategori_id_kategori_santri_id_fk FOREIGN KEY (kategori_id) REFERENCES public.kategori_santri(id);


--
-- Name: santri_kategori_tahun santri_kategori_tahun_santri_id_santri_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_kategori_tahun
    ADD CONSTRAINT santri_kategori_tahun_santri_id_santri_id_fk FOREIGN KEY (santri_id) REFERENCES public.santri(id);


--
-- Name: santri_kategori_tahun santri_kategori_tahun_tahun_ajaran_id_tahun_ajaran_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_kategori_tahun
    ADD CONSTRAINT santri_kategori_tahun_tahun_ajaran_id_tahun_ajaran_id_fk FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- Name: santri_keaktifan santri_keaktifan_santri_id_santri_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_keaktifan
    ADD CONSTRAINT santri_keaktifan_santri_id_santri_id_fk FOREIGN KEY (santri_id) REFERENCES public.santri(id);


--
-- Name: santri_smk santri_smk_santri_id_santri_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_smk
    ADD CONSTRAINT santri_smk_santri_id_santri_id_fk FOREIGN KEY (santri_id) REFERENCES public.santri(id);


--
-- Name: santri_smp santri_smp_santri_id_santri_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.santri_smp
    ADD CONSTRAINT santri_smp_santri_id_santri_id_fk FOREIGN KEY (santri_id) REFERENCES public.santri(id);


--
-- Name: system_logs system_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tunggakan_import tunggakan_import_jenis_pembayaran_id_jenis_pembayaran_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.tunggakan_import
    ADD CONSTRAINT tunggakan_import_jenis_pembayaran_id_jenis_pembayaran_id_fk FOREIGN KEY (jenis_pembayaran_id) REFERENCES public.jenis_pembayaran(id);


--
-- Name: tunggakan_import tunggakan_import_pembayar_lain_id_pembayar_lain_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.tunggakan_import
    ADD CONSTRAINT tunggakan_import_pembayar_lain_id_pembayar_lain_id_fk FOREIGN KEY (pembayar_lain_id) REFERENCES public.pembayar_lain(id);


--
-- Name: tunggakan_import tunggakan_import_santri_id_santri_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.tunggakan_import
    ADD CONSTRAINT tunggakan_import_santri_id_santri_id_fk FOREIGN KEY (santri_id) REFERENCES public.santri(id);


--
-- Name: tunggakan_import tunggakan_import_tahun_ajaran_id_tahun_ajaran_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: devuser
--

ALTER TABLE ONLY public.tunggakan_import
    ADD CONSTRAINT tunggakan_import_tahun_ajaran_id_tahun_ajaran_id_fk FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);


--
-- PostgreSQL database dump complete
--

\unrestrict UerJ8tDh8yH9JFy7AQMMKkdoUPBBbLQEGbUB5oNlDvSOEfhpvcRH2FwgYLa42ou

