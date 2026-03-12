<script>
	let { data } = $props();

	const formatRupiah = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');
	const formatTanggal = (t) => t ? new Date(t).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>Rekapitulasi Pembayaran — {data.filterBulan} {data.filterTahun}</title>
	<style>
		@media print {
			@page {
				size: A4 portrait;
				margin: 15mm 12mm;
			}
			body { background: white !important; }
			.no-print { display: none !important; }
			.print-only { display: block !important; }
			.card { box-shadow: none !important; border: 1px solid #ddd !important; }
			table { font-size: 11px !important; }
			thead { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
		}
		.print-only { display: none; }
	</style>
</svelte:head>

<!-- Header dengan kontrol (tersembunyi saat cetak) -->
<div class="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
	<div>
		<h2 class="text-2xl font-bold">Rekapitulasi Pembayaran</h2>
		<p class="text-sm text-base-content/60 mt-1">Rekap transaksi per bulan dan tahun</p>
	</div>
	<button onclick={handlePrint} class="btn btn-primary gap-2">
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
		</svg>
		Cetak Rekap (A4)
	</button>
</div>

<!-- Filter bulan & tahun (tersembunyi saat cetak) -->
<div class="no-print card bg-base-100 shadow-sm border border-base-200 mb-5">
	<div class="card-body py-3 px-4">
		<form method="GET" class="flex flex-wrap gap-3 items-end">
			<div class="form-control">
				<label class="label py-1" for="filterBulan"><span class="label-text text-xs font-medium">Bulan</span></label>
				<select id="filterBulan" name="bulan" class="select select-sm select-bordered">
					<option value="all" selected={data.filterBulan === 'all'}>Semua Bulan</option>
					{#each data.bulanList as b}
						<option value={b} selected={b === data.filterBulan}>{b}</option>
					{/each}
				</select>
			</div>
			<div class="form-control">
				<label class="label py-1" for="filterTahun"><span class="label-text text-xs font-medium">Tahun</span></label>
				<select id="filterTahun" name="tahun" class="select select-sm select-bordered">
					{#each data.tahunList as ta}
						<option value={ta.nama} selected={ta.nama === data.filterTahun}>{ta.nama}</option>
					{/each}
				</select>
			</div>
			<div class="form-control">
				<label class="label py-1" for="filterJenis"><span class="label-text text-xs font-medium">Jenis</span></label>
				<select id="filterJenis" name="jenis" class="select select-sm select-bordered">
					<option value="all" selected={data.filterJenis === 'all'}>Semua Jenis</option>
					{#each data.jenisList as jp}
						<option value={jp.namaPembayaran} selected={jp.namaPembayaran === data.filterJenis}>
							{jp.namaPembayaran}
						</option>
					{/each}
				</select>
			</div>
			<button type="submit" class="btn btn-sm btn-primary">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
				Tampilkan
			</button>
		</form>
	</div>
</div>

<!-- ================================================================
     KONTEN REKAP — tampil di layar & saat print
     ================================================================ -->

<!-- Judul untuk versi cetak -->
<div class="print-only mb-6 text-center border-b-2 border-gray-300 pb-4">
	<h1 class="text-xl font-bold uppercase tracking-widest">Rekapitulasi Pembayaran</h1>
	<p class="text-sm mt-1">Periode: <strong>{data.filterBulan === 'all' ? 'Semua Bulan' : data.filterBulan} {data.filterTahun}</strong></p>
	<p class="text-xs text-gray-500 mt-1">Dicetak pada: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
</div>

<!-- Kartu ringkasan per jenis -->
<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
	<div class="card bg-primary text-primary-content shadow-sm">
		<div class="card-body py-3 px-4">
			<p class="text-xs opacity-80 font-medium">Total Transaksi</p>
			<p class="text-2xl font-bold">{data.rekap.length}</p>
		</div>
	</div>
	<div class="card bg-success text-success-content shadow-sm col-span-1 sm:col-span-3">
		<div class="card-body py-3 px-4">
			<p class="text-xs opacity-80 font-medium">Total Pemasukan</p>
			<p class="text-2xl font-bold">{formatRupiah(data.totalPemasukan)}</p>
		</div>
	</div>
</div>

<!-- Ringkasan per jenis pembayaran -->
{#if data.ringkasanPerJenis.length > 0}
<div class="card bg-base-100 shadow-sm border border-base-200 mb-5">
	<div class="card-body p-4">
		<h3 class="font-bold text-base mb-3">Ringkasan per Jenis Pembayaran</h3>
		<table class="table table-sm w-full">
			<thead>
				<tr class="bg-base-200/60">
					<th>Jenis Pembayaran</th>
					<th class="text-center">Jumlah Transaksi</th>
					<th class="text-right">Total</th>
				</tr>
			</thead>
			<tbody>
				{#each data.ringkasanPerJenis as rj}
					<tr>
						<td class="font-medium">{rj.nama}</td>
						<td class="text-center">{rj.jumlahTransaksi} transaksi</td>
						<td class="text-right font-bold text-success">{formatRupiah(rj.totalNominal)}</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="font-bold border-t-2 border-base-300">
					<td>Total Keseluruhan</td>
					<td class="text-center">{data.rekap.length} transaksi</td>
					<td class="text-right text-success text-base">{formatRupiah(data.totalPemasukan)}</td>
				</tr>
			</tfoot>
		</table>
	</div>
</div>
{/if}

<!-- Detail transaksi lengkap -->
<div class="card bg-base-100 shadow-sm border border-base-200">
	<div class="card-body p-4">
		<div class="flex justify-between items-center mb-3">
			<h3 class="font-bold text-base">Detail Transaksi — {data.filterBulan} {data.filterTahun}</h3>
			<span class="badge badge-outline">{data.rekap.length} data</span>
		</div>
		<div class="overflow-x-auto">
			<table class="table table-sm w-full">
				<thead>
					<tr class="bg-base-200/60">
						<th class="w-8">No</th>
						<th>Tgl Bayar</th>
						<th>No. Kwitansi</th>
						<th>Nama Santri</th>
						<th>No. Induk</th>
						<th>Jenis Pembayaran</th>
						<th>Bulan</th>
						<th class="text-right">Nominal</th>
					</tr>
				</thead>
				<tbody>
					{#if data.rekap.length === 0}
						<tr>
							<td colspan="8" class="text-center py-8 text-base-content/50">
								<div class="flex flex-col items-center gap-2">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
									<span>Tidak ada data untuk <strong>{data.filterBulan} {data.filterTahun}</strong></span>
								</div>
							</td>
						</tr>
					{/if}
					{#each data.rekap as r, i}
						<tr>
							<td class="text-base-content/50">{i + 1}</td>
							<td class="whitespace-nowrap text-sm">{formatTanggal(r.tanggalBayar)}</td>
							<td class="font-mono text-xs text-base-content/60">{r.nomorKwitansi}</td>
							<td class="font-semibold text-sm">{r.namaLengkap || '-'}</td>
							<td class="text-xs text-base-content/60">{r.nomorInduk || '-'}</td>
							<td class="text-sm">{r.namaPembayaran || '-'}</td>
							<td>
								{#if r.bulan}
									<span class="badge badge-outline badge-sm">{r.bulan}</span>
								{:else}
									<span class="text-xs text-base-content/40">-</span>
								{/if}
							</td>
							<td class="text-right font-bold text-sm text-success">{formatRupiah(r.nominalRekap)}</td>
						</tr>
					{/each}
				</tbody>
				{#if data.rekap.length > 0}
					<tfoot>
						<tr class="font-bold bg-base-200/40 border-t-2 border-base-300">
							<td colspan="7" class="text-right py-2">Total Pemasukan:</td>
							<td class="text-right text-success text-base">{formatRupiah(data.totalPemasukan)}</td>
						</tr>
					</tfoot>
				{/if}
			</table>
		</div>
	</div>
</div>

<!-- Footer cetak -->
<div class="print-only mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 flex justify-between">
	<span>Sistem Pembayaran Pesantren</span>
	<span>Periode: {data.filterBulan} {data.filterTahun}</span>
</div>
