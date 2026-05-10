<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';

	let { data, form } = $props();

	const isAdmin = $derived($page.data.user?.role === 'admin');

	let santriSearch = $state('');
	let selectedSantriId = $state('');
	let selectedTahunAjaranId = $state('');
	let isSubmitting = $state(false);
	let isDeleting = $state(false);

	// Combobox state
	let santriDropdownOpen = $state(false);
	let santriHighlightIndex = $state(-1);
	let santriComboboxRef = $state(null);
	let santriInputRef = $state(null);

	let selectedSantri = $derived(data.santris.find(s => s.id == selectedSantriId) || null);

	let filteredSantris = $derived.by(() => {
		const query = santriSearch.trim().toLowerCase();
		let list = data.santris;
		if (query) {
			list = data.santris.filter((santri) => {
				const nama = String(santri.namaLengkap || '').toLowerCase();
				const nomor = String(santri.nomorInduk || '').toLowerCase();
				return nama.includes(query) || nomor.includes(query);
			});
		}
		if (selectedSantriId && !list.some((s) => s.id == selectedSantriId)) {
			const selected = data.santris.find((s) => s.id == selectedSantriId);
			if (selected) list = [selected, ...list];
		}
		return list;
	});

	$effect(() => {
		if (!selectedTahunAjaranId && data.tahunAjaranAktif?.id) {
			selectedTahunAjaranId = String(data.tahunAjaranAktif.id);
		}
	});

	const formatRupiah = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');
</script>

