<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { startSaving, finishSaving } from '$lib/stores/saving.js';

	let { data, form } = $props();

	const isAdmin = $derived($page.data.user?.role === 'admin');

	let isDeleting = $state(false);
	let isUpdating = $state(false);

	// Filter state
	let searchQuery = $state('');
	let filterTahun = $state('');
	let filterStatus = $state(''); // '', 'lunas', 'belum'

	// Edit modal state
	let editingItem = $state(null);
	let editNama = $state('');
	let editCatatan = $state('');
	let editNominal = $state(0);

	const formatRupiah = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');

	const formatDate = (dateStr) => {
		if (!dateStr) return '-';
		try {
			return new Date(dateStr).toLocaleDateString('id-ID', {
				day: '2-digit',
				month: 'short',
				year: 'numeric'
			});
		} catch {
			return '-';
		}
	};

	let filteredList = $derived.by(() => {
		let list = data.tagihanKhusus;
		const q = searchQuery.trim().toLowerCase();
		if (q) {
			list = list.filter((item) => {
				const nama = String(item.namaSantri || '').toLowerCase();
				const nomor = String(item.nomorInduk || '').toLowerCase();
				const ket = String(item.keteranganKhusus || '').toLowerCase();
				const catatan = String(item.catatan || '').toLowerCase();
				return nama.includes(q) || nomor.includes(q) || ket.includes(q) || catatan.includes(q);
			});
		}
		if (filterTahun) {
			list = list.filter((item) => String(item.tahunAjaranId) === filterTahun);
		}
		if (filterStatus === 'lunas') {
			list = list.filter((item) => item.sisa === 0);
		} else if (filterStatus === 'belum') {
			list = list.filter((item) => item.sisa > 0);
		}
		return list;
	});

	const totalTagihan = $derived(filteredList.reduce((s, i) => s + Number(i.nominalTagihan || 0), 0));
	const totalDibayar = $derived(filteredList.reduce((s, i) => s + Number(i.totalDibayar || 0), 0));
	const totalSisa = $derived(filteredList.reduce((s, i) => s + Number(i.sisa || 0), 0));

	function openEdit(item) {
		editingItem = item;
		editNama = item.keteranganKhusus || '';
		editCatatan = item.catatan || '';
		editNominal = Number(item.nominalTagihan || 0);
	}

	function closeEdit() {
		editingItem = null;
	}

	$effect(() => {
		if (form?.success === true) {
			closeEdit();
		}
	});
</script>

