<script>
	let { data } = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body p-6">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-base-content/70 font-semibold mb-1">Total Santri Aktif</div>
					<div class="text-3xl font-bold">{data.stats.totalSantri}</div>
				</div>
				<div class="p-3 bg-primary/10 rounded-xl text-primary">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
				</div>
			</div>
		</div>
	</div>

	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body p-6">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-base-content/70 font-semibold mb-1">Jenis Pembayaran</div>
					<div class="text-3xl font-bold text-info">{data.stats.totalJenisPembayaran}</div>
				</div>
				<div class="p-3 bg-info/10 rounded-xl text-info">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
				</div>
			</div>
		</div>
	</div>

	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body p-6">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-base-content/70 font-semibold mb-1">Pemasukan Bulan Ini</div>
					<div class="text-3xl font-bold text-success">Rp {data.stats.pemasukanBulanIni.toLocaleString('id-ID')}</div>
				</div>
				<div class="p-3 bg-success/10 rounded-xl text-success">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				</div>
			</div>
		</div>
	</div>

	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body p-6">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-base-content/70 font-semibold mb-1">Total Tunggakan</div>
					<div class="text-3xl font-bold text-error">Rp {(data.stats.totalTunggakan || 0).toLocaleString('id-ID')}</div>
				</div>
				<div class="p-3 bg-error/10 rounded-xl text-error">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
				</div>
			</div>
			<div class="text-xs text-base-content/50 mt-2">
				{data.tahunAjaranAktif ? `Tunggakan syahriyah TA ${data.tahunAjaranAktif.nama}` : 'Tidak ada TA aktif'}
			</div>
		</div>
	</div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
	<!-- Tindakan Cepat -->
	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body">
			<h2 class="card-title flex items-center gap-2 mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
				Tindakan Cepat
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<a href="/transaksi/input" class="btn btn-primary h-auto py-4">
					<div class="flex flex-col items-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
						Input Pembayaran Baru
					</div>
				</a>
				<a href="/transaksi/rekapitulasi" class="btn btn-outline btn-secondary h-auto py-4">
					<div class="flex flex-col items-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
						Cetak Laporan Bulan Ini
					</div>
				</a>
			</div>
		</div>
	</div>

	<!-- Progress Status -->
	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body">
			<h2 class="card-title flex items-center gap-2 mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
				Progress Pembayaran Syahriyah
				{#if data.tahunAjaranAktif}<span class="badge badge-outline text-xs font-normal ml-1">TA {data.tahunAjaranAktif.nama}</span>{/if}
			</h2>

			{#if !data.tahunAjaranAktif}
				<div class="text-center py-6 text-base-content/50 text-sm">Tidak ada tahun aktif.</div>
			{:else if data.progressBulanan.length === 0}
				<div class="text-center py-6 text-base-content/50 text-sm">Belum ada data pembayaran untuk ditampilkan.</div>
			{:else}
				<div class="space-y-5">
					{#each data.progressBulanan as p}
						<div>
							<div class="flex justify-between mb-1">
								<span class="text-sm font-semibold">{p.bulan} {p.tahun}</span>
								<span class="text-sm font-bold {p.persen === 100 ? 'text-success' : p.persen === 0 ? 'text-error' : 'text-warning'}">{p.persen}%</span>
							</div>
							<progress class="progress w-full {p.persen === 100 ? 'progress-success' : p.persen === 0 ? 'progress-error' : 'progress-warning'}" value={p.persen} max="100"></progress>
							<div class="text-xs text-base-content/60 mt-1">
								{p.sudahBayar} dari {p.totalWajib} santri telah melunasi pembayaran bulan ini.
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
