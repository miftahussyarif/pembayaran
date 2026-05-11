<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let search = $state('');
	let selectedTahunMasuk = $state('');
	let editSantri = $state(null);
	let editActiveKeys = $state([]);

	const currentLabel = $derived(
		`${data.monthNames[(data.currentPeriod?.bulan || 1) - 1]} ${data.currentPeriod?.tahun}`
	);

	const filteredSantris = $derived.by(() => {
		const needle = search.trim().toLowerCase();
		let result = data.santris;

		if (selectedTahunMasuk) {
			result = result.filter((santri) => String(santri.tahunMasuk) === String(selectedTahunMasuk));
		}

		if (!needle) return result;

		return result.filter((santri) => {
			return (
				santri.namaLengkap.toLowerCase().includes(needle) ||
				santri.nomorInduk.toLowerCase().includes(needle) ||
				(santri.kategoriLabels || []).some((label) => label.toLowerCase().includes(needle))
			);
		});
	});

	const openEdit = (santri) => {
		editSantri = santri;
		editActiveKeys = [...(santri.activeKeys || [])];
		my_modal_keaktifan.showModal();
	};

	const toggleMonth = (key) => {
		if (editActiveKeys.includes(key)) {
			editActiveKeys = editActiveKeys.filter((item) => item !== key);
		} else {
			editActiveKeys = [...editActiveKeys, key];
		}
	};

	const setYearMonths = (yearGroup, checked) => {
		const monthKeys = yearGroup.months.map((month) => month.key);
		if (checked) {
			editActiveKeys = [...new Set([...editActiveKeys, ...monthKeys])];
		} else {
			const monthKeySet = new Set(monthKeys);
			editActiveKeys = editActiveKeys.filter((key) => !monthKeySet.has(key));
		}
	};

	const isYearChecked = (yearGroup) => {
		return yearGroup.months.every((month) => editActiveKeys.includes(month.key));
	};
</script>

<svelte:head>
	<title>Keaktifan Santri</title>
</svelte:head>