<svelte:head>
	<title>Daftar Tagihan Khusus</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold">Daftar Tagihan Khusus</h1>
			<p class="text-sm text-base-content/60 mt-1">Kelola semua tagihan khusus per santri. Data dapat diedit atau dihapus.</p>
		</div>
		<a href="/transaksi/tambah-tagihan-khusus" class="btn btn-primary btn-sm gap-2">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Tambah Tagihan
		</a>
	</div>

	<!-- Alert messages -->
	{#if form?.success === false}
		<div class="alert alert-error"><span>{form.message}</span></div>
	{/if}
	{#if form?.success === true}
		<div class="alert alert-success"><span>{form.message}</span></div>
	{/if}

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="card bg-base-100 border border-base-200 shadow-sm">
			<div class="card-body py-4 px-5">
				<p class="text-xs text-base-content/60 font-medium uppercase tracking-wide">Total Tagihan</p>
				<p class="text-xl font-bold text-primary mt-1">{formatRupiah(totalTagihan)}</p>
				<p class="text-xs text-base-content/50">{filteredList.length} tagihan</p>
			</div>
		</div>
		<div class="card bg-base-100 border border-base-200 shadow-sm">
			<div class="card-body py-4 px-5">
				<p class="text-xs text-base-content/60 font-medium uppercase tracking-wide">Sudah Dibayar</p>
				<p class="text-xl font-bold text-success mt-1">{formatRupiah(totalDibayar)}</p>
				<p class="text-xs text-base-content/50">{filteredList.filter(i => i.sisa === 0).length} lunas</p>
			</div>
		</div>
		<div class="card bg-base-100 border border-base-200 shadow-sm">
			<div class="card-body py-4 px-5">
				<p class="text-xs text-base-content/60 font-medium uppercase tracking-wide">Sisa Tagihan</p>
				<p class="text-xl font-bold text-error mt-1">{formatRupiah(totalSisa)}</p>
				<p class="text-xs text-base-content/50">{filteredList.filter(i => i.sisa > 0).length} belum lunas</p>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="card bg-base-100 border border-base-200 shadow-sm">
		<div class="card-body py-4 px-5">
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div class="sm:col-span-1">
					<input
						type="text"
						class="input input-bordered input-sm w-full"
						placeholder="Cari nama, nomor induk, tagihan..."
						bind:value={searchQuery}
					/>
				</div>
				<div>
					<select class="select select-bordered select-sm w-full" bind:value={filterTahun}>
						<option value="">Semua Tahun Ajaran</option>
						{#each data.tahunAjarans as tahun}
							<option value={String(tahun.id)}>{tahun.nama}</option>
						{/each}
					</select>
				</div>
				<div>
					<select class="select select-bordered select-sm w-full" bind:value={filterStatus}>
						<option value="">Semua Status</option>
						<option value="belum">Belum Lunas</option>
						<option value="lunas">Lunas</option>
					</select>
				</div>
			</div>
		</div>
	</div>

	<!-- Table -->
	<div class="card bg-base-100 border border-base-200 shadow-sm">
		<div class="card-body p-0">
			<div class="overflow-x-auto">
				<table class="table table-sm w-full">
					<thead class="bg-base-200/60">
						<tr>
							<th class="pl-5">Santri</th>
							<th>Detail Tagihan</th>
							<th>Catatan</th>
							<th class="text-right">Nominal</th>
							<th class="text-right">Dibayar</th>
							<th class="text-right">Sisa</th>
							<th class="text-center">Status</th>
							{#if isAdmin}
								<th class="text-center pr-5">Aksi</th>
							{/if}
						</tr>
					</thead>
					<tbody>
						{#if filteredList.length === 0}
							<tr>
								<td colspan={isAdmin ? 8 : 7} class="text-center text-base-content/50 py-10">
									<div class="flex flex-col items-center gap-2">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
										<span>Tidak ada data tagihan khusus.</span>
									</div>
								</td>
							</tr>
						{:else}
							{#each filteredList as item}
								<tr class="hover:bg-base-200/30 transition-colors">
									<td class="pl-5">
										<div class="font-semibold text-sm">{item.namaSantri || '-'}</div>
										<div class="text-xs text-base-content/60 font-mono">{item.nomorInduk || '-'}</div>
										<div class="text-xs text-base-content/50">{item.namaKategori || 'Tanpa Kategori'} · {item.namaTahunAjaran}</div>
									</td>
									<td>
										<div class="font-medium text-sm">{item.keteranganKhusus || '-'}</div>
										<div class="text-xs text-base-content/50">{formatDate(item.createdAt)}</div>
									</td>
									<td>
										<div class="text-sm text-base-content/70 max-w-[160px] truncate" title={item.catatan || ''}>
											{#if item.catatan}
												{item.catatan}
											{:else}
												<span class="italic text-base-content/30">-</span>
											{/if}
										</div>
									</td>
									<td class="text-right font-medium text-sm">{formatRupiah(item.nominalTagihan)}</td>
									<td class="text-right text-sm text-success">{formatRupiah(item.totalDibayar)}</td>
									<td class="text-right font-semibold text-sm {item.sisa > 0 ? 'text-error' : 'text-success'}">{formatRupiah(item.sisa)}</td>
									<td class="text-center">
										{#if item.sisa === 0}
											<span class="badge badge-success badge-sm">Lunas</span>
										{:else}
											<span class="badge badge-error badge-sm">Belum</span>
										{/if}
									</td>
									{#if isAdmin}
										<td class="text-center pr-5">
											<div class="flex items-center justify-center gap-1">
												<!-- Edit Button -->
												<button
													type="button"
													class="btn btn-ghost btn-xs text-primary"
													title="Edit tagihan"
													onclick={() => openEdit(item)}
												>
													<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
													</svg>
												</button>
												<!-- Delete Button -->
												<form
													method="POST"
													action="?/delete"
													use:enhance={() => {
														const confirmed = confirm(`Yakin hapus tagihan "${item.keteranganKhusus}" untuk ${item.namaSantri}?`);
														if (!confirmed) return ({ cancel }) => cancel();
														isDeleting = true;
														startSaving();
														return async ({ update }) => {
															isDeleting = false;
															await update();
															await invalidateAll();
															finishSaving();
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
											</div>
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

<!-- Edit Modal -->
{#if editingItem}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
		onclick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
	>
		<div class="card bg-base-100 shadow-2xl w-full max-w-md mx-4 border border-base-200">
			<div class="card-body">
				<div class="flex items-center justify-between mb-2">
					<h3 class="card-title text-lg">Edit Tagihan Khusus</h3>
					<button type="button" class="btn btn-ghost btn-sm btn-circle" onclick={closeEdit}>✕</button>
				</div>
				<div class="text-sm text-base-content/60 mb-4">
					<span class="font-semibold text-base-content">{editingItem.namaSantri}</span>
					<span class="mx-1">·</span>
					<span>{editingItem.namaTahunAjaran}</span>
				</div>

				<form
					method="POST"
					action="?/update"
					use:enhance={() => {
						isUpdating = true;
						startSaving();
						return async ({ update }) => {
							isUpdating = false;
							await update();
							await invalidateAll();
							finishSaving();
						};
					}}
				>
					<input type="hidden" name="tagihanId" value={editingItem.id} />

					<div class="form-control mb-3">
						<label class="label" for="editNama"><span class="label-text font-medium">Nama Tagihan</span></label>
						<input
							id="editNama"
							name="keteranganKhusus"
							type="text"
							class="input input-bordered"
							bind:value={editNama}
							required
						/>
					</div>

					<div class="form-control mb-3">
						<label class="label" for="editNominal"><span class="label-text font-medium">Nominal Tagihan</span></label>
						<input
							id="editNominal"
							name="nominalTagihan"
							type="number"
							min="1"
							class="input input-bordered"
							bind:value={editNominal}
							required
						/>
					</div>

					<div class="form-control mb-5">
						<label class="label" for="editCatatan"><span class="label-text font-medium">Catatan</span></label>
						<textarea
							id="editCatatan"
							name="catatan"
							class="textarea textarea-bordered min-h-20"
							placeholder="Opsional"
							bind:value={editCatatan}
						></textarea>
					</div>

					<div class="flex justify-end gap-2">
						<button type="button" class="btn btn-ghost btn-sm" onclick={closeEdit}>Batal</button>
						<button type="submit" class="btn btn-primary btn-sm" disabled={isUpdating}>
							{#if isUpdating}
								<span class="loading loading-spinner loading-xs"></span>
								Menyimpan...
							{:else}
								Simpan Perubahan
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
