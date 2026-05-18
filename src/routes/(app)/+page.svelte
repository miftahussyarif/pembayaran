<script>
	let { data } = $props();

	const formatRupiah = (n) => `Rp ${(n || 0).toLocaleString('id-ID')}`;
	const formatDate = (d) => {
		if (!d) return '-';
		const dt = new Date(d);
		return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
	};

	// Colors for category bars — emerald-first palette
	const catColors = ['#059669','#0d9488','#10b981','#6366f1','#f59e0b','#8b5cf6','#f97316','#ec4899','#ef4444','#14b8a6'];
	const maxKategori = $derived(Math.max(1, ...data.santriPerKategori.map(k => k.jumlah)));
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<!-- Stat Cards -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">

	<!-- Total Santri -->
	<div class="stat-card stat-card-emerald">
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0 flex-1">
				<div class="stat-label">Total Santri Aktif</div>
				<div class="stat-value text-emerald-700">{data.stats.totalSantri}</div>
			</div>
			<div class="stat-icon bg-emerald-100 text-emerald-600">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
			</div>
		</div>
		<div class="stat-desc">Total santri aktif yang tercatat di sistem</div>
		<div class="stat-bar bg-emerald-500"></div>
	</div>

	<!-- Jenis Pembayaran -->
	<div class="stat-card stat-card-teal">
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0 flex-1">
				<div class="stat-label">Jenis Pembayaran</div>
				<div class="stat-value text-teal-700">{data.stats.totalJenisPembayaran}</div>
			</div>
			<div class="stat-icon bg-teal-100 text-teal-600">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
			</div>
		</div>
		<div class="stat-desc">Jenis pembayaran yang tersedia di master data</div>
		<div class="stat-bar bg-teal-500"></div>
	</div>

	<!-- Pemasukan Bulan Ini -->
	<div class="stat-card stat-card-green">
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0 flex-1">
				<div class="stat-label">Pemasukan Bulan Ini</div>
				<div class="stat-value text-green-700 text-lg">Rp {data.stats.pemasukanBulanIni.toLocaleString('id-ID')}</div>
			</div>
			<div class="stat-icon bg-green-100 text-green-600">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			</div>
		</div>
		<div class="stat-desc">Total pemasukan pembayaran tercatat bulan ini</div>
		<div class="stat-bar bg-green-500"></div>
	</div>

	<!-- Total Tunggakan -->
	<div class="stat-card stat-card-rose">
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0 flex-1">
				<div class="stat-label">Total Tunggakan</div>
				<div class="stat-value text-rose-600 text-lg">Rp {(data.stats.totalTunggakan || 0).toLocaleString('id-ID')}</div>
			</div>
			<div class="stat-icon bg-rose-100 text-rose-500">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
			</div>
		</div>
		<div class="stat-desc">Kekurangan tagihan dari rekap individu secara total</div>
		<div class="stat-bar bg-rose-400"></div>
	</div>
</div>

<!-- Tindakan Cepat -->
<div class="mb-7">
	<div class="section-card">
		<div class="section-card-header">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
			<h2 class="font-bold text-gray-800">Tindakan Cepat</h2>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<a href="/transaksi/input" class="quick-btn quick-btn-emerald">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
				Input Pembayaran Baru
			</a>
			<a href="/master/santri?action=tambah" class="quick-btn quick-btn-teal">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
				Tambah Santri Baru
			</a>
			<a href="/transaksi/rekapitulasi" class="quick-btn quick-btn-slate">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
				Cetak Laporan Bulan Ini
			</a>
			<a href="/master/keaktifan-santri" class="quick-btn quick-btn-indigo">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				Keaktifan Santri
			</a>
		</div>
	</div>
</div>

