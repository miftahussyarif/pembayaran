<script>
	import { goto } from '$app/navigation';

	let { data } = $props();

	const formatRupiah = (n) => "Rp " + (n || 0).toLocaleString("id-ID");
	const formatTanggal = (t) =>
		t
			? new Date(t).toLocaleDateString("id-ID", {
					day: "2-digit",
					month: "short",
					year: "numeric",
				})
			: "-";

	const HARI_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
	const cetakWaktu = $derived.by(() => {
		const now = new Date();
		const hari = HARI_NAMES[now.getDay()];
		const tanggal = now.toLocaleDateString("id-ID", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
		return `${hari}, ${tanggal}`;
	});

	let santriSearch = $state("");
	let selectedSantriId = $state(data.filterSantriId || "");
	let selectedLevel = $state(data.filterLevel || "all");

	// Combobox state
	let santriDropdownOpen = $state(false);
	let santriHighlightIndex = $state(-1);
	let santriComboboxRef = $state(null);
	let santriInputRef = $state(null);

	let selectedSantri = $derived(data.santriList.find(s => String(s.id) === selectedSantriId) || null);

	let filteredSantris = $derived.by(() => {
		const q = santriSearch.trim().toLowerCase();
		let list = data.santriList;
		if (q) {
			list = data.santriList.filter((s) => {
				const nama = (s.namaLengkap || "").toLowerCase();
				const induk = (s.nomorInduk || "").toLowerCase();
				return nama.includes(q) || induk.includes(q);
			});
		}
		if (selectedSantriId && !list.some((s) => String(s.id) === selectedSantriId)) {
			const selected = data.santriList.find((s) => String(s.id) === selectedSantriId);
			if (selected) list = [selected, ...list];
		}
		return list;
	});

	function handleSubmit() {
		const params = new URLSearchParams();
		if (selectedSantriId) params.set('santriId', selectedSantriId);
		if (selectedLevel && selectedLevel !== 'all') params.set('level', selectedLevel);
		goto(`?${params.toString()}`);
	}

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
			html,
			body {
				background: white !important;
				height: auto !important;
			}
			.drawer,
			.drawer-content,
			main {
				overflow: visible !important;
				height: auto !important;
			}
			.no-print,
			.drawer-side,
			.navbar,
			footer {
				display: none !important;
			}
			.print-card {
				break-inside: auto;
				page-break-inside: auto;
			}
			.card {
				box-shadow: none !important;
				border: 1px solid #ddd !important;
			}
			table {
				font-size: 11px !important;
				width: 100% !important;
			}
			thead {
				background: #f0f0f0 !important;
				-webkit-print-color-adjust: exact;
				display: table-header-group;
			}
			tfoot {
				display: table-footer-group;
			}
			.main-print {
				max-width: 100% !important;
			}
			tr,
			td,
			th {
				break-inside: avoid;
				page-break-inside: avoid;
			}
			.card-body {
				overflow: visible !important;
			}
			.print-meta {
				display: block !important;
			}
		}
	</style>
</svelte:head>

<div class="flex flex-col gap-4 mb-6 no-print">
	<h2 class="text-2xl font-bold">Rekapitulasi Individu</h2>
	<p class="text-sm text-base-content/60">
		Rekap tagihan per bulan dan pembayaran tahunan/insidental untuk setiap
		santri.
	</p>
</div>