<div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
	<div class="xl:col-span-2">
		<div class="card bg-base-100 shadow-sm border border-base-200">
			<div class="card-body">
				<h2 class="card-title text-2xl">Tambahkan Tagihan Khusus</h2>
				<p class="text-sm text-base-content/60">Tambahkan tagihan custom per santri di luar master jenis pembayaran. Tagihan ini otomatis tersedia di input transaksi, rekap individu, dan perhitungan tunggakan global tahun aktif.</p>

				{#if form?.success === false}
					<div class="alert alert-error mt-4"><span>{form.message}</span></div>
				{/if}
				{#if form?.success === true}
					<div class="alert alert-success mt-4"><span>{form.message}</span></div>
				{/if}

				<form
					method="POST"
					action="?/create"
					class="mt-4"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							isSubmitting = false;
							await update();
							await invalidateAll();
						};
					}}
				>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="form-control md:col-span-2">
							<label class="label" for="santriSearchTagihan"><span class="label-text font-medium">Santri</span></label>
							<input type="hidden" name="santriId" value={selectedSantriId} />
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
									<!-- Display selected santri -->
									<div
										class="input input-bordered w-full flex items-center gap-2 cursor-pointer bg-base-100 pr-2"
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
											<span class="text-base-content/50 ml-1">({selectedSantri.namaKategori || 'Tanpa Kategori'})</span>
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
									<!-- Search input -->
									<input
										id="santriSearchTagihan"
										type="text"
										placeholder="Ketik nama atau nomor induk untuk mencari..."
										class="input input-bordered w-full"
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
													selectedSantriId = filteredSantris[santriHighlightIndex].id;
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

								<!-- Dropdown list -->
								{#if santriDropdownOpen}
									<div class="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-base-300 bg-base-100 shadow-lg">
										{#if filteredSantris.length === 0}
											<div class="px-4 py-3 text-sm text-base-content/50 text-center">
												Tidak ada santri yang cocok.
											</div>
										{:else}
											{#each filteredSantris as s, idx}
												<button
													type="button"
													class="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2
														{idx === santriHighlightIndex ? 'bg-primary/10 text-primary' : 'hover:bg-base-200'}
														{s.id == selectedSantriId ? 'bg-primary/5 font-semibold' : ''}"
													onmouseenter={() => santriHighlightIndex = idx}
													onclick={() => {
														selectedSantriId = s.id;
														santriSearch = '';
														santriDropdownOpen = false;
														santriHighlightIndex = -1;
													}}
												>
													<span class="font-mono text-xs text-base-content/60 w-16 shrink-0">{s.nomorInduk}</span>
													<span class="flex-1 truncate">{s.namaLengkap}</span>
													<span class="badge badge-sm badge-ghost text-xs">{s.namaKategori || 'Tanpa Kategori'}</span>
												</button>
											{/each}
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<div class="form-control">
							<label class="label" for="tahunAjaranId"><span class="label-text font-medium">Tahun Ajaran</span></label>
							<select id="tahunAjaranId" name="tahunAjaranId" class="select select-bordered" bind:value={selectedTahunAjaranId} required>
								{#each data.tahunAjarans as tahun}
									<option value={String(tahun.id)} selected={tahun.isActive}>{tahun.nama}</option>
								{/each}
							</select>
						</div>

						<div class="form-control">
							<label class="label" for="nominalTagihan"><span class="label-text font-medium">Nominal Tagihan</span></label>
							<input id="nominalTagihan" name="nominalTagihan" type="number" min="1" class="input input-bordered" placeholder="250000" required />
						</div>

						<div class="form-control md:col-span-2">
							<label class="label" for="namaTagihan"><span class="label-text font-medium">Nama Tagihan Khusus</span></label>
							<input id="namaTagihan" name="namaTagihan" type="text" class="input input-bordered" placeholder="Contoh: Seragam Praktek, Study Tour, Denda Perpustakaan" required />
						</div>

						<div class="form-control md:col-span-2">
							<label class="label" for="catatan"><span class="label-text font-medium">Catatan</span></label>
							<textarea id="catatan" name="catatan" class="textarea textarea-bordered min-h-24" placeholder="Opsional"></textarea>
						</div>
					</div>

					<div class="flex justify-end mt-6">
						<button type="submit" class="btn btn-primary" disabled={isSubmitting || !selectedSantriId}>
							{#if isSubmitting}
								<span class="loading loading-spinner loading-sm"></span>
								Menyimpan...
							{:else}
								Simpan Tagihan Khusus
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>

	<div class="xl:col-span-1">
		<div class="card bg-base-100 shadow-sm border border-base-200">
			<div class="card-body">
				<h3 class="card-title text-lg">Tagihan Khusus Terbaru</h3>
				<div class="overflow-x-auto mt-2">
					<table class="table table-sm w-full">
						<thead>
							<tr>
								<th>Santri</th>
								<th>Tagihan</th>
								<th class="text-right">Sisa</th>
								{#if isAdmin}
									<th class="text-center">Aksi</th>
								{/if}
							</tr>
						</thead>
						<tbody>
							{#if data.tagihanKhusus.length === 0}
								<tr>
									<td colspan={isAdmin ? 4 : 3} class="text-center text-base-content/50 py-4">Belum ada tagihan khusus.</td>
								</tr>
							{:else}
								{#each data.tagihanKhusus.slice(0, 8) as item}
									<tr>
										<td>
											<div class="font-medium">{item.namaSantri || '-'}</div>
											<div class="text-xs text-base-content/60">{item.namaTahunAjaran}</div>
										</td>
										<td>
											<div class="font-medium">{item.keteranganKhusus}</div>
											<div class="text-xs text-base-content/60">{formatRupiah(item.nominalTagihan)} tagihan</div>
										</td>
										<td class="text-right font-semibold {item.sisa > 0 ? 'text-error' : 'text-success'}">
											{formatRupiah(item.sisa)}
										</td>
										{#if isAdmin}
											<td class="text-center">
												<form
													method="POST"
													action="?/delete"
													use:enhance={() => {
														const confirmed = confirm(`Yakin hapus tagihan "${item.keteranganKhusus}" untuk ${item.namaSantri}?`);
														if (!confirmed) return ({ cancel }) => cancel();
														isDeleting = true;
														return async ({ update }) => {
															isDeleting = false;
															await update();
															await invalidateAll();
														};
													}}
												>
													<input type="hidden" name="tagihanId" value={item.id} />
													<button type="submit" class="btn btn-ghost btn-xs text-error" disabled={isDeleting} title="Hapus tagihan">
														<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</button>
												</form>
											</td>
										{/if}
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
</div>
