<script>
	let { data } = $props();

	const formatRupiah = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');
	const formatTanggal = (t) => t ? new Date(t).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
	
	let searchSantri = $state('');
	let filteredSantri = $derived.by(() => {
		const q = searchSantri.trim().toLowerCase();
		if (!q) return data.santriList;
		return data.santriList.filter((s) => {
			const nama = (s.namaLengkap || '').toLowerCase();
			const induk = (s.nomorInduk || '').toLowerCase();
			return nama.includes(q) || induk.includes(q);
		});
	});

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>Rekapitulasi Individu</title>
	<style>
		@media print {
			@page {
				size: A4 portrait;
				margin: 12mm;
			}
			html, body { background: white !important; height: auto !important; }
			.drawer, .drawer-content, main { overflow: visible !important; height: auto !important; }
			.no-print { display: none !important; }
			.print-card { break-inside: auto; page-break-inside: auto; }
			.card { box-shadow: none !important; border: 1px solid #ddd !important; }
			table { font-size: 11px !important; width: 100% !important; }
			thead { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; display: table-header-group; }
			tfoot { display: table-footer-group; }
			.main-print { max-width: 100% !important; }
			tr, td, th { break-inside: avoid; page-break-inside: avoid; }
			.card-body { overflow: visible !important; }
		}
	</style>
</svelte:head>

<div class="flex flex-col gap-4 mb-6 no-print">
	<h2 class="text-2xl font-bold">Rekapitulasi Individu</h2>
	<p class="text-sm text-base-content/60">Rekap tagihan syahriyah per bulan dan pembayaran tahunan/insidental untuk setiap santri.</p>
</div>

<div class="no-print card bg-base-100 shadow-sm border border-base-200 mb-6">
	<div class="card-body py-3 px-4">
		<form method="GET" class="flex flex-wrap gap-3 items-end">
			<div class="form-control">
				<label class="label py-1" for="filterSantri"><span class="label-text text-xs font-medium">Santri</span></label>
				<input
					type="text"
					class="input input-sm input-bordered mb-2"
					placeholder="Ketik nama atau NIS..."
					bind:value={searchSantri}
				/>
				<select id="filterSantri" name="santriId" class="select select-sm select-bordered">
					<option value="" disabled selected={data.filterSantriId === ''}>Pilih Santri...</option>
					{#each filteredSantri as s}
						<option value={s.id} selected={String(s.id) === data.filterSantriId}>
							{s.nomorInduk} - {s.namaLengkap}
						</option>
					{/each}
				</select>
			</div>
			<div class="form-control">
				<label class="label py-1" for="filterLevel"><span class="label-text text-xs font-medium">Filter</span></label>
				<select id="filterLevel" name="level" class="select select-sm select-bordered">
					<option value="all" selected={data.filterLevel === 'all'}>Semua</option>
					<option value="smp" selected={data.filterLevel === 'smp'}>Hanya SMP</option>
					<option value="smk" selected={data.filterLevel === 'smk'}>Hanya SMK</option>
				</select>
			</div>
			<button type="submit" class="btn btn-sm btn-primary">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
				Tampilkan
			</button>
			<button type="button" class="btn btn-sm btn-outline" onclick={handlePrint}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
				Cetak A4
			</button>
		</form>
	</div>
</div>

<div class="flex flex-col gap-6 main-print">
	{#if data.rekapIndividu.length === 0}
		<div class="card bg-base-100 shadow-sm border border-base-200">
			<div class="card-body text-base-content/60 text-sm">
				Pilih santri untuk menampilkan rekap individu.
			</div>
		</div>
	{:else}
		{#each data.rekapIndividu as s}
			<div class="card bg-base-100 shadow-sm border border-base-200 print-card">
			<div class="card-body">
				<div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
					<div>
						<div class="text-lg font-bold">{s.namaLengkap}</div>
						<div class="text-sm text-base-content/60">No. Induk: {s.nomorInduk}</div>
						<div class="text-sm text-base-content/60">Kategori: {s.namaKategori || '-'}</div>
						<div class="text-xs text-base-content/50 mt-1">Masuk: {formatTanggal(s.tanggalMasuk)} · Keluar: {s.tanggalKeluar ? formatTanggal(s.tanggalKeluar) : 'Belum keluar'}</div>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
						<div class="text-left">
							<div class="text-sm text-base-content/60">Tagihan Konsumsi</div>
							<div class="text-base font-semibold">{formatRupiah(s.totalTagihanKonsumsi)}</div>
							<div class="text-sm text-success">Dibayar: {formatRupiah(s.totalDibayarKonsumsi)}</div>
							<div class="text-sm text-error">Sisa: {formatRupiah(Math.max(0, (s.totalTagihanKonsumsi || 0) - (s.totalDibayarKonsumsi || 0)))}</div>
						</div>
						<div class="text-left">
							<div class="text-sm text-base-content/60">Tagihan Lain</div>
							<div class="text-base font-semibold">{formatRupiah(s.totalTagihanLain)}</div>
							<div class="text-sm text-success">Dibayar: {formatRupiah(s.totalDibayarLain)}</div>
							<div class="text-sm text-error">Sisa: {formatRupiah(s.totalSisaLain)}</div>
						</div>
						<div class="text-right">
							<div class="text-sm text-base-content/60">Tagihan Syahriyah</div>
							<div class="text-base font-semibold">{formatRupiah(s.totalTagihanSyahriyah)}</div>
							<div class="text-sm text-success">Dibayar: {formatRupiah(s.totalDibayarSyahriyah)}</div>
							<div class="text-sm text-error">Sisa: {formatRupiah(Math.max(0, (s.totalTagihanSyahriyah || 0) - (s.totalDibayarSyahriyah || 0)))}</div>
						</div>
					</div>
				</div>

				<!-- Syahriyah Bulanan -->
				{#if s.nominalSyahriyah !== 0}
					<div class="mb-6">
						<div class="flex items-center justify-between mb-2">
							<h3 class="font-semibold">Syahriyah Bulanan</h3>
							<span class="badge badge-outline">{s.syahriyah.length} bulan</span>
						</div>
						<div class="overflow-x-auto">
							<table class="table table-sm w-full">
								<thead>
									<tr class="bg-base-200/60">
										<th>Bulan</th>
										<th class="text-right">Tagihan</th>
										<th class="text-right">Dibayar</th>
										<th>Tgl Bayar</th>
										<th>No. Kwitansi</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{#if s.syahriyah.length === 0}
										<tr>
											<td colspan="4" class="text-center text-base-content/50 py-4">Belum ada periode syahriyah.</td>
										</tr>
									{:else}
										{#each s.syahriyah as m}
											<tr>
												<td>{m.bulan} {m.tahun}</td>
												<td class="text-right">{formatRupiah(m.nominalTagihan)}</td>
												<td class="text-right">{formatRupiah(m.nominalDibayar)}</td>
												<td class="text-xs text-base-content/70">{formatTanggal(m.tanggalBayar)}</td>
												<td class="text-xs font-mono">{m.nomorKwitansi || '-'}</td>
												<td>
													{#if m.paid}
														<span class="badge badge-success badge-sm">Lunas</span>
													{:else}
														<span class="badge badge-outline badge-sm">Belum</span>
													{/if}
												</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
					</div>
				{/if}
				<!-- Konsumsi Bulanan -->
				{#if s.nominalKonsumsi !== 0}
					<div class="mb-6">
						<div class="flex items-center justify-between mb-2">
							<h3 class="font-semibold">Konsumsi Bulanan</h3>
							<span class="badge badge-outline">{s.konsumsi.length} bulan</span>
						</div>
						<div class="overflow-x-auto">
							<table class="table table-sm w-full">
								<thead>
									<tr class="bg-base-200/60">
										<th>Bulan</th>
										<th class="text-right">Tagihan</th>
										<th class="text-right">Dibayar</th>
										<th>Tgl Bayar</th>
										<th>No. Kwitansi</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{#if s.konsumsi.length === 0}
										<tr>
											<td colspan="4" class="text-center text-base-content/50 py-4">Belum ada periode konsumsi.</td>
										</tr>
									{:else}
										{#each s.konsumsi as m}
											<tr>
												<td>{m.bulan} {m.tahun}</td>
												<td class="text-right">{formatRupiah(m.nominalTagihan)}</td>
												<td class="text-right">{formatRupiah(m.nominalDibayar)}</td>
												<td class="text-xs text-base-content/70">{formatTanggal(m.tanggalBayar)}</td>
												<td class="text-xs font-mono">{m.nomorKwitansi || '-'}</td>
												<td>
													{#if m.paid}
														<span class="badge badge-success badge-sm">Lunas</span>
													{:else}
														<span class="badge badge-outline badge-sm">Belum</span>
													{/if}
												</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
					</div>
				{/if}

				<!-- SMK Bulanan -->
				{#if s.smkBulanan && s.smkBulanan.length > 0}
					<div class="mb-6">
						<div class="flex items-center justify-between mb-2">
							<h3 class="font-semibold">Pembayaran SMK Bulanan</h3>
							<span class="badge badge-outline">{s.smkBulanan.length} bulan</span>
						</div>
						<div class="overflow-x-auto">
							<table class="table table-sm w-full">
								<thead>
									<tr class="bg-base-200/60">
										<th>Bulan</th>
										<th class="text-right">Tagihan</th>
										<th class="text-right">Dibayar</th>
										<th>Tgl Bayar</th>
										<th>No. Kwitansi</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{#if s.smkBulanan.length === 0}
										<tr>
											<td colspan="4" class="text-center text-base-content/50 py-4">Belum ada periode SMK bulanan.</td>
										</tr>
									{:else}
										{#each s.smkBulanan as m}
											<tr>
												<td>{m.bulan} {m.tahun}</td>
												<td class="text-right">{formatRupiah(m.nominalTagihan)}</td>
												<td class="text-right">{formatRupiah(m.nominalDibayar)}</td>
												<td class="text-xs text-base-content/70">{formatTanggal(m.tanggalBayar)}</td>
												<td class="text-xs font-mono">{m.nomorKwitansi || '-'}</td>
												<td>
													{#if m.paid}
														<span class="badge badge-success badge-sm">Lunas</span>
													{:else}
														<span class="badge badge-outline badge-sm">Belum</span>
													{/if}
												</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
						<div class="flex justify-end gap-6 mt-2 text-sm">
							<div>Tagihan: <strong>{formatRupiah(s.totalTagihanSmkBulanan)}</strong></div>
							<div>Dibayar: <strong class="text-success">{formatRupiah(s.totalDibayarSmkBulanan)}</strong></div>
							<div>Sisa: <strong class="text-error">{formatRupiah(Math.max(0, (s.totalTagihanSmkBulanan || 0) - (s.totalDibayarSmkBulanan || 0)))}</strong></div>
						</div>
					</div>
				{/if}

				<!-- SMP Bulanan -->
				{#if s.smpBulanan && s.smpBulanan.length > 0}
					<div class="mb-6">
						<div class="flex items-center justify-between mb-2">
							<h3 class="font-semibold">Pembayaran SMP Bulanan</h3>
							<span class="badge badge-outline">{s.smpBulanan.length} bulan</span>
						</div>
						<div class="overflow-x-auto">
							<table class="table table-sm w-full">
								<thead>
									<tr class="bg-base-200/60">
										<th>Bulan</th>
										<th class="text-right">Tagihan</th>
										<th class="text-right">Dibayar</th>
										<th>Tgl Bayar</th>
										<th>No. Kwitansi</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{#if s.smpBulanan.length === 0}
										<tr>
											<td colspan="4" class="text-center text-base-content/50 py-4">Belum ada periode SMP bulanan.</td>
										</tr>
									{:else}
										{#each s.smpBulanan as m}
											<tr>
												<td>{m.bulan} {m.tahun}</td>
												<td class="text-right">{formatRupiah(m.nominalTagihan)}</td>
												<td class="text-right">{formatRupiah(m.nominalDibayar)}</td>
												<td class="text-xs text-base-content/70">{formatTanggal(m.tanggalBayar)}</td>
												<td class="text-xs font-mono">{m.nomorKwitansi || '-'}</td>
												<td>
													{#if m.paid}
														<span class="badge badge-success badge-sm">Lunas</span>
													{:else}
														<span class="badge badge-outline badge-sm">Belum</span>
													{/if}
												</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
						<div class="flex justify-end gap-6 mt-2 text-sm">
							<div>Tagihan: <strong>{formatRupiah(s.totalTagihanSmpBulanan)}</strong></div>
							<div>Dibayar: <strong class="text-success">{formatRupiah(s.totalDibayarSmpBulanan)}</strong></div>
							<div>Sisa: <strong class="text-error">{formatRupiah(Math.max(0, (s.totalTagihanSmpBulanan || 0) - (s.totalDibayarSmpBulanan || 0)))}</strong></div>
						</div>
					</div>
				{/if}

				<!-- Pembayaran Tahunan & Insidental -->
				<div>
					<div class="flex items-center justify-between mb-2">
						<h3 class="font-semibold">Pembayaran Tahunan & Insidental</h3>
						<span class="badge badge-outline">{s.pembayaranLain.length} jenis</span>
					</div>
					<div class="overflow-x-auto">
						<table class="table table-sm w-full">
							<thead>
								<tr class="bg-base-200/60">
									<th>Jenis</th>
									<th>Tipe</th>
									<th class="text-center">Transaksi</th>
									<th class="text-right">Tagihan</th>
									<th class="text-right">Dibayar</th>
									<th class="text-right">Sisa</th>
									<th class="text-right">Terakhir Bayar</th>
								</tr>
							</thead>
							<tbody>
								{#if s.pembayaranLain.length === 0}
									<tr>
										<td colspan="6" class="text-center text-base-content/50 py-4">Tidak ada jenis pembayaran non-bulanan.</td>
									</tr>
								{:else}
									{#each s.pembayaranLain as p}
										<tr>
											<td>{p.namaPembayaran || '-'}</td>
											<td class="text-xs text-base-content/60">{p.tipe || '-'}</td>
											<td class="text-center">{p.jumlahTransaksi}</td>
											<td class="text-right">{formatRupiah(p.totalTagihan)}</td>
											<td class="text-right font-semibold">{formatRupiah(p.totalNominal)}</td>
											<td class="text-right text-error">{formatRupiah(p.sisa)}</td>
											<td class="text-right text-xs text-base-content/60">{formatTanggal(p.terakhirBayar)}</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>
				</div>
			</div>
			</div>
		{/each}
	{/if}
</div>