<div class="no-print card bg-base-100 shadow-sm border border-base-200 mb-6">
	<div class="card-body py-3 px-4">
		<div class="flex flex-wrap gap-3 items-end">
			<div class="form-control w-full sm:w-72">
				<label class="label py-1" for="santriSearchRekap"><span class="label-text text-xs font-medium">Santri</span></label>
				<!-- svelte-ignore a11y_role_has_required_aria_attrs -->
				<div
					class="relative"
					bind:this={santriComboboxRef}
					role="combobox"
					onfocusout={(e) => {
						setTimeout(() => {
							if (santriComboboxRef && !santriComboboxRef.contains(document.activeElement)) {
								santriDropdownOpen = false;
							}
						}, 150);
					}}
				>
					{#if selectedSantriId && selectedSantri && !santriDropdownOpen}
						<div
							class="input input-sm input-bordered w-full flex items-center gap-2 cursor-pointer bg-base-100 pr-2"
							role="button"
							tabindex="0"
							onclick={() => {
								santriDropdownOpen = true;
								santriSearch = '';
								santriHighlightIndex = -1;
								setTimeout(() => santriInputRef?.focus(), 0);
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									santriDropdownOpen = true;
									santriSearch = '';
									santriHighlightIndex = -1;
									setTimeout(() => santriInputRef?.focus(), 0);
								}
							}}
						>
							<span class="flex-1 truncate text-sm">
								<span class="font-semibold">{selectedSantri.nomorInduk}</span>
								<span class="mx-1">—</span>
								<span>{selectedSantri.namaLengkap}</span>
							</span>
							<button
								type="button"
								class="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-error"
								onclick={(e) => {
									e.stopPropagation();
									selectedSantriId = '';
									santriSearch = '';
									santriDropdownOpen = false;
								}}
								title="Hapus pilihan"
							>✕</button>
						</div>
					{:else}
						<input
							id="santriSearchRekap"
							type="text"
							placeholder="Ketik nama atau nomor induk..."
							class="input input-sm input-bordered w-full"
							autocomplete="off"
							bind:this={santriInputRef}
							bind:value={santriSearch}
							onfocus={() => {
								santriDropdownOpen = true;
								santriHighlightIndex = -1;
							}}
							oninput={() => {
								santriDropdownOpen = true;
								santriHighlightIndex = -1;
							}}
							onkeydown={(e) => {
								if (e.key === 'ArrowDown') {
									e.preventDefault();
									santriHighlightIndex = Math.min(santriHighlightIndex + 1, filteredSantris.length - 1);
								} else if (e.key === 'ArrowUp') {
									e.preventDefault();
									santriHighlightIndex = Math.max(santriHighlightIndex - 1, 0);
								} else if (e.key === 'Enter') {
									e.preventDefault();
									if (santriHighlightIndex >= 0 && santriHighlightIndex < filteredSantris.length) {
										selectedSantriId = String(filteredSantris[santriHighlightIndex].id);
										santriSearch = '';
										santriDropdownOpen = false;
										santriHighlightIndex = -1;
									}
								} else if (e.key === 'Escape') {
									santriDropdownOpen = false;
									santriHighlightIndex = -1;
								}
							}}
						/>
					{/if}

					{#if santriDropdownOpen}
						<div class="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-base-300 bg-base-100 shadow-lg">
							{#if filteredSantris.length === 0}
								<div class="px-4 py-3 text-sm text-base-content/50 text-center">Tidak ada santri yang cocok.</div>
							{:else}
								{#each filteredSantris as s, idx}
									<button
										type="button"
										class="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2
											{idx === santriHighlightIndex ? 'bg-primary/10 text-primary' : 'hover:bg-base-200'}
											{String(s.id) === selectedSantriId ? 'bg-primary/5 font-semibold' : ''}"
										onmouseenter={() => santriHighlightIndex = idx}
										onclick={() => {
											selectedSantriId = String(s.id);
											santriSearch = '';
											santriDropdownOpen = false;
											santriHighlightIndex = -1;
										}}
									>
										<span class="font-mono text-xs text-base-content/60 w-16 shrink-0">{s.nomorInduk}</span>
										<span class="flex-1 truncate">{s.namaLengkap}</span>
									</button>
								{/each}
							{/if}
						</div>
					{/if}
				</div>
			</div>
			<div class="form-control">
				<label class="label py-1" for="filterLevel"><span class="label-text text-xs font-medium">Filter</span></label>
				<select
					id="filterLevel"
					class="select select-sm select-bordered"
					bind:value={selectedLevel}
				>
					<option value="all">Semua</option>
					<option value="smp">Hanya SMP</option>
					<option value="smk">Hanya SMK</option>
				</select>
			</div>
			<button type="button" class="btn btn-sm btn-primary" onclick={handleSubmit}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
				Tampilkan
			</button>
			<button
				type="button"
				class="btn btn-sm btn-outline"
				onclick={handlePrint}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
				Cetak A4
			</button>
		</div>
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
			<div
				class="card bg-base-100 shadow-sm border border-base-200 print-card"
			>
				<div class="card-body">
					<div
						class="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4"
					>
						<div>
							<div class="text-lg font-bold">{s.namaLengkap}</div>
							<div class="text-sm text-base-content/60">
								No. Induk: {s.nomorInduk}
							</div>
							<div class="text-sm text-base-content/60">
								Kategori: {s.namaKategori || "-"}
							</div>
							<div class="text-xs text-base-content/50 mt-1">
								Masuk: {formatTanggal(s.tanggalMasuk)} · Keluar:
								{s.tanggalKeluar
									? formatTanggal(s.tanggalKeluar)
									: "Belum keluar"}
							</div>
						</div>
						<div
							class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8"
						>
							<div class="text-left">
								<div class="text-sm text-base-content/60">
									Tagihan Bulanan
								</div>
								<div class="text-base font-semibold">
									{formatRupiah(s.totalTagihanBulananPondok)}
								</div>
								<div class="text-sm text-success">
									Dibayar: {formatRupiah(
										s.totalDibayarBulananPondok,
									)}
								</div>
								<div class="text-sm text-error">
									Sisa: {formatRupiah(s.totalSisaBulananPondok)}
								</div>
							</div>
							<div class="text-right">
								<div class="text-sm text-base-content/60">
									Tagihan Tahunan
								</div>
								<div class="text-base font-semibold">
									{formatRupiah(s.totalTagihanLain)}
								</div>
								<div class="text-sm text-success">
									Dibayar: {formatRupiah(s.totalDibayarLain)}
								</div>
								<div class="text-sm text-error">
									Sisa: {formatRupiah(s.totalSisaLain)}
								</div>
							</div>
							<div class="text-right">
								<div class="text-sm text-base-content/60">
									Tagihan Lainnya
								</div>
								<div class="text-base font-semibold">
									{formatRupiah(s.totalTagihanKhusus)}
								</div>
								<div class="text-sm text-success">
									Dibayar: {formatRupiah(
										s.totalDibayarTagihanKhusus,
									)}
								</div>
								<div class="text-sm text-error">
									Sisa: {formatRupiah(
										s.totalSisaTagihanKhusus,
									)}
								</div>
							</div>
						</div>
					</div>

					<!-- Pembayaran Pondok Bulanan -->
					{#if s.bulananPondok && s.bulananPondok.length > 0}
						<div class="mb-6">
							<div class="flex items-center justify-between mb-2">
								<h3 class="font-semibold">Pembayaran Pondok Bulanan</h3>
								<span class="badge badge-outline"
									>{s.bulananPondok.length} jenis</span
								>
							</div>
							{#each s.bulananPondok as jenisBulanan}
								<div class="border border-base-200 rounded-lg mb-3 overflow-hidden">
									<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 bg-base-200/40">
										<div class="font-medium">{jenisBulanan.namaPembayaran}</div>
										<div class="flex flex-wrap gap-3 text-xs">
											<span>Tagihan: <strong>{formatRupiah(jenisBulanan.totalTagihan)}</strong></span>
											<span>Dibayar: <strong class="text-success">{formatRupiah(jenisBulanan.totalDibayar)}</strong></span>
											<span>Sisa: <strong class="text-error">{formatRupiah(jenisBulanan.totalSisa)}</strong></span>
										</div>
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
												{#each jenisBulanan.months as m}
												<tr>
													<td>
														<div
															class="flex items-center gap-2"
														>
															<span
																>{m.bulan}
																{m.tahun}</span
															>
															{#if m.isTambahanDariPembayaran}
																<span
																	class="badge badge-warning badge-xs"
																	>Dari
																	pembayaran</span
																>
															{/if}
														</div>
													</td>
													<td class="text-right"
														>{formatRupiah(
															m.nominalTagihan,
														)}</td
													>
													<td class="text-right"
														>{formatRupiah(
															m.nominalDibayar,
														)}</td
													>
													<td
														class="text-xs text-base-content/70"
														>{formatTanggal(
															m.tanggalBayar,
														)}</td
													>
													<td
														class="text-xs font-mono"
														>{m.nomorKwitansi ||
															"-"}</td
													>
													<td>
														{#if m.paid}
															<span
																class="badge badge-success badge-sm"
																>Lunas</span
															>
														{:else}
															<span
																class="badge badge-outline badge-sm"
																>Belum</span
															>
														{/if}
													</td>
												</tr>
												{/each}
											</tbody>
										</table>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<!-- SMK Bulanan -->
					{#if (s.smkBulananNominalEff > 0 || s.totalDibayarSmkBulanan > 0) && s.smkBulanan && s.smkBulanan.length > 0}
						<div class="mb-6">
							<div class="flex items-center justify-between mb-2">
								<h3 class="font-semibold">
									Pembayaran SMK Bulanan
								</h3>
								<span class="badge badge-outline"
									>{s.smkBulanan.length} bulan</span
								>
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
												<td
													colspan="6"
													class="text-center text-base-content/50 py-4"
													>Belum ada periode SMK
													bulanan.</td
												>
											</tr>
										{:else}
											{#each s.smkBulanan as m}
												<tr>
													<td>
														<div
															class="flex items-center gap-2"
														>
															<span
																>{m.bulan}
																{m.tahun}</span
															>
															{#if m.isTambahanDariPembayaran}
																<span
																	class="badge badge-warning badge-xs"
																	>Dari
																	pembayaran</span
																>
															{/if}
														</div>
													</td>
													<td class="text-right"
														>{formatRupiah(
															m.nominalTagihan,
														)}</td
													>
													<td class="text-right"
														>{formatRupiah(
															m.nominalDibayar,
														)}</td
													>
													<td
														class="text-xs text-base-content/70"
														>{formatTanggal(
															m.tanggalBayar,
														)}</td
													>
													<td
														class="text-xs font-mono"
														>{m.nomorKwitansi ||
															"-"}</td
													>
													<td>
														{#if m.paid}
															<span
																class="badge badge-success badge-sm"
																>Lunas</span
															>
														{:else}
															<span
																class="badge badge-outline badge-sm"
																>Belum</span
															>
														{/if}
													</td>
												</tr>
											{/each}
										{/if}
									</tbody>
								</table>
							</div>
							<div class="flex justify-end gap-6 mt-2 text-sm">
								<div>
									Tagihan: <strong
										>{formatRupiah(
											s.totalTagihanSmkBulanan,
										)}</strong
									>
								</div>
								<div>
									Dibayar: <strong class="text-success"
										>{formatRupiah(
											s.totalDibayarSmkBulanan,
										)}</strong
									>
								</div>
								<div>
									Sisa: <strong class="text-error"
										>{formatRupiah(
											s.totalSisaSmkBulanan,
										)}</strong
									>
								</div>
							</div>
						</div>
					{/if}

					<!-- SMP Bulanan -->
					{#if (s.smpBulananNominalEff > 0 || s.totalDibayarSmpBulanan > 0) && s.smpBulanan && s.smpBulanan.length > 0}
						<div class="mb-6">
							<div class="flex items-center justify-between mb-2">
								<h3 class="font-semibold">
									Pembayaran SMP Bulanan
								</h3>
								<span class="badge badge-outline"
									>{s.smpBulanan.length} bulan</span
								>
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
												<td
													colspan="6"
													class="text-center text-base-content/50 py-4"
													>Belum ada periode SMP
													bulanan.</td
												>
											</tr>
										{:else}
											{#each s.smpBulanan as m}
												<tr>
													<td>
														<div
															class="flex items-center gap-2"
														>
															<span
																>{m.bulan}
																{m.tahun}</span
															>
															{#if m.isTambahanDariPembayaran}
																<span
																	class="badge badge-warning badge-xs"
																	>Dari
																	pembayaran</span
																>
															{/if}
														</div>
													</td>
													<td class="text-right"
														>{formatRupiah(
															m.nominalTagihan,
														)}</td
													>
													<td class="text-right"
														>{formatRupiah(
															m.nominalDibayar,
														)}</td
													>
													<td
														class="text-xs text-base-content/70"
														>{formatTanggal(
															m.tanggalBayar,
														)}</td
													>
													<td
														class="text-xs font-mono"
														>{m.nomorKwitansi ||
															"-"}</td
													>
													<td>
														{#if m.paid}
															<span
																class="badge badge-success badge-sm"
																>Lunas</span
															>
														{:else}
															<span
																class="badge badge-outline badge-sm"
																>Belum</span
															>
														{/if}
													</td>
												</tr>
											{/each}
										{/if}
									</tbody>
								</table>
							</div>
							<div class="flex justify-end gap-6 mt-2 text-sm">
								<div>
									Tagihan: <strong
										>{formatRupiah(
											s.totalTagihanSmpBulanan,
										)}</strong
									>
								</div>
								<div>
									Dibayar: <strong class="text-success"
										>{formatRupiah(
											s.totalDibayarSmpBulanan,
										)}</strong
									>
								</div>
								<div>
									Sisa: <strong class="text-error"
										>{formatRupiah(
											s.totalSisaSmpBulanan,
										)}</strong
									>
								</div>
							</div>
						</div>
					{/if}

					<!-- Pembayaran Tahunan & Insidental -->
					<div>
						<div class="flex items-center justify-between mb-2">
							<h3 class="font-semibold">
								Pembayaran Tahunan & Insidental
							</h3>
							<span class="badge badge-outline"
								>{s.pembayaranLain.length} jenis</span
							>
						</div>
						{#if s.pembayaranLain.length === 0}
							<div class="border border-base-200 rounded-lg p-4 text-center text-base-content/50 text-sm">
								Tidak ada jenis pembayaran non-bulanan.
							</div>
						{:else}
							{#each s.pembayaranLain as p}
								<div class="border border-base-200 rounded-lg mb-3 overflow-hidden">
									<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 bg-base-200/40">
										<div class="flex items-center gap-2">
											<span class="font-medium">{p.namaPembayaran || "-"}</span>
											<span class="badge badge-xs badge-outline text-base-content/50">{p.tipe || "-"}</span>
											{#if p.isTambahanDariPembayaran}
												<span class="badge badge-warning badge-xs">Dari pembayaran</span>
											{/if}
										</div>
										<div class="flex flex-wrap gap-3 text-xs">
											<span>Tagihan: <strong>{formatRupiah(p.totalTagihan)}</strong></span>
											<span>Dibayar: <strong class="text-success">{formatRupiah(p.totalNominal)}</strong></span>
											<span>Sisa: <strong class="text-error">{formatRupiah(p.sisa)}</strong></span>
										</div>
									</div>
									{#if p.tahunDetails && p.tahunDetails.length > 0}
										<div class="overflow-x-auto">
											<table class="table table-sm w-full">
												<thead>
													<tr class="bg-base-200/60">
														<th>Tahun Ajaran</th>
														<th class="text-right">Tagihan</th>
														<th class="text-right">Dibayar</th>
														<th class="text-right">Sisa</th>
														<th class="text-center">Transaksi</th>
														<th>Status</th>
														<th class="text-right">Terakhir Bayar</th>
													</tr>
												</thead>
												<tbody>
													{#each p.tahunDetails as td}
														<tr>
															<td>
																<div class="flex items-center gap-2">
																	<span class="font-medium">{td.namaTahun}</span>
																	{#if td.isTambahanDariPembayaran}
																		<span class="badge badge-warning badge-xs">Dari pembayaran</span>
																	{/if}
																</div>
															</td>
															<td class="text-right">{formatRupiah(td.nominalTagihan)}</td>
															<td class="text-right font-semibold">{formatRupiah(td.totalDibayar)}</td>
															<td class="text-right text-error">{formatRupiah(td.sisa)}</td>
															<td class="text-center">{td.jumlahTransaksi}</td>
															<td>
																<span class={`badge badge-sm ${td.sisa <= 0 && td.nominalTagihan > 0 ? "badge-success" : td.totalDibayar > 0 ? "badge-warning badge-outline" : "badge-outline"}`}>
																	{td.sisa <= 0 && td.nominalTagihan > 0 ? "Lunas" : td.totalDibayar > 0 ? "Cicilan" : "Belum"}
																</span>
															</td>
															<td class="text-right text-xs text-base-content/60">{formatTanggal(td.terakhirBayar)}</td>
														</tr>
													{/each}
												</tbody>
											</table>
										</div>
									{:else}
										<div class="px-3 py-2 text-sm text-base-content/50">
											Belum ada detail tagihan.
										</div>
									{/if}
								</div>
							{/each}
						{/if}
					</div>

					<!-- Pembayaran Khusus (hanya tampil jika ada) -->
					{#if s.tagihanKhusus && s.tagihanKhusus.length > 0}
						<div class="mt-4">
							<div class="flex items-center justify-between mb-2">
								<h3 class="font-semibold">Tagihan Khusus</h3>
								<span class="badge badge-outline"
									>{s.tagihanKhusus.length} tagihan</span
								>
							</div>
							<div class="overflow-x-auto">
								<table class="table table-sm w-full">
									<thead>
										<tr class="bg-info/10">
											<th>Tahun</th>
											<th>Nama Tagihan</th>
											<th class="text-right">Tagihan</th>
											<th class="text-right">Dibayar</th>
											<th class="text-right">Sisa</th>
											<th>Status</th>
										</tr>
									</thead>
									<tbody>
										{#each s.tagihanKhusus as tk}
											<tr>
												<td class="text-sm"
													>{tk.namaTahunAjaran}</td
												>
												<td>
													<div class="font-medium">
														{tk.keterangan}
													</div>
													{#if tk.catatan}
														<div
															class="text-xs text-base-content/60"
														>
															{tk.catatan}
														</div>
													{/if}
												</td>
												<td class="text-right"
													>{formatRupiah(
														tk.nominalTagihan,
													)}</td
												>
												<td
													class="text-right text-success"
													>{formatRupiah(
														tk.totalDibayar,
													)}</td
												>
												<td
													class="text-right text-error font-semibold"
													>{formatRupiah(tk.sisa)}</td
												>
												<td>
													<span
														class={`badge badge-sm ${tk.sisa <= 0 ? "badge-success" : "badge-warning badge-outline"}`}
													>
														{tk.sisa <= 0
															? "Lunas"
															: "Belum Lunas"}
													</span>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}

					{#if s.pembayaranKhusus && s.pembayaranKhusus.length > 0}
						<div class="mt-4">
							<div class="flex items-center justify-between mb-2">
								<h3
									class="font-semibold flex items-center gap-2"
								>
									<span class="text-warning">📌</span> Pembayaran
									Lain-lain
								</h3>
								<span class="badge badge-warning badge-outline"
									>{s.pembayaranKhusus.length} transaksi</span
								>
							</div>
							<div class="overflow-x-auto">
								<table class="table table-sm w-full">
									<thead>
										<tr class="bg-warning/10">
											<th>Keterangan</th>
											<th class="text-right">Nominal</th>
											<th>Tgl Bayar</th>
											<th>No. Kwitansi</th>
										</tr>
									</thead>
									<tbody>
										{#each s.pembayaranKhusus as pk}
											<tr>
												<td class="font-medium"
													>{pk.keterangan}</td
												>
												<td
													class="text-right font-semibold"
													>{formatRupiah(
														pk.nominalDibayar,
													)}</td
												>
												<td
													class="text-xs text-base-content/70"
													>{formatTanggal(
														pk.tanggalBayar,
													)}</td
												>
												<td class="text-xs font-mono"
													>{pk.nomorKwitansi ||
														"-"}</td
												>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
							<div class="flex justify-end mt-2 text-sm">
								<div>
									Total Lain-lain: <strong
										>{formatRupiah(s.totalKhusus)}</strong
									>
								</div>
							</div>
						</div>
					{/if}
					<div class="flex justify-between items-end mt-6">
						<div class="text-xs text-base-content/70 hidden print-meta">
							<div>Dicetak pada {cetakWaktu}</div>
							<div>Oleh {data.user?.namaLengkap || data.user?.username || '-'}</div>
						</div>
						<div
							class="rounded-xl border border-error/20 bg-error/5 px-4 py-3 min-w-[280px]"
						>
							<div
								class="text-xs uppercase tracking-wide text-base-content/60"
							>
								Belum Terbayar Keseluruhan
							</div>
							<div class="text-2xl font-bold text-error mt-1">
								{formatRupiah(s.totalBelumTerbayarKeseluruhan)}
							</div>
							<div class="text-xs text-base-content/60 mt-1">
								Tagihan: {formatRupiah(
									s.totalTagihanKeseluruhan,
								)} · Dibayar: {formatRupiah(
									s.totalDibayarKeseluruhan,
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>
