<script>
	let { data, form } = $props();

	const formatRupiah = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
</script>

<svelte:head>
	<title>Import Tunggakan Khusus</title>
</svelte:head>

<div class="space-y-6">
	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body">
			<h2 class="card-title text-2xl">Import Tunggakan Historis</h2>
			<p class="text-sm text-base-content/70 max-w-3xl">
				Unduh template Excel, lalu isi nominal total tagihan dan nominal sisa tunggakan. Jika ada selisih,
				sistem otomatis membuat transaksi histori lunas dengan tanggal bayar saat import. Template juga mendukung nama pembayar
				yang belum ada di data santri untuk kasus custom/kekurangan tertentu.
			</p>

			<div class="stats stats-vertical lg:stats-horizontal bg-base-200/50 border border-base-200 mt-4">
				<div class="stat">
					<div class="stat-title">Referensi Santri</div>
					<div class="stat-value text-primary">{data.santri.length}</div>
					<div class="stat-desc">Nomor induk siap dipakai</div>
				</div>
				<div class="stat">
					<div class="stat-title">Tahun Ajaran</div>
					<div class="stat-value text-secondary">{data.tahunAjaran.length}</div>
					<div class="stat-desc">Bisa lintas tahun</div>
				</div>
				<div class="stat">
					<div class="stat-title">Jenis Pembayaran</div>
					<div class="stat-value">{data.jenisPembayaran.length}</div>
					<div class="stat-desc">Termasuk custom lain-lain</div>
				</div>
				<div class="stat">
					<div class="stat-title">Kategori Santri</div>
					<div class="stat-value">{data.kategoris.length}</div>
					<div class="stat-desc">Untuk aturan tagihan khusus</div>
				</div>
			</div>
		</div>
	</div>

	{#if form?.type}
		<div class={`alert ${form.type === 'success' ? 'alert-success' : 'alert-error'} shadow-sm`}>
			<span>{form.message}</span>
		</div>
	{/if}

	<div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
		<div class="xl:col-span-2">
			<div class="card bg-base-100 shadow-sm border border-base-200">
				<div class="card-body">
					<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
						<div>
							<h3 class="font-bold text-lg">Upload File Import</h3>
							<p class="text-sm text-base-content/60">Format `.xlsx` disarankan. CSV juga tetap didukung.</p>
						</div>
						<a href="/pengaturan/import-tunggakan/sample.xlsx" class="btn btn-outline btn-primary w-full md:w-auto" target="_blank" rel="noopener">
							Unduh Template Excel
						</a>
					</div>

					<div class="alert alert-info mb-4">
						<span>
							Kolom wajib: `tahun_ajaran`, `nominal_tunggakan`, lalu isi `nomor_induk` atau `nama_pembayar`.
							Untuk tipe bulanan, cukup isi `bulan_mulai_tunggakan`, `tahun_mulai_tunggakan`, dan total `nominal_tunggakan`.
							Gunakan `kategori_santri` bila perlu.
						</span>
					</div>

					<form method="POST" action="?/import" enctype="multipart/form-data">
						<div class="form-control w-full mb-4">
							<label class="label" for="importTunggakanFile"><span class="label-text">File Excel / CSV</span></label>
							<input
								id="importTunggakanFile"
								name="file"
								type="file"
								accept=".csv,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
								class="file-input file-input-bordered w-full"
								required
							/>
							<div class="label py-1">
								<span class="label-text-alt text-base-content/60">
									Import ulang dengan kombinasi data yang sama akan mengganti nominal tunggakan sebelumnya.
								</span>
							</div>
						</div>

						<div class="mockup-code text-xs mb-4">
							<pre data-prefix="1"><code>nomor_induk,nama_santri,kategori_santri,nama_pembayar,tahun_ajaran,jenis_pembayaran,tipe_tagihan,bulan_mulai_tunggakan,tahun_mulai_tunggakan,nominal_total_tagihan,nominal_tunggakan,keterangan,catatan</code></pre>
							<pre data-prefix="2"><code>24001,Ahmad Fauzi,Reguler,,2021/2022,SPP SMK,bulanan,Mei,2022,,200000,,Cukup isi bulan pertama belum bayar</code></pre>
							<pre data-prefix="3"><code>24001,Ahmad Fauzi,Reguler,,2022/2023,Pengembangan,sekali,,,1000000,500000,,Separuh sudah dibayar</code></pre>
							<pre data-prefix="4"><code>24002,Aisyah Yatim,Yatim,,2022/2023,SPP SMP,smp_bulanan,Juli,2022,120000,120000,,Agar tagihan ikut aturan kategori</code></pre>
						</div>

						<div class="flex justify-end">
							<button type="submit" class="btn btn-primary">Import Tunggakan</button>
						</div>
					</form>
				</div>
			</div>
		</div>

		<div class="card bg-base-100 shadow-sm border border-base-200">
			<div class="card-body">
				<h3 class="font-bold text-lg">Petunjuk Singkat</h3>
				<ul class="list-disc list-inside text-sm text-base-content/70 space-y-2">
					<li>Gunakan nomor induk yang sudah ada di master santri.</li>
					<li>`jenis_pembayaran` bisa memakai nama jenis atau dikosongkan jika tagihan custom.</li>
					<li>`kategori_santri` atau `kategori_id` bisa diisi agar status seperti `Yatim` langsung terbaca oleh aturan pengecualian pembayaran.</li>
					<li>`tipe_tagihan` boleh dikosongkan, sistem akan mencoba membaca dari master jenis pembayaran.</li>
					<li>Untuk tagihan bulanan, sistem membuat urutan bulan tunggakan mulai dari `bulan_mulai_tunggakan` sesuai total `nominal_tunggakan` dan nominal per bulan yang berlaku.</li>
					<li>Jika total tunggakan bulanan bukan kelipatan nominal bulanan yang berlaku, baris akan ditolak agar data tetap rapi.</li>
					<li>Jika `nomor_induk` diisi dan belum ada, sistem otomatis membuat data santri baru memakai `nomor_induk` dan `nama_santri` dari Excel.</li>
					<li>Jika kategori diisi, sistem akan memasangnya ke data santri baru atau memperbarui kategori santri yang sudah ada.</li>
					<li>Baris yang bertentangan dengan aturan kategori, misalnya jenis pembayaran gratis untuk kategori tertentu, tidak akan diimport.</li>
					<li>Tanggal masuk pondok otomatis diisi `1 Juli` pada tahun ajaran paling awal yang muncul di tunggakan, selama data santri belum punya tanggal masuk.</li>
					<li>Jika ada tagihan `smp_*` atau `smk_*`, sistem otomatis membuat data siswa SMP/SMK mulai Juli tahun pertama dan selesai 36 bulan kemudian, selama record SMP/SMK belum ada.</li>
					<li>Jika `nominal_total_tagihan` lebih besar dari `nominal_tunggakan`, selisihnya otomatis dibuat transaksi histori dengan kwitansi import.</li>
					<li>Tagihan bulanan otomatis ikut dihitung sebagai sisa saat input pembayaran.</li>
					<li>Tagihan custom akan muncul sebagai referensi di mode pembayaran lain-lain.</li>
					<li>Nama yang belum ada di master santri bisa diisi lewat `nama_pembayar`, tetapi saat ini dipakai untuk tagihan custom.</li>
				</ul>
			</div>
		</div>
	</div>

	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body">
			<div class="flex items-center justify-between gap-3 mb-4">
				<div>
					<h3 class="font-bold text-lg">Tunggakan Terakhir Diimport</h3>
					<p class="text-sm text-base-content/60">Menampilkan 100 baris terbaru.</p>
				</div>
				<div class="badge badge-outline">{data.imports.length} baris</div>
			</div>

			<div class="overflow-x-auto">
				<table class="table table-zebra table-sm">
					<thead>
						<tr>
							<th>No Induk</th>
							<th>Nama</th>
							<th>Tahun</th>
							<th>Jenis</th>
							<th>Periode</th>
							<th class="text-right">Total</th>
							<th>Keterangan</th>
							<th class="text-right">Sisa</th>
						</tr>
					</thead>
					<tbody>
						{#if data.imports.length === 0}
							<tr>
								<td colspan="8" class="text-center py-6 text-base-content/60">Belum ada data tunggakan impor.</td>
							</tr>
						{/if}
						{#each data.imports as item}
							<tr>
								<td class="font-mono text-xs">{item.nomorInduk}</td>
								<td class="font-medium">{item.namaSantri || item.namaPembayar || '-'}</td>
								<td>{item.namaTahun}</td>
								<td>{item.namaJenis}</td>
								<td>{item.bulan ? `${item.bulan} ${item.tahunTagihan}` : item.namaTahun}</td>
								<td class="text-right">{formatRupiah(item.nominalAsalTagihan ?? item.nominalTagihan)}</td>
								<td>{item.keteranganKhusus || '-'}</td>
								<td class="text-right font-semibold">{formatRupiah(item.nominalTagihan)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
