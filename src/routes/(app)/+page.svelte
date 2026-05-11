<script>
	let { data } = $props();



	const formatRupiah = (n) => `Rp ${(n || 0).toLocaleString('id-ID')}`;
	const formatDate = (d) => {
		if (!d) return '-';
		const dt = new Date(d);
		return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
	};

	// Colors for category bars
	const catColors = ['#6366f1','#f59e0b','#06b6d4','#ec4899','#10b981','#8b5cf6','#f97316','#14b8a6','#ef4444','#3b82f6'];
	const maxKategori = $derived(Math.max(1, ...data.santriPerKategori.map(k => k.jumlah)));
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body p-6">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0 flex-1">
					<div class="text-base-content/70 text-sm font-semibold mb-1 leading-tight">Total Santri Aktif</div>
					<div class="text-xl md:text-2xl font-bold break-words">{data.stats.totalSantri}</div>
				</div>
				<div class="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
				</div>
			</div>
			<div class="text-[10px] text-base-content/50 mt-2 leading-tight">
				Total santri aktif keseluruhan yang saat ini tercatat di dalam sistem
			</div>
		</div>
	</div>

	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body p-6">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0 flex-1">
					<div class="text-base-content/70 text-sm font-semibold mb-1 leading-tight">Jenis Pembayaran</div>
					<div class="text-xl md:text-2xl font-bold text-info break-words">{data.stats.totalJenisPembayaran}</div>
				</div>
				<div class="p-3 bg-info/10 rounded-xl text-info shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
				</div>
			</div>
			<div class="text-[10px] text-base-content/50 mt-2 leading-tight">
				Total jenis pembayaran yang tersedia dan tercatat pada master data
			</div>
		</div>
	</div>

	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body p-6">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0 flex-1">
					<div class="text-base-content/70 text-sm font-semibold mb-1 leading-tight">Pemasukan Bulan Ini</div>
					<div class="text-xl md:text-2xl font-bold text-success break-words">Rp {data.stats.pemasukanBulanIni.toLocaleString('id-ID')}</div>
				</div>
				<div class="p-3 bg-success/10 rounded-xl text-success shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				</div>
			</div>
			<div class="text-[10px] text-base-content/50 mt-2 leading-tight">
				Total pemasukan pembayaran keseluruhan yang tercatat pada bulan ini
			</div>
		</div>
	</div>

	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body p-6">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0 flex-1">
					<div class="text-base-content/70 text-sm font-semibold mb-1 leading-tight">Total Tunggakan</div>
					<div class="text-xl md:text-2xl font-bold text-error break-words">Rp {(data.stats.totalTunggakan || 0).toLocaleString('id-ID')}</div>
				</div>
				<div class="p-3 bg-error/10 rounded-xl text-error shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
				</div>
			</div>
			<div class="text-[10px] text-base-content/50 mt-2 leading-tight">
				Total tunggakan keseluruhan dari total kekurangan tagihan dari rekap individu secara total yang tercatat
			</div>
		</div>
	</div>
</div>

<div class="mb-8">
	<!-- Tindakan Cepat -->
	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body">
			<h2 class="card-title flex items-center gap-2 mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
				Tindakan Cepat
			</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<a href="/transaksi/input" class="btn btn-primary h-auto py-4">
					<div class="flex flex-col items-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
						Input Pembayaran Baru
					</div>
				</a>
				<a href="/master/santri?action=tambah" class="btn btn-outline btn-accent h-auto py-4">
					<div class="flex flex-col items-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
						Tambah Santri Baru
					</div>
				</a>
				<a href="/transaksi/rekapitulasi" class="btn btn-outline btn-secondary h-auto py-4">
					<div class="flex flex-col items-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
						Cetak Laporan Bulan Ini
					</div>
				</a>
				<a href="/master/keaktifan-santri" class="btn btn-outline btn-info h-auto py-4">
					<div class="flex flex-col items-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						Keaktifan Santri
					</div>
				</a>
			</div>
		</div>
	</div>
</div>

<!-- Charts + Riwayat Terakhir -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
	<!-- Santri per Kategori -->
	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body">
			<h2 class="card-title flex items-center gap-2 mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
				Santri per Kategori
				<span class="badge badge-outline badge-sm font-normal ml-1">{data.totalSantriAll} total</span>
			</h2>

			{#if data.santriPerKategori.length === 0}
				<div class="text-center py-8 text-base-content/50 text-sm">Belum ada data kategori santri.</div>
			{:else}
				<div class="space-y-3">
					{#each data.santriPerKategori as kat, i}
						{@const pct = data.totalSantriAll > 0 ? Math.round((kat.jumlah / data.totalSantriAll) * 100) : 0}
						{@const barWidth = Math.max(4, Math.round((kat.jumlah / maxKategori) * 100))}
						{@const color = catColors[i % catColors.length]}
						<div>
							<div class="flex justify-between items-center mb-1">
								<div class="flex items-center gap-2">
									<div class="w-3 h-3 rounded-full shrink-0" style="background: {color}"></div>
									<span class="font-semibold text-sm">{kat.nama}</span>
								</div>
								<span class="text-sm font-bold" style="color: {color}">{kat.jumlah} <span class="font-normal text-base-content/50 text-xs">({pct}%)</span></span>
							</div>
							<div class="w-full bg-base-200 rounded-full h-3 overflow-hidden">
								<div
									class="h-full rounded-full transition-all duration-500"
									style="width: {barWidth}%; background: {color};"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Riwayat Transaksi Terakhir -->
	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body">
			<h2 class="card-title flex items-center gap-2 mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				Transaksi Terakhir
			</h2>

			{#if data.riwayatTerakhir.length === 0}
				<div class="text-center py-10 text-base-content/50 text-sm">Belum ada transaksi.</div>
			{:else}
				<ul class="steps steps-vertical space-y-3">
					{#each data.riwayatTerakhir as r}
						<li class="step step-primary">
							<div class="text-left py-1 w-full">
								<div class="flex justify-between items-start gap-2">
									<div class="min-w-0">
										<div class="font-bold text-sm truncate">{r.nomorKwitansi}</div>
										<div class="text-xs text-base-content/60 mt-0.5 truncate">{r.namaSantri || r.namaPembayarLain || 'Tidak diketahui'}</div>
									</div>
									<div class="text-right shrink-0">
										<div class="text-sm font-bold text-primary whitespace-nowrap">{formatRupiah(r.nominalDibayar)}</div>
										<div class="text-[11px] text-base-content/50 font-mono">{formatDate(r.tanggalBayar)}</div>
									</div>
								</div>
								{#if r.keteranganKhusus}
									<div class="text-xs text-warning mt-1 truncate">📌 {r.keteranganKhusus}</div>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
				<div class="mt-4 text-center">
					<a href="/transaksi/input" class="btn btn-sm btn-ghost btn-primary">Lihat Semua →</a>
				</div>
			{/if}
		</div>
	</div>
</div>
