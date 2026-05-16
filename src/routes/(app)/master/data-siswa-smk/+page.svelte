<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	let { data, form } = $props();

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

	const bulanList = [
		'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
		'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
	];

	let searchSantri = $state('');
	let selectedTahunAjaran = $state('');
	let selectedSantriId = $state('');
	let santriDropdownOpen = $state(false);
	let santriHighlightIndex = $state(-1);
	let santriComboboxRef = $state(null);
	let santriInputRef = $state(null);
	let selectedSantri = $derived(data.santriList.find(s => s.id == selectedSantriId) || null);

	let filteredSantriData = $derived.by(() => {
		let list = data.dataSmk;
		if (selectedTahunAjaran) {
			const filterYear = parseInt(selectedTahunAjaran);
			list = list.filter((s) => s.startYear === filterYear);
		}
		return list;
	});

	let editSmk = $state(null);
	let filteredSantri = $derived.by(() => {
		const q = searchSantri.trim().toLowerCase();
		let list = data.santriList;
		if (q) {
			list = data.santriList.filter((s) => {
				const nama = (s.namaLengkap || '').toLowerCase();
				const induk = (s.nomorInduk || '').toLowerCase();
				return nama.includes(q) || induk.includes(q);
			});
		}
		if (selectedSantriId && !list.some((s) => s.id == selectedSantriId)) {
			const selected = data.santriList.find((s) => s.id == selectedSantriId);
			if (selected) list = [selected, ...list];
		}
		return list;
	});
</script>

<svelte:head>
	<title>Data Siswa SMK</title>
	<style>
		@media print {
			@page {
				size: landscape;
			}
			:global(body) {
				background-color: white !important;
			}
			:global(.drawer-toggle), :global(.drawer-side), :global(.navbar), :global(footer) {
				display: none !important;
			}
			.print-meta {
				display: block !important;
			}
			.card {
				border: none !important;
				box-shadow: none !important;
			}
			table {
				font-size: 12px;
			}
		}
		.print-meta {
			display: none;
		}
		.print-only {
			display: none;
		}
		@media print {
			.print-only {
				display: block;
			}
		}
	</style>
</svelte:head>

