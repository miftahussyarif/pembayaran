import 'dotenv/config';
import { db } from './src/lib/server/db/index.js';
import * as schema from './src/lib/server/db/schema.js';

async function seed() {
	console.log('🌱 Seeding database...');

	try {
        await db.delete(schema.systemLogs);
        await db.delete(schema.mutasiSaldoBendahara);
        await db.delete(schema.pembayaran);
        await db.delete(schema.santriDetail);
        await db.delete(schema.santriSmk);
        await db.delete(schema.santriSmp);
        await db.delete(schema.kategoriGratis);
		await db.delete(schema.santri);
		await db.delete(schema.kategoriSantri);
		await db.delete(schema.jenisPembayaran);
		await db.delete(schema.tahunAjaran);
		await db.delete(schema.users);
		await db.delete(schema.pengaturanPesantren);
	} catch (e) {
		console.log('Tables empty or not exist yet');
	}

	await db.insert(schema.tahunAjaran).values([
	  {
	    "id": 14,
	    "nama": "2026",
	    "isActive": true
	  },
	  {
	    "id": 15,
	    "nama": "2025",
	    "isActive": false
	  },
	  {
	    "id": 16,
	    "nama": "2024",
	    "isActive": false
	  },
	  {
	    "id": 18,
	    "nama": "2023",
	    "isActive": false
	  },
	  {
	    "id": 19,
	    "nama": "2022",
	    "isActive": false
	  },
	  {
	    "id": 20,
	    "nama": "2021",
	    "isActive": false
	  },
	  {
	    "id": 21,
	    "nama": "2020",
	    "isActive": false
	  },
	  {
	    "id": 22,
	    "nama": "2019",
	    "isActive": false
	  },
	  {
	    "id": 23,
	    "nama": "2018",
	    "isActive": false
	  },
	  {
	    "id": 24,
	    "nama": "2017",
	    "isActive": false
	  }
	]);

	await db.insert(schema.jenisPembayaran).values([
	  {
	    "id": 25,
	    "namaPembayaran": "SPP SMK",
	    "tipe": "smk_bulanan",
	    "nominalDefault": 50000
	  },
	  {
	    "id": 26,
	    "namaPembayaran": "SPP SMP",
	    "tipe": "smp_bulanan",
	    "nominalDefault": 50000
	  },
	  {
	    "id": 27,
	    "namaPembayaran": "PKL SMK",
	    "tipe": "smk_sekali",
	    "nominalDefault": 1350000
	  },
	  {
	    "id": 28,
	    "namaPembayaran": "Ujian SMK",
	    "tipe": "smk_sekali",
	    "nominalDefault": 1200000
	  },
	  {
	    "id": 29,
	    "namaPembayaran": "Konsumsi",
	    "tipe": "bulanan",
	    "nominalDefault": 100000
	  },
	  {
	    "id": 30,
	    "namaPembayaran": "Pengembangan",
	    "tipe": "tahunan",
	    "nominalDefault": 1000000
	  },
	  {
	    "id": 33,
	    "namaPembayaran": "Pembayaran Lain-lain",
	    "tipe": "sekali",
	    "nominalDefault": 0
	  }
	]);

	await db.insert(schema.kategoriSantri).values([
	  {
	    "id": 1,
	    "namaKategori": "Reguler",
	    "nominalSyahriyah": 100000,
	    "nominalKonsumsi": 100000
	  },
	  {
	    "id": 2,
	    "namaKategori": "Kakak Beradik",
	    "nominalSyahriyah": 75000,
	    "nominalKonsumsi": 75000
	  },
	  {
	    "id": 3,
	    "namaKategori": "Yatim",
	    "nominalSyahriyah": 0,
	    "nominalKonsumsi": 0
	  },
	  {
	    "id": 6,
	    "namaKategori": "Kakak Beradik - 3",
	    "nominalSyahriyah": 0,
	    "nominalKonsumsi": 0
	  }
	]);

	await db.insert(schema.kategoriGratis).values([
	  {
	    "id": 9,
	    "kategoriId": 2,
	    "jenisPembayaranId": 25,
	    "nominal": 25000
	  },
	  {
	    "id": 10,
	    "kategoriId": 3,
	    "jenisPembayaranId": 25,
	    "nominal": 0
	  },
	  {
	    "id": 11,
	    "kategoriId": 6,
	    "jenisPembayaranId": 25,
	    "nominal": 0
	  },
	  {
	    "id": 12,
	    "kategoriId": 2,
	    "jenisPembayaranId": 26,
	    "nominal": 25000
	  },
	  {
	    "id": 13,
	    "kategoriId": 3,
	    "jenisPembayaranId": 26,
	    "nominal": 0
	  },
	  {
	    "id": 14,
	    "kategoriId": 6,
	    "jenisPembayaranId": 26,
	    "nominal": 0
	  },
	  {
	    "id": 15,
	    "kategoriId": 2,
	    "jenisPembayaranId": 27,
	    "nominal": 1000000
	  },
	  {
	    "id": 16,
	    "kategoriId": 6,
	    "jenisPembayaranId": 27,
	    "nominal": 1000000
	  },
	  {
	    "id": 17,
	    "kategoriId": 3,
	    "jenisPembayaranId": 29,
	    "nominal": 0
	  },
	  {
	    "id": 18,
	    "kategoriId": 2,
	    "jenisPembayaranId": 30,
	    "nominal": 500000
	  },
	  {
	    "id": 19,
	    "kategoriId": 3,
	    "jenisPembayaranId": 30,
	    "nominal": 0
	  },
	  {
	    "id": 20,
	    "kategoriId": 6,
	    "jenisPembayaranId": 30,
	    "nominal": 0
	  }
	]);

	await db.insert(schema.santri).values([
	  {
	    "id": 16,
	    "nomorInduk": "24001",
	    "namaLengkap": "Ahmad Faisal SMK",
	    "tanggalMasuk": "2025-07-15",
	    "tanggalKeluar": null,
	    "kategoriId": 1,
	    "isActive": true
	  },
	  {
	    "id": 17,
	    "nomorInduk": "24002",
	    "namaLengkap": "Budi Santoso",
	    "tanggalMasuk": "2025-07-15",
	    "tanggalKeluar": null,
	    "kategoriId": 2,
	    "isActive": true
	  },
	  {
	    "id": 18,
	    "nomorInduk": "24003",
	    "namaLengkap": "Siti Aminah",
	    "tanggalMasuk": "2025-07-10",
	    "tanggalKeluar": null,
	    "kategoriId": 3,
	    "isActive": true
	  },
	  {
	    "id": 19,
	    "nomorInduk": "24004",
	    "namaLengkap": "Baskara",
	    "tanggalMasuk": "2025-07-07",
	    "tanggalKeluar": null,
	    "kategoriId": 3,
	    "isActive": true
	  }
	]);

	await db.insert(schema.santriSmp).values([
	  {
	    "id": 1,
	    "santriId": 18,
	    "startMonth": 7,
	    "startYear": 2025,
	    "endMonth": null,
	    "endYear": null
	  },
	  {
	    "id": 2,
	    "santriId": 17,
	    "startMonth": 7,
	    "startYear": 2025,
	    "endMonth": null,
	    "endYear": null
	  }
	]);

	await db.insert(schema.santriSmk).values([
	  {
	    "id": 1,
	    "santriId": 16,
	    "startMonth": 7,
	    "startYear": 2025,
	    "endMonth": null,
	    "endYear": null
	  },
	  {
	    "id": 2,
	    "santriId": 19,
	    "startMonth": 7,
	    "startYear": 2025,
	    "endMonth": null,
	    "endYear": null
	  }
	]);

	await db.insert(schema.santriDetail).values([
	  {
	    "id": 1,
	    "santriId": 17,
	    "tempatLahir": null,
	    "tanggalLahir": null,
	    "jenisKelamin": null,
	    "golonganDarah": null,
	    "nik": null,
	    "noKk": null,
	    "anakKe": null,
	    "jumlahSaudara": null,
	    "tinggiCm": null,
	    "beratKg": null,
	    "alamatLengkap": null,
	    "rt": null,
	    "rw": null,
	    "desaKelurahan": null,
	    "kecamatan": null,
	    "kabupaten": null,
	    "provinsi": null,
	    "noKip": null,
	    "noKisKpsPkh": null,
	    "kebutuhanKhusus": null,
	    "namaAyah": null,
	    "tanggalLahirAyah": null,
	    "pendidikanAyah": null,
	    "nikAyah": null,
	    "alamatAyah": null,
	    "noHpAyah": null,
	    "pekerjaanAyah": null,
	    "penghasilanAyah": null,
	    "namaIbu": null,
	    "tanggalLahirIbu": null,
	    "pendidikanIbu": null,
	    "nikIbu": null,
	    "alamatIbu": null,
	    "pekerjaanIbu": null,
	    "penghasilanIbu": null
	  },
	  {
	    "id": 2,
	    "santriId": 16,
	    "tempatLahir": "Temanggung",
	    "tanggalLahir": "2001-01-01",
	    "jenisKelamin": "Laki-Laki",
	    "golonganDarah": "O",
	    "nik": "3323060606980002",
	    "noKk": "3060606980004",
	    "anakKe": 1,
	    "jumlahSaudara": 1,
	    "tinggiCm": 165,
	    "beratKg": 70,
	    "alamatLengkap": "Bawang",
	    "rt": "2",
	    "rw": "2",
	    "desaKelurahan": "Candisari",
	    "kecamatan": "Windusari",
	    "kabupaten": "Magelang",
	    "provinsi": "Jawa Tengah",
	    "noKip": null,
	    "noKisKpsPkh": null,
	    "kebutuhanKhusus": "Tidak",
	    "namaAyah": "Ayah Saya",
	    "tanggalLahirAyah": "1991-06-06",
	    "pendidikanAyah": "SMA/SMK/MA",
	    "nikAyah": "332306060699001",
	    "alamatAyah": "Bawang, Candisari, Windusari, Magelang",
	    "noHpAyah": "085171543234",
	    "pekerjaanAyah": "Pegawai",
	    "penghasilanAyah": 12000000,
	    "namaIbu": "Ibu Saya",
	    "tanggalLahirIbu": "1992-06-06",
	    "pendidikanIbu": "D1/D2/D3",
	    "nikIbu": "332306060699002",
	    "alamatIbu": "Bawang, Candisari, Windusari, Magelang",
	    "pekerjaanIbu": "Pegawai",
	    "penghasilanIbu": 10000000
	  },
	  {
	    "id": 3,
	    "santriId": 18,
	    "tempatLahir": null,
	    "tanggalLahir": null,
	    "jenisKelamin": null,
	    "golonganDarah": null,
	    "nik": null,
	    "noKk": null,
	    "anakKe": null,
	    "jumlahSaudara": null,
	    "tinggiCm": null,
	    "beratKg": null,
	    "alamatLengkap": null,
	    "rt": null,
	    "rw": null,
	    "desaKelurahan": null,
	    "kecamatan": null,
	    "kabupaten": null,
	    "provinsi": null,
	    "noKip": null,
	    "noKisKpsPkh": null,
	    "kebutuhanKhusus": null,
	    "namaAyah": null,
	    "tanggalLahirAyah": null,
	    "pendidikanAyah": null,
	    "nikAyah": null,
	    "alamatAyah": null,
	    "noHpAyah": null,
	    "pekerjaanAyah": null,
	    "penghasilanAyah": null,
	    "namaIbu": null,
	    "tanggalLahirIbu": null,
	    "pendidikanIbu": null,
	    "nikIbu": null,
	    "alamatIbu": null,
	    "pekerjaanIbu": null,
	    "penghasilanIbu": null
	  },
	  {
	    "id": 4,
	    "santriId": 19,
	    "tempatLahir": null,
	    "tanggalLahir": null,
	    "jenisKelamin": null,
	    "golonganDarah": null,
	    "nik": null,
	    "noKk": null,
	    "anakKe": null,
	    "jumlahSaudara": null,
	    "tinggiCm": null,
	    "beratKg": null,
	    "alamatLengkap": null,
	    "rt": null,
	    "rw": null,
	    "desaKelurahan": null,
	    "kecamatan": null,
	    "kabupaten": null,
	    "provinsi": null,
	    "noKip": null,
	    "noKisKpsPkh": null,
	    "kebutuhanKhusus": null,
	    "namaAyah": null,
	    "tanggalLahirAyah": null,
	    "pendidikanAyah": null,
	    "nikAyah": null,
	    "alamatAyah": null,
	    "noHpAyah": null,
	    "pekerjaanAyah": null,
	    "penghasilanAyah": null,
	    "namaIbu": null,
	    "tanggalLahirIbu": null,
	    "pendidikanIbu": null,
	    "nikIbu": null,
	    "alamatIbu": null,
	    "pekerjaanIbu": null,
	    "penghasilanIbu": null
	  }
	]);

	await db.insert(schema.users).values([
	  {
	    "id": 11,
	    "username": "admin",
	    "passwordHash": "$2b$10$dvREgjkWhltReUHMrjc21uPONjiwd4CK8HFqndSigw1CzrRw64c.e",
	    "role": "admin",
	    "namaLengkap": "Miftahussyarif",
	    "signatureUrl": "/uploads/signature-1773494772704.png"
	  },
	  {
	    "id": 14,
	    "username": "bendahara",
	    "passwordHash": "$2b$10$Rl95Vvatz7j0WHDKw00RO.swMIgfyD5ON1aPWn1PQUxEkcmgSJVl6",
	    "role": "bendahara",
	    "namaLengkap": "Suliswati",
	    "signatureUrl": null
	  },
	  {
	    "id": 15,
	    "username": "petugas",
	    "passwordHash": "$2b$10$Ek64M5K9tvh7ax7v3LmlOu82Nm58mhJrFMjzv6PRSBEJmO1yMjNUG",
	    "role": "petugas",
	    "namaLengkap": "Petugas Kantor",
	    "signatureUrl": null
	  }
	]);

	await db.insert(schema.pengaturanPesantren).values([
	  {
	    "id": 4,
	    "namaPesantren": "PonPes Al Qodiriyah",
	    "alamat": "Bawang, Candisari, Windusari, Magelang",
	    "noTelp": "085171543234",
	    "logoUrl": "/uploads/logo-4-1773303036200.jpg",
	    "stampUrl": "/uploads/stamp-4-1773494439053.png",
	    "telegramBotToken": process.env.TELEGRAM_BOT_TOKEN || null,
	    "telegramChatId": process.env.TELEGRAM_CHAT_ID || null
	  }
	]);

	console.log('✅ Database seeded!');
	process.exit(0);
}

seed().catch((e) => {
	console.error('Seed error:', e);
	process.exit(1);
});