<div class="flex flex-col lg:flex-row lg:items-end gap-3 mb-6">
	<div class="form-control w-full sm:w-72">
		<label class="label py-0" for="search-input"><span class="label-text text-xs">Cari Santri</span></label>
		<input
			id="search-input"
			type="text"
			placeholder="Cari nama, nomor induk, kategori..."
			class="input input-sm input-bordered w-full"
			bind:value={search}
		/>
	</div>
	<div class="form-control w-full sm:w-48">
		<label class="label py-0" for="filter-tahun"><span class="label-text text-xs">Tahun Masuk</span></label>
		<select id="filter-tahun" class="select select-sm select-bordered w-full" bind:value={selectedTahunMasuk}>
			<option value="">Semua Tahun Masuk</option>
			{#each data.tahunMasukOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</div>
	<div class="stats stats-horizontal shadow-sm border border-base-200 bg-base-100 w-full sm:w-auto">
		<div class="stat py-2 px-4">
			<div class="stat-title text-xs">Bulan Berjalan</div>
			<div class="stat-value text-sm">{currentLabel}</div>
		</div>
		<div class="stat py-2 px-4">
			<div class="stat-title text-xs">Santri</div>
			<div class="stat-value text-sm">{filteredSantris.length}</div>
		</div>
	</div>
</div>

{#if form?.message}
	<div class={`alert ${form.success === false || form.type === 'error' ? 'alert-error' : 'alert-success'} mb-4 shadow-sm`}>
		<span>{form.message}</span>
	</div>
{/if}
{#if form?.error}
	<div class="alert alert-error mb-4 shadow-sm">
		<span>{form.error}</span>
	</div>
{/if}

<div class="card bg-base-100 shadow-sm border border-base-200">
	<div class="overflow-x-auto">
		<table class="table table-zebra table-sm sm:table-md w-full">
			<thead>
				<tr>
					<th>No</th>
					<th>Nomor Induk</th>
					<th>Nama Lengkap</th>
					<th>Kategori</th>
					<th>Tanggal Masuk</th>
					<th>Status Data Santri</th>
					<th>Status Bulan Ini</th>
					<th>Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#if filteredSantris.length === 0}
					<tr>
						<td colspan="8" class="text-center py-4">Belum ada data santri.</td>
					</tr>
				{/if}
				{#each filteredSantris as santri, i}
					<tr>
						<td>{i + 1}</td>
						<td class="font-medium text-base-content/80 text-sm">{santri.nomorInduk}</td>
						<td class="font-semibold">{santri.namaLengkap}</td>
						<td>
							{#if santri.kategoriLabels?.length}
								<div class="flex flex-wrap gap-1">
									{#each santri.kategoriLabels as label}
										<span class="badge badge-outline badge-sm">{label}</span>
									{/each}
								</div>
							{:else}
								<span class="text-base-content/40 text-xs">-</span>
							{/if}
						</td>
						<td class="text-sm">{santri.tanggalMasuk || '-'}</td>
						<td>
							{#if santri.isActive}
								<div class="badge badge-success badge-sm gap-1"><span class="w-1.5 h-1.5 rounded-full bg-white"></span> Aktif</div>
							{:else}
								<div class="badge badge-ghost badge-sm">Tidak Aktif</div>
							{/if}
						</td>
						<td>
							{#if !santri.isActive}
								<div class="badge badge-neutral badge-sm">Sudah Tidak Aktif</div>
							{:else if santri.currentMonthActive}
								<div class="badge badge-success badge-sm">Sudah Diceklis</div>
							{:else}
								<div class="badge badge-warning badge-sm">Belum Diceklis</div>
							{/if}
						</td>
						<td class="flex gap-1 flex-wrap">
							{#if santri.isActive}
								<form method="POST" action="?/quickCheck" use:enhance class="inline">
									<input type="hidden" name="santriId" value={santri.id} />
									<button type="submit" class="btn btn-xs btn-outline btn-success" disabled={santri.currentMonthActive}>
										{santri.currentMonthActive ? 'Sudah Ceklis' : 'Ceklis Bulan Ini'}
									</button>
								</form>
							{/if}
							<button class="btn btn-xs btn-outline btn-primary" onclick={() => openEdit(santri)}>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
								Edit
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<dialog id="my_modal_keaktifan" class="modal">
	<div class="modal-box max-w-5xl">
		{#if editSantri}
			<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
				<div>
					<h3 class="font-bold text-lg">Keaktifan Santri</h3>
					<p class="text-sm text-base-content/70">{editSantri.namaLengkap} - {editSantri.nomorInduk}</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<span class="badge badge-outline">Masuk: {editSantri.tanggalMasuk || '-'}</span>
					<span class="badge {editActiveKeys.includes(data.currentPeriod.key) ? 'badge-success' : 'badge-warning'}">
						{currentLabel}
					</span>
				</div>
			</div>

			<form
				method="POST"
				action="?/save"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						my_modal_keaktifan.close();
						editSantri = null;
						editActiveKeys = [];
					};
				}}
			>
				<input type="hidden" name="santriId" value={editSantri.id} />
				<input type="hidden" name="activeKeys" value={JSON.stringify(editActiveKeys)} />

				<div class="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
					{#each editSantri.periods as yearGroup}
						<section class="border border-base-200 rounded-lg p-3">
							<div class="flex items-center justify-between gap-3 mb-3">
								<h4 class="font-semibold text-primary">{yearGroup.tahun}</h4>
								<label class="label cursor-pointer gap-2 py-0">
									<span class="label-text text-xs">Ceklis semua</span>
									<input
										type="checkbox"
										class="checkbox checkbox-sm checkbox-primary"
										checked={isYearChecked(yearGroup)}
										onchange={(e) => setYearMonths(yearGroup, e.target.checked)}
									/>
								</label>
							</div>
							<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
								{#each yearGroup.months as month}
									<label class="flex items-center gap-2 border border-base-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-base-200/60">
										<input
											type="checkbox"
											class="checkbox checkbox-sm checkbox-success"
											checked={editActiveKeys.includes(month.key)}
											onchange={() => toggleMonth(month.key)}
										/>
										<span class="text-sm">{month.namaBulan}</span>
									</label>
								{/each}
							</div>
						</section>
					{/each}
				</div>

				<div class="modal-action">
					<button type="button" class="btn" onclick={() => { my_modal_keaktifan.close(); editSantri = null; editActiveKeys = []; }}>
						Batal
					</button>
					<button type="submit" class="btn btn-primary">Simpan Keaktifan</button>
				</div>
			</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