<!-- Print Header -->
<div class="print-only mb-4">
	<div class="flex justify-between items-center border-b-2 border-base-300 pb-2 mb-4">
		<div class="flex items-center gap-4">
			<div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-lg overflow-hidden">
				{#if $page.data.profilPesantren?.logoUrl}
					<img src={$page.data.profilPesantren.logoUrl} alt="Logo" class="w-full h-full object-cover" />
				{:else}
					{$page.data.profilPesantren?.namaPesantren?.charAt(0) || 'P'}
				{/if}
			</div>
			<div>
				<h1 class="text-2xl font-bold">{$page.data.profilPesantren?.namaPesantren || 'Aplikasi Pesantren'}</h1>
				<p class="text-base-content/60 text-sm">{$page.data.profilPesantren?.alamat || 'Alamat Pesantren'}</p>
			</div>
		</div>
		<div class="text-right">
			<h2 class="text-xl font-bold tracking-wide text-primary">DATA SISWA SMK</h2>
		</div>
	</div>
</div>

<div class="card bg-base-100 shadow-xl border border-base-200 mb-8">
	<div class="card-body">
		<div class="flex justify-between items-center mb-4 print:hidden">
			<h2 class="card-title text-2xl font-bold">Data Siswa SMK</h2>
			<div class="flex gap-2">
				<select class="select select-sm select-bordered w-full max-w-xs" bind:value={selectedTahunAjaran}>
					<option value="">Semua Tahun Masuk</option>
					{#each data.tahunAjarans as ta}
						<option value={ta.nama}>{ta.nama}</option>
					{/each}
				</select>
				<button type="button" class="btn btn-outline btn-secondary btn-sm" onclick={() => window.print()}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
						<path d="M6 2a1 1 0 00-1 1v2h10V3a1 1 0 00-1-1H6z" />
						<path fill-rule="evenodd" d="M4 7a2 2 0 00-2 2v5a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2H4zm2 9v-4h8v4H6z" clip-rule="evenodd" />
					</svg>
					Cetak List
				</button>
				<button class="btn btn-primary btn-sm" onclick={() => modal_add_smk.showModal()}>
					+ Tambah Siswa SMK
				</button>
			</div>
		</div>

		{#if form?.message}
			<div class="alert {form.success === false ? 'alert-error' : 'alert-success'} mb-4 py-2 text-sm rounded-lg">
				<span>{form.message}</span>
			</div>
		{/if}

		<div class="overflow-x-auto">
			<table class="table table-zebra w-full">
				<thead class="bg-base-200">
					<tr>
						<th>Nama</th>
						<th>No. Induk</th>
						<th>Mulai SMK</th>
						<th>Selesai SMK</th>
						<th class="text-right print:hidden">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#if filteredSantriData.length === 0}
						<tr>
							<td colspan="5" class="text-center text-base-content/50 py-6">Belum ada data siswa SMK.</td>
						</tr>
					{:else}
						{#each filteredSantriData as s}
							<tr>
								<td class="font-medium">{s.namaLengkap}</td>
								<td>{s.nomorInduk}</td>
								<td>{bulanList[s.startMonth - 1]} {s.startYear}</td>
								<td>
									{#if s.endMonth && s.endYear}
										{bulanList[s.endMonth - 1]} {s.endYear}
									{:else}
										<span class="text-base-content/40">Masih aktif</span>
									{/if}
									{#if s.isUjianBareng}
										<span class="badge badge-sm badge-info ml-2">Ujian Bareng</span>
									{/if}
								</td>
								<td class="text-right print:hidden">
									<div class="flex gap-1 justify-end">
										<button class="btn btn-xs btn-outline btn-primary" onclick={() => { editSmk = { ...s }; modal_edit_smk.showModal(); }}>
											Edit
										</button>
										<form method="POST" action="?/delete" use:enhance class="inline">
											<input type="hidden" name="id" value={s.id} />
											<button class="btn btn-xs btn-ghost text-error">Hapus</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Print Metadata Footer -->
<div class="print-meta mt-8 text-sm">
	<div class="flex justify-between items-start">
		<div class="flex-1">
			<p>Dicetak pada {cetakWaktu}</p>
			<p>Oleh <span class="font-medium">{$page.data.user?.namaLengkap || $page.data.user?.username || 'Petugas'}</span></p>
		</div>
	</div>
</div>

<dialog id="modal_add_smk" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Tambah Siswa SMK</h3>
		<form method="POST" action="?/create" use:enhance={() => {
			return async ({ update }) => { await update(); modal_add_smk.close(); };
		}}>
			<div class="form-control w-full mb-3">
				<label class="label" for="santriSearch"><span class="label-text">Pilih Santri</span></label>
				<input type="hidden" name="santriId" value={selectedSantriId} required />
				<div
					class="relative"
					bind:this={santriComboboxRef}
					role="combobox"
					aria-controls="santri-listbox"
					aria-expanded={santriDropdownOpen}
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
								searchSantri = '';
								santriHighlightIndex = -1;
								setTimeout(() => santriInputRef?.focus(), 0);
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									santriDropdownOpen = true;
									searchSantri = '';
									santriHighlightIndex = -1;
									setTimeout(() => santriInputRef?.focus(), 0);
								}
							}}
						>
							<span class="flex-1 truncate text-xs">
								<span class="font-semibold">{selectedSantri.nomorInduk}</span>
								<span class="mx-1">—</span>
								<span>{selectedSantri.namaLengkap}</span>
							</span>
							<button
								type="button"
								class="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-error h-4 w-4 min-h-0"
								onclick={(e) => {
									e.stopPropagation();
									selectedSantriId = '';
									searchSantri = '';
									santriDropdownOpen = false;
								}}
								title="Hapus pilihan"
							>✕</button>
						</div>
					{:else}
						<input
							id="santriSearch"
							type="text"
							placeholder="Cari nama / NIS..."
							class="input input-sm input-bordered w-full"
							autocomplete="off"
							bind:this={santriInputRef}
							bind:value={searchSantri}
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
									santriHighlightIndex = Math.min(santriHighlightIndex + 1, filteredSantri.length - 1);
								} else if (e.key === 'ArrowUp') {
									e.preventDefault();
									santriHighlightIndex = Math.max(santriHighlightIndex - 1, 0);
								} else if (e.key === 'Enter') {
									e.preventDefault();
									if (santriHighlightIndex >= 0 && santriHighlightIndex < filteredSantri.length) {
										selectedSantriId = filteredSantri[santriHighlightIndex].id;
										searchSantri = '';
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
						<div id="santri-listbox" class="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-base-300 bg-base-100 shadow-lg">
							{#if filteredSantri.length === 0}
								<div class="px-4 py-3 text-sm text-base-content/50 text-center">
									Tidak ada santri yang cocok.
								</div>
							{:else}
								{#each filteredSantri as s, idx}
									<button
										type="button"
										class="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2
											{idx === santriHighlightIndex ? 'bg-primary/10 text-primary' : 'hover:bg-base-200'}
											{s.id == selectedSantriId ? 'bg-primary/5 font-semibold' : ''}"
										onmouseenter={() => santriHighlightIndex = idx}
										onclick={() => {
											selectedSantriId = s.id;
											searchSantri = '';
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
			<div class="grid grid-cols-2 gap-3">
				<div class="form-control w-full">
					<label class="label" for="startMonth"><span class="label-text">Mulai (Bulan)</span></label>
					<select id="startMonth" name="startMonth" class="select select-sm select-bordered w-full" required>
						<option value="" disabled selected>Pilih Bulan...</option>
						{#each bulanList as b, i}
							<option value={i + 1}>{b}</option>
						{/each}
					</select>
				</div>
				<div class="form-control w-full">
					<label class="label" for="startYear"><span class="label-text">Mulai (Tahun)</span></label>
					<input id="startYear" name="startYear" type="number" min="2000" class="input input-sm input-bordered w-full" placeholder="2024" required />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3 mt-3">
				<div class="form-control w-full">
					<label class="label" for="endMonth"><span class="label-text">Selesai (Bulan)</span></label>
					<select id="endMonth" name="endMonth" class="select select-sm select-bordered w-full">
						<option value="">Masih aktif</option>
						{#each bulanList as b, i}
							<option value={i + 1}>{b}</option>
						{/each}
					</select>
				</div>
				<div class="form-control w-full">
					<label class="label" for="endYear"><span class="label-text">Selesai (Tahun)</span></label>
					<input id="endYear" name="endYear" type="number" min="2000" class="input input-sm input-bordered w-full" placeholder="2027" />
				</div>
			</div>
			<div class="form-control mt-3">
				<label class="label cursor-pointer justify-start gap-3">
					<input type="checkbox" name="isUjianBareng" class="checkbox checkbox-sm checkbox-info" />
					<span class="label-text">Ujian Berbarengan (Kakak Beradik)</span>
				</label>
			</div>
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => modal_add_smk.close()}>Batal</button>
				<button type="submit" class="btn btn-primary">Simpan</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<dialog id="modal_edit_smk" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Edit Periode Siswa SMK</h3>
		{#if editSmk}
		<form method="POST" action="?/update" use:enhance={() => {
			return async ({ update }) => { await update(); modal_edit_smk.close(); editSmk = null; };
		}}>
			<input type="hidden" name="id" value={editSmk.id} />
			<div class="form-control w-full mb-3">
				<label class="label" for="editSmkSantriInfo"><span class="label-text">Santri</span></label>
				<input id="editSmkSantriInfo" name="santriInfo" type="text" class="input input-sm input-bordered w-full bg-base-200" value={`${editSmk.nomorInduk} - ${editSmk.namaLengkap}`} disabled />
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="form-control w-full">
					<label class="label" for="editStartMonth"><span class="label-text">Mulai (Bulan)</span></label>
					<select id="editStartMonth" name="startMonth" class="select select-sm select-bordered w-full" required>
						{#each bulanList as b, i}
							<option value={i + 1} selected={editSmk.startMonth === i + 1}>{b}</option>
						{/each}
					</select>
				</div>
				<div class="form-control w-full">
					<label class="label" for="editStartYear"><span class="label-text">Mulai (Tahun)</span></label>
					<input id="editStartYear" name="startYear" type="number" min="2000" class="input input-sm input-bordered w-full" value={editSmk.startYear} required />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3 mt-3">
				<div class="form-control w-full">
					<label class="label" for="editEndMonth"><span class="label-text">Selesai (Bulan)</span></label>
					<select id="editEndMonth" name="endMonth" class="select select-sm select-bordered w-full">
						<option value="" selected={!editSmk.endMonth}>Masih aktif</option>
						{#each bulanList as b, i}
							<option value={i + 1} selected={editSmk.endMonth === i + 1}>{b}</option>
						{/each}
					</select>
				</div>
				<div class="form-control w-full">
					<label class="label" for="editEndYear"><span class="label-text">Selesai (Tahun)</span></label>
					<input id="editEndYear" name="endYear" type="number" min="2000" class="input input-sm input-bordered w-full" value={editSmk.endYear || ''} />
				</div>
			</div>
			<div class="form-control mt-3">
				<label class="label cursor-pointer justify-start gap-3">
					<input type="checkbox" name="isUjianBareng" class="checkbox checkbox-sm checkbox-info" checked={editSmk.isUjianBareng} />
					<span class="label-text">Ujian Berbarengan (Kakak Beradik)</span>
				</label>
			</div>
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => { modal_edit_smk.close(); editSmk = null; }}>Batal</button>
				<button type="submit" class="btn btn-primary">Simpan Perubahan</button>
			</div>
		</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
