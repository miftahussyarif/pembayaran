import { getSemuaRekap } from '$lib/server/rekapIndividu.js';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DATA_DIR = path.join('static', 'public-data');

/**
 * Generate public database JSON containing only santri with outstanding tanggungan.
 * This file is saved to static/public-data/tanggungan.json and is accessible
 * from the /public routes without authentication.
 */
export async function generatePublicDatabase() {
	console.log('[PublicBackup] Generating public tanggungan database...');

	try {
		const { rekapIndividu } = await getSemuaRekap();

		// Get pesantren info for display
		const [pengaturan] = await db.select().from(schema.pengaturanPesantren).limit(1);

		// Map semua santri beserta detail tanggungannya (baik yang lunas maupun memiliki tanggungan)
		const semuaSantri = rekapIndividu
			.map(r => {
				// Build detail tanggungan items
				const detailTanggungan = [];

				// Bulanan Pondok
				for (const bp of (r.bulananPondok || [])) {
					if (bp.totalSisa > 0) {
						const unpaidMonths = (bp.months || [])
							.filter(m => !m.paid && m.nominalTagihan > 0)
							.map(m => ({
								bulan: m.bulan,
								tahun: m.tahun,
								nominal: m.nominalTagihan
							}));
						detailTanggungan.push({
							kategori: 'Bulanan Pondok',
							nama: bp.namaPembayaran,
							totalTagihan: bp.totalTagihan,
							totalDibayar: bp.totalDibayar,
							sisa: bp.totalSisa,
							unpaidMonths
						});
					}
				}

				// SMK Bulanan
				if (r.totalSisaSmkBulanan > 0) {
					const unpaidMonths = (r.smkBulanan || [])
						.filter(m => !m.paid && m.nominalTagihan > 0)
						.map(m => ({
							bulan: m.bulan,
							tahun: m.tahun,
							nominal: m.nominalTagihan
						}));
					detailTanggungan.push({
						kategori: 'SMK Bulanan',
						nama: 'SPP SMK',
						totalTagihan: r.totalTagihanSmkBulanan,
						totalDibayar: r.totalDibayarSmkBulanan,
						sisa: r.totalSisaSmkBulanan,
						unpaidMonths
					});
				}

				// SMP Bulanan
				if (r.totalSisaSmpBulanan > 0) {
					const unpaidMonths = (r.smpBulanan || [])
						.filter(m => !m.paid && m.nominalTagihan > 0)
						.map(m => ({
							bulan: m.bulan,
							tahun: m.tahun,
							nominal: m.nominalTagihan
						}));
					detailTanggungan.push({
						kategori: 'SMP Bulanan',
						nama: 'SPP SMP',
						totalTagihan: r.totalTagihanSmpBulanan,
						totalDibayar: r.totalDibayarSmpBulanan,
						sisa: r.totalSisaSmpBulanan,
						unpaidMonths
					});
				}

				// Pembayaran Lain (Tahunan, Sekali)
				for (const pl of (r.pembayaranLain || [])) {
					if (pl.sisa > 0) {
						detailTanggungan.push({
							kategori: pl.tipe === 'tahunan' || pl.tipe === 'smk_tahunan' || pl.tipe === 'smp_tahunan' ? 'Tahunan' : 'Sekali Bayar',
							nama: pl.namaPembayaran,
							totalTagihan: pl.totalTagihan,
							totalDibayar: pl.totalNominal,
							sisa: pl.sisa,
							tahunDetails: pl.tahunDetails?.filter(td => td.sisa > 0).map(td => ({
								tahun: td.namaTahun,
								nominal: td.nominalTagihan,
								dibayar: td.totalDibayar,
								sisa: td.sisa
							})) || []
						});
					}
				}

				// Tagihan Khusus
				for (const tk of (r.tagihanKhusus || [])) {
					if (tk.sisa > 0) {
						detailTanggungan.push({
							kategori: 'Tagihan Khusus',
							nama: tk.keterangan,
							totalTagihan: tk.nominalTagihan,
							totalDibayar: tk.totalDibayar,
							sisa: tk.sisa,
							tahunAjaran: tk.namaTahunAjaran
						});
					}
				}

				return {
					nomorInduk: r.nomorInduk,
					namaLengkap: r.namaLengkap,
					namaKategori: r.namaKategori || '-',
					isActive: r.isActive,
					totalTagihanKeseluruhan: r.totalTagihanKeseluruhan,
					totalDibayarKeseluruhan: r.totalDibayarKeseluruhan,
					totalBelumTerbayar: r.totalBelumTerbayarKeseluruhan,
					detailTanggungan
				};
			});

		const publicData = {
			type: 'pesantren-public-tanggungan',
			generatedAt: new Date().toISOString(),
			namaPesantren: pengaturan?.namaPesantren || 'Pesantren',
			alamat: pengaturan?.alamat || '',
			logoUrl: pengaturan?.logoUrl || '',
			totalSantri: semuaSantri.length,
			santri: semuaSantri
		};

		// Ensure directory exists
		await mkdir(PUBLIC_DATA_DIR, { recursive: true });

		// Write file
		const filePath = path.join(PUBLIC_DATA_DIR, 'tanggungan.json');
		await writeFile(filePath, JSON.stringify(publicData, null, 2), 'utf-8');

		console.log(`[PublicBackup] Public database saved: ${semuaSantri.length} santri (termasuk yang lunas maupun ada tanggungan).`);
		return { success: true, count: semuaSantri.length };
	} catch (error) {
		console.error('[PublicBackup] Failed to generate public database:', error);
		return { success: false, error: error.message };
	}
}