<!-- Charts + Riwayat Terakhir -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
	<!-- Santri per Kategori -->
	<div class="section-card">
		<div class="section-card-header">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
			<h2 class="font-bold text-gray-800">Santri per Kategori</h2>
			<span class="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{data.totalSantriAll} total</span>
		</div>

		{#if data.santriPerKategori.length === 0}
			<div class="text-center py-8 text-gray-400 text-sm">Belum ada data kategori santri.</div>
		{:else}
			<div class="space-y-3">
				{#each data.santriPerKategori as kat, i}
					{@const pct = data.totalSantriAll > 0 ? Math.round((kat.jumlah / data.totalSantriAll) * 100) : 0}
					{@const barWidth = Math.max(4, Math.round((kat.jumlah / maxKategori) * 100))}
					{@const color = catColors[i % catColors.length]}
					<div>
						<div class="flex justify-between items-center mb-1">
							<div class="flex items-center gap-2">
								<div class="w-2.5 h-2.5 rounded-full shrink-0" style="background: {color}"></div>
								<span class="font-semibold text-sm text-gray-700">{kat.nama}</span>
							</div>
							<span class="text-sm font-bold" style="color: {color}">{kat.jumlah} <span class="font-normal text-gray-400 text-xs">({pct}%)</span></span>
						</div>
						<div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
							<div
								class="h-full rounded-full transition-all duration-700"
								style="width: {barWidth}%; background: {color};"
							></div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Riwayat Transaksi Terakhir -->
	<div class="section-card">
		<div class="section-card-header">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			<h2 class="font-bold text-gray-800">Transaksi Terakhir</h2>
		</div>

		{#if data.riwayatTerakhir.length === 0}
			<div class="text-center py-10 text-gray-400 text-sm">Belum ada transaksi.</div>
		{:else}
			<div class="space-y-2">
				{#each data.riwayatTerakhir as r}
					<div class="flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors duration-200 group">
						<div class="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 group-hover:bg-emerald-600 transition-colors"></div>
						<div class="flex-1 min-w-0">
							<div class="flex justify-between items-start gap-2">
								<div class="min-w-0">
									<div class="font-bold text-sm text-gray-800 truncate">{r.nomorKwitansi}</div>
									<div class="text-xs text-gray-500 mt-0.5 truncate">{r.namaSantri || r.namaPembayarLain || 'Tidak diketahui'}</div>
								</div>
								<div class="text-right shrink-0">
									<div class="text-sm font-bold text-emerald-700 whitespace-nowrap">{formatRupiah(r.nominalDibayar)}</div>
									<div class="text-[11px] text-gray-400 font-mono">{formatDate(r.tanggalBayar)}</div>
								</div>
							</div>
							{#if r.keteranganKhusus}
								<div class="text-xs text-amber-600 mt-1 truncate">📌 {r.keteranganKhusus}</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-4 pt-3 border-t border-gray-100 text-center">
				<a href="/transaksi/input" class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
					Lihat Semua
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
				</a>
			</div>
		{/if}
	</div>
</div>

<style>
	/* ── Stat Cards ── */
	.stat-card {
		background: white;
		border-radius: 1rem;
		padding: 1.25rem;
		position: relative;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
		border: 1px solid #f1f5f9;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.stat-card-emerald { border-top: 3px solid #059669; }
	.stat-card-teal    { border-top: 3px solid #0d9488; }
	.stat-card-green   { border-top: 3px solid #16a34a; }
	.stat-card-rose    { border-top: 3px solid #f43f5e; }

	.stat-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		margin-bottom: 0.25rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.stat-value {
		font-size: 1.5rem;
		font-weight: 800;
		line-height: 1.2;
		word-break: break-word;
	}
	.stat-desc {
		font-size: 0.68rem;
		color: #9ca3af;
		line-height: 1.4;
	}
	.stat-icon {
		padding: 0.625rem;
		border-radius: 0.75rem;
		flex-shrink: 0;
	}
	.stat-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		opacity: 0.3;
	}

	/* ── Section Cards ── */
	.section-card {
		background: white;
		border-radius: 1rem;
		padding: 1.25rem 1.5rem;
		box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
		border: 1px solid #f1f5f9;
	}
	.section-card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
		padding-bottom: 0.875rem;
		border-bottom: 1px solid #f1f5f9;
	}

	/* ── Quick Action Buttons ── */
	.quick-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		border-radius: 0.875rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-align: center;
		transition: all 0.2s ease;
		border: 2px solid transparent;
		gap: 0;
	}
	.quick-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
	.quick-btn:active { transform: translateY(0); }

	.quick-btn-emerald {
		background: linear-gradient(135deg, #059669, #047857);
		color: white;
		box-shadow: 0 3px 10px rgba(5,150,105,0.35);
	}
	.quick-btn-emerald:hover { box-shadow: 0 6px 20px rgba(5,150,105,0.4); }

	.quick-btn-teal {
		background: white;
		color: #0d9488;
		border-color: #0d9488;
	}
	.quick-btn-teal:hover { background: #f0fdfa; }

	.quick-btn-slate {
		background: white;
		color: #475569;
		border-color: #cbd5e1;
	}
	.quick-btn-slate:hover { background: #f8fafc; }

	.quick-btn-indigo {
		background: white;
		color: #6366f1;
		border-color: #a5b4fc;
	}
	.quick-btn-indigo:hover { background: #eef2ff; }
</style>
