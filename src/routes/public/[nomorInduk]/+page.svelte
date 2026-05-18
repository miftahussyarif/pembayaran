<script>
	let { data } = $props();
	
	const santri = $derived(data.santri);
	const namaPesantren = $derived(data.namaPesantren);
	const logoUrl = $derived(data.profilPesantren?.logoUrl || '');
	const generatedAt = $derived(data.generatedAt);

	function formatRupiah(num) {
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
	}

	function getInitials(name) {
		return (name || 'S').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
	}

	// Generate a consistent color based on name
	function getAvatarColor(name) {
		let hash = 0;
		for (let i = 0; i < (name || '').length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		const h = Math.abs(hash) % 360;
		return `hsl(${h}, 65%, 55%)`;
	}

	// Group tanggungan by category
	const groupedTanggungan = $derived.by(() => {
		const groups = {};
		for (const item of (santri?.detailTanggungan || [])) {
			if (!groups[item.kategori]) {
				groups[item.kategori] = [];
			}
			groups[item.kategori].push(item);
		}
		return groups;
	});

	const kategoriIcons = {
		'Bulanan Pondok': '📅',
		'SMK Bulanan': '🏫',
		'SMP Bulanan': '🏫',
		'Tahunan': '📆',
		'Sekali Bayar': '💳',
		'Tagihan Khusus': '📋'
	};

	const percentPaid = $derived.by(() => {
		if (!santri?.totalTagihanKeseluruhan) return 0;
		return Math.round((santri.totalDibayarKeseluruhan / santri.totalTagihanKeseluruhan) * 100);
	});
</script>

<svelte:head>
	<title>{santri?.namaLengkap || 'Santri'} - Tanggungan | {namaPesantren}</title>
	<meta name="description" content="Detail tanggungan pembayaran santri {santri?.namaLengkap}" />
</svelte:head>

<!-- GitHub-style Profile Header -->
<div class="relative">
	<!-- Cover/Banner gradient -->
	<div class="h-44 md:h-56 bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-700 relative overflow-hidden">
		<!-- Pattern overlay -->
		<div class="absolute inset-0 opacity-10">
			<svg width="100%" height="100%">
				<defs>
					<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
						<path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="0.5"/>
					</pattern>
				</defs>
				<rect width="100%" height="100%" fill="url(#grid)" />
			</svg>
		</div>
		<!-- Floating elements -->
		<div class="absolute top-4 right-8 w-32 h-32 rounded-full bg-white/5 blur-xl"></div>
		<div class="absolute bottom-4 left-12 w-24 h-24 rounded-full bg-white/5 blur-xl"></div>
		
		<!-- Back button -->
		<a href="/public" class="absolute top-4 left-4 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm hover:bg-white/20 transition-all duration-300">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
			</svg>
			Kembali
		</a>

		<!-- Pesantren name on header -->
		<div class="absolute top-4 right-4 z-10 flex items-center gap-2">
			{#if logoUrl}
				<img src={logoUrl} alt="" class="w-8 h-8 rounded-full bg-white/20 object-contain" />
			{/if}
			<span class="text-white/70 text-sm font-medium hidden md:inline">{namaPesantren}</span>
		</div>
	</div>

	<!-- Profile section -->
	<div class="max-w-4xl mx-auto px-4 md:px-6">
		<div class="relative -mt-16 md:-mt-20 flex flex-col md:flex-row md:items-stretch gap-4 md:gap-6 pb-6">
			<!-- Avatar -->
			<div class="shrink-0">
				<div 
					class="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 border-white shadow-2xl flex items-center justify-center text-white font-bold text-3xl md:text-4xl"
					style="background: {getAvatarColor(santri?.namaLengkap)};"
				>
					{getInitials(santri?.namaLengkap)}
				</div>
			</div>

			<!-- Info -->
			<div class="flex-1 flex flex-col justify-between py-2 md:pt-5 md:pb-3">
				<h1 class="text-2xl md:text-3xl font-extrabold text-gray-900 md:text-white tracking-tight drop-shadow-sm">{santri?.namaLengkap}</h1>
				<div class="flex flex-wrap items-center gap-3 mt-3 md:mt-0">
					<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
						</svg>
						{santri?.nomorInduk}
					</span>
					<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						{santri?.namaKategori}
					</span>
					{#if santri?.isActive}
						<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
							<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
							Aktif
						</span>
					{:else}
						<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
							<span class="w-2 h-2 rounded-full bg-red-500"></span>
							Non-Aktif
						</span>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Stats Cards -->
<div class="bg-gray-50 border-y border-gray-200">
	<div class="max-w-4xl mx-auto px-4 md:px-6 py-6">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Total Tagihan -->
			<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
				<div class="flex items-center gap-3 mb-3">
					<div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
						</svg>
					</div>
					<span class="text-sm text-gray-500 font-medium">Total Tagihan</span>
				</div>
				<p class="text-xl font-bold text-gray-800">{formatRupiah(santri?.totalTagihanKeseluruhan)}</p>
			</div>

			<!-- Total Dibayar -->
			<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
				<div class="flex items-center gap-3 mb-3">
					<div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<span class="text-sm text-gray-500 font-medium">Total Terbayar</span>
				</div>
				<p class="text-xl font-bold text-green-600">{formatRupiah(santri?.totalDibayarKeseluruhan)}</p>
			</div>

			<!-- Sisa Tanggungan (highlighted) -->
			<div class="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg p-5 text-white relative overflow-hidden">
				<div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8"></div>
				<div class="relative z-10">
					<div class="flex items-center gap-3 mb-3">
						<div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<span class="text-sm text-white/80 font-medium">Sisa Tanggungan</span>
					</div>
					<p class="text-2xl font-extrabold">{formatRupiah(santri?.totalBelumTerbayar)}</p>
				</div>
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm text-gray-600 font-medium">Progress Pembayaran</span>
				<span class="text-sm font-bold text-emerald-600">{percentPaid}%</span>
			</div>
			<div class="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
				<div 
					class="h-full rounded-full transition-all duration-1000 ease-out"
					class:bg-gradient-to-r={true}
					class:from-emerald-500={percentPaid >= 50}
					class:to-teal-500={percentPaid >= 50}
					class:from-amber-500={percentPaid >= 25 && percentPaid < 50}
					class:to-orange-500={percentPaid >= 25 && percentPaid < 50}
					class:from-red-500={percentPaid < 25}
					class:to-rose-500={percentPaid < 25}
					style="width: {Math.min(percentPaid, 100)}%"
				></div>
			</div>
		</div>
	</div>
</div>

<!-- Detail Tanggungan Section -->
<div class="max-w-4xl mx-auto px-4 md:px-6 py-8">
	<h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
		<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
		</svg>
		Detail Tanggungan Belum Dibayar
	</h2>

	{#if Object.keys(groupedTanggungan).length === 0}
		<div class="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
			<div class="w-20 h-20 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold text-gray-800">Tidak Ada Tanggungan</h3>
			<p class="text-sm text-gray-500 mt-1">Seluruh pembayaran telah diselesaikan. Terima kasih!</p>
		</div>
	{:else}
		<div class="space-y-6">
			{#each Object.entries(groupedTanggungan) as [kategori, items]}
				<div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
					<!-- Category Header -->
					<div class="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
						<span class="text-xl">{kategoriIcons[kategori] || '📄'}</span>
						<div>
							<h3 class="font-semibold text-gray-800">{kategori}</h3>
							<p class="text-xs text-gray-500">{items.length} jenis tanggungan</p>
						</div>
						<div class="ml-auto">
							<span class="px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-bold">
								{formatRupiah(items.reduce((sum, i) => sum + (i.sisa || 0), 0))}
							</span>
						</div>
					</div>

					<!-- Items -->
					<div class="divide-y divide-gray-50">
						{#each items as item}
							<div class="p-5 hover:bg-gray-50/50 transition-colors">
								<div class="flex items-start justify-between gap-4 mb-3">
									<div>
										<h4 class="font-semibold text-gray-800">{item.nama}</h4>
										{#if item.tahunAjaran}
											<span class="text-xs text-gray-400">Tahun Ajaran: {item.tahunAjaran}</span>
										{/if}
									</div>
									<div class="text-right shrink-0">
										<p class="text-lg font-bold text-red-600">{formatRupiah(item.sisa)}</p>
										<p class="text-xs text-gray-400">sisa tanggungan</p>
									</div>
								</div>

								<!-- Mini stats -->
								<div class="grid grid-cols-2 gap-3 mb-3">
									<div class="px-3 py-2 rounded-lg bg-blue-50/60">
										<p class="text-[10px] text-blue-500 font-medium uppercase tracking-wide">Tagihan</p>
										<p class="text-sm font-semibold text-blue-700">{formatRupiah(item.totalTagihan)}</p>
									</div>
									<div class="px-3 py-2 rounded-lg bg-green-50/60">
										<p class="text-[10px] text-green-500 font-medium uppercase tracking-wide">Terbayar</p>
										<p class="text-sm font-semibold text-green-700">{formatRupiah(item.totalDibayar)}</p>
									</div>
								</div>

								<!-- Unpaid months (for monthly payments) -->
								{#if item.unpaidMonths?.length > 0}
									<div class="mt-3 pt-3 border-t border-gray-100">
										<p class="text-xs text-gray-500 font-medium mb-2">Bulan yang belum dibayar:</p>
										<div class="flex flex-wrap gap-1.5">
											{#each item.unpaidMonths as month}
												<span class="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium border border-red-100">
													{month.bulan} {month.tahun}
													<span class="ml-1 text-red-400">({formatRupiah(month.nominal)})</span>
												</span>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Tahun details (for annual payments) -->
								{#if item.tahunDetails?.length > 0}
									<div class="mt-3 pt-3 border-t border-gray-100">
										<p class="text-xs text-gray-500 font-medium mb-2">Detail per Tahun Ajaran:</p>
										<div class="space-y-1.5">
											{#each item.tahunDetails as td}
												<div class="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm">
													<span class="text-gray-700 font-medium">{td.tahun}</span>
													<div class="flex items-center gap-3 text-xs">
														<span class="text-gray-400">Tagihan: {formatRupiah(td.nominal)}</span>
														<span class="text-green-600">Bayar: {formatRupiah(td.dibayar)}</span>
														<span class="font-bold text-red-600">Sisa: {formatRupiah(td.sisa)}</span>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Data Info -->
	{#if generatedAt}
		<div class="mt-8 text-center">
			<p class="text-xs text-gray-400">
				Data diperbarui pada: {new Date(generatedAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
			</p>
			<p class="text-[10px] text-gray-300 mt-1">Data akan diperbarui secara otomatis setiap hari</p>
		</div>
	{/if}
</div>

<!-- Footer -->
<footer class="bg-gray-900 text-white/60 py-8 px-4 mt-8">
	<div class="max-w-4xl mx-auto text-center">
		<p class="text-sm">&copy; {new Date().getFullYear()} {namaPesantren}. Seluruh hak dilindungi.</p>
		<p class="text-xs mt-1 text-white/30">Sistem Informasi Pembayaran Pesantren</p>
	</div>
</footer>
