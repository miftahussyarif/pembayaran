<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	let { data, form } = $props();
	let editSantri = $state(null);
	let sortBy = $state('nama');
	let filterValue = $state('');
	let selectedTahunMasuk = $state('');
	let statusFilter = $state('');
	let searchQuery = $state('');
	let selectedSantris = $state([]);
	const isAdmin = $derived($page.data.user?.role === 'admin');

	// === Helper ===
	const getKategoriName = (id) => data.kategoris.find((k) => k.id === id)?.namaKategori || '';
	const getTahunNama = (id) => data.tahunAjarans.find((t) => t.id === id)?.nama || '';
	const getTahunOrder = (id) => {
		const index = data.tahunAjarans.findIndex((t) => t.id === Number(id));
		return index === -1 ? Number.MAX_SAFE_INTEGER : index;
	};

	// Ambil daftar kategori+tahun terakhir untuk display di tabel
	const getLatestKategoriLabels = (santri) => {
		if (!santri.kategoriTahun?.length) return [];
		// Group by tahunAjaranId
		const byTahun = new Map();
		for (const kt of santri.kategoriTahun) {
			if (!byTahun.has(kt.tahunAjaranId)) byTahun.set(kt.tahunAjaranId, []);
			byTahun.get(kt.tahunAjaranId).push(kt.kategoriId);
		}
		// Ambil semua tahun, ikuti urutan master tahun ajaran terbaru di atas
		const allTahunIds = [...byTahun.keys()].sort((a, b) => getTahunOrder(a) - getTahunOrder(b));
		// Tampilkan kategori dari tahun terbaru saja (untuk kolom tabel)
		const latestTahunId = allTahunIds[0];
		const latestKatIds = byTahun.get(latestTahunId) || [];
		return latestKatIds.map((id) => getKategoriName(id)).filter(Boolean);
	};

	// === Filter/Sort ===
	const filterOptions = $derived.by(() => {
		if (sortBy === 'kategori') {
			return data.kategoris.map((k) => k.namaKategori).filter(Boolean);
		}
		if (sortBy === 'tahun_ajaran') {
			return data.tahunAjarans.map((t) => t.nama).filter(Boolean);
		}
		const values = new Set();
		for (const santri of data.santris) {
			const value = santri.detail?.[sortBy];
			if (value) values.add(value);
		}
		return Array.from(values).sort((a, b) => a.localeCompare(b, 'id'));
	});

	const filteredSantris = $derived.by(() => {
		let list = data.santris;

		if (selectedTahunMasuk) {
			list = list.filter((santri) => String(santri.tahunMasuk) === String(selectedTahunMasuk));
		}

		if (statusFilter) {
			const isAktif = statusFilter === 'aktif';
			list = list.filter((s) => s.isActive === isAktif);
		}

		// Text search filter (name / nomor induk)
		const sq = searchQuery.trim().toLowerCase();
		if (sq) {
			list = list.filter((s) => {
				const nama = String(s.namaLengkap || '').toLowerCase();
				const nomor = String(s.nomorInduk || '').toLowerCase();
				return nama.includes(sq) || nomor.includes(sq);
			});
		}

		// Dropdown filter
		if (filterValue) {
			const needle = filterValue.toString().toLowerCase();
			if (sortBy === 'kategori') {
				list = list.filter((s) => getLatestKategoriLabels(s).some((l) => l.toLowerCase() === needle));
			} else if (sortBy === 'tahun_ajaran') {
				list = list.filter((s) => s.kategoriTahun?.some((kt) => getTahunNama(kt.tahunAjaranId).toLowerCase() === needle));
			} else {
				list = list.filter((s) => {
					const value = s.detail?.[sortBy];
					return value && value.toString().toLowerCase() === needle;
				});
			}
		}

		return list;
	});

	const sortedSantris = $derived.by(() => {
	       const list = [...filteredSantris];
	       if (sortBy === 'nama') {
		       list.sort((a, b) => {
			       const av = a.namaLengkap?.toLowerCase() || '';
			       const bv = b.namaLengkap?.toLowerCase() || '';
			       return av.localeCompare(bv, 'id');
		       });
	       } else if (sortBy === 'nomorInduk') {
		       list.sort((a, b) => {
			       const av = a.nomorInduk?.toString() || '';
			       const bv = b.nomorInduk?.toString() || '';
			       return av.localeCompare(bv, 'id');
		       });
	       } else if (sortBy === 'tanggalMasukTerbaru') {
		       list.sort((a, b) => {
			       const av = a.tanggalMasuk ? new Date(a.tanggalMasuk) : new Date(0);
			       const bv = b.tanggalMasuk ? new Date(b.tanggalMasuk) : new Date(0);
			       return bv - av;
		       });
	       } else if (sortBy === 'tanggalMasukTerlama') {
		       list.sort((a, b) => {
			       const av = a.tanggalMasuk ? new Date(a.tanggalMasuk) : new Date(0);
			       const bv = b.tanggalMasuk ? new Date(b.tanggalMasuk) : new Date(0);
			       return av - bv;
		       });
	       } else if (sortBy === 'tanggalKeluarTerbaru') {
		       list.sort((a, b) => {
			       // Untuk terbaru, data kosong/belum keluar diletakkan di akhir (atau di awal? biasanya di akhir)
			       const av = a.tanggalKeluar ? new Date(a.tanggalKeluar) : new Date(0);
			       const bv = b.tanggalKeluar ? new Date(b.tanggalKeluar) : new Date(0);
			       return bv - av;
		       });
	       } else if (sortBy === 'tanggalKeluarTerlama') {
		       list.sort((a, b) => {
			       // Untuk terlama, yang punya tanggal keluar lebih dulu diurutkan pertama.
			       // Yang belum keluar (Date(0) atau MAX_VALUE) kita letakkan di akhir agar tidak muncul pertama.
			       const av = a.tanggalKeluar ? new Date(a.tanggalKeluar).getTime() : Number.MAX_SAFE_INTEGER;
			       const bv = b.tanggalKeluar ? new Date(b.tanggalKeluar).getTime() : Number.MAX_SAFE_INTEGER;
			       return av - bv;
		       });
	       } else {
		       // fallback ke nama
		       list.sort((a, b) => {
			       const av = a.namaLengkap?.toLowerCase() || '';
			       const bv = b.namaLengkap?.toLowerCase() || '';
			       return av.localeCompare(bv, 'id');
		       });
	       }
	       return list;
	});

	// === Multi-kategori form state untuk Tambah ===
	let addKategoriRows = $state([{ tahunAjaranId: '', kategoriIds: [] }]);

	const addKategoriRow = () => { addKategoriRows = [...addKategoriRows, { tahunAjaranId: '', kategoriIds: [] }]; };
	const removeKategoriRow = (i) => { addKategoriRows = addKategoriRows.filter((_, idx) => idx !== i); };
	const toggleAddKategori = (rowIdx, katId) => {
		const row = addKategoriRows[rowIdx];
		if (row.kategoriIds.includes(katId)) {
			row.kategoriIds = row.kategoriIds.filter((id) => id !== katId);
		} else {
			row.kategoriIds = [...row.kategoriIds, katId];
		}
		addKategoriRows = [...addKategoriRows];
	};

	// === Multi-kategori form state untuk Edit ===
	let editKategoriRows = $state([]);

	function autoFillEditKategoriRows() {
		if (!editSantri || !editSantri.isActive || !editSantri.tanggalMasuk) return;
		const masukYear = new Date(editSantri.tanggalMasuk).getFullYear();
		let keluarYear = new Date().getFullYear();
		if (editSantri.tanggalKeluar) {
			keluarYear = new Date(editSantri.tanggalKeluar).getFullYear();
		}

		const byTahun = new Map();
		for (const row of editKategoriRows) {
			if (row.tahunAjaranId) byTahun.set(row.tahunAjaranId, row.kategoriIds);
		}

		let modified = false;
		for (const ta of data.tahunAjarans) {
			const match = ta.nama.match(/^(\d{4})/);
			if (match) {
				const startYear = parseInt(match[1], 10);
				if (startYear >= masukYear && startYear <= keluarYear) {
					if (!byTahun.has(ta.id)) {
						byTahun.set(ta.id, []);
						modified = true;
					}
				}
			}
		}

		if (modified) {
			const newRows = [...byTahun.entries()]
				.sort(([a], [b]) => getTahunOrder(a) - getTahunOrder(b))
				.map(([tid, kids]) => ({ tahunAjaranId: tid, kategoriIds: kids }));

			const oldestFirst = [...newRows].reverse();
			let lastKids = [];
			for (const row of oldestFirst) {
				if (row.kategoriIds.length === 0 && lastKids.length > 0) {
					row.kategoriIds = [...lastKids];
				} else if (row.kategoriIds.length > 0) {
					lastKids = [...row.kategoriIds];
				}
			}
			editKategoriRows = oldestFirst.reverse();
		}
	}

	function handleEditTanggalKeluarChange() {
		if (editSantri.tanggalKeluar) {
			const today = new Date();
			const pad = (n) => String(n).padStart(2, '0');
			const localDateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
			if (editSantri.tanggalKeluar <= localDateStr) {
				editSantri.isActive = false;
			}
		}
		autoFillEditKategoriRows();
	}

	const openEdit = (santri) => {
		editSantri = { ...santri, detail: santri.detail || {} };
		// Build editKategoriRows dari kategoriTahun santri
		const byTahun = new Map();
		for (const kt of (santri.kategoriTahun || [])) {
			if (!byTahun.has(kt.tahunAjaranId)) byTahun.set(kt.tahunAjaranId, []);
			byTahun.get(kt.tahunAjaranId).push(kt.kategoriId);
		}
		if (byTahun.size === 0) {
			editKategoriRows = [{ tahunAjaranId: '', kategoriIds: [] }];
		} else {
			editKategoriRows = [...byTahun.entries()]
				.sort(([a], [b]) => getTahunOrder(a) - getTahunOrder(b))
				.map(([tid, kids]) => ({ tahunAjaranId: tid, kategoriIds: kids }));
		}
		autoFillEditKategoriRows();
		my_modal_edit_santri.showModal();
	};
	const addEditKategoriRow = () => { editKategoriRows = [...editKategoriRows, { tahunAjaranId: '', kategoriIds: [] }]; };
	const removeEditKategoriRow = (i) => { editKategoriRows = editKategoriRows.filter((_, idx) => idx !== i); };
	const toggleEditKategori = (rowIdx, katId) => {
		const row = editKategoriRows[rowIdx];
		if (row.kategoriIds.includes(katId)) {
			row.kategoriIds = row.kategoriIds.filter((id) => id !== katId);
		} else {
			row.kategoriIds = [...row.kategoriIds, katId];
		}
		editKategoriRows = [...editKategoriRows];
	};
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
</script>

<svelte:head>
	<title>Data Santri</title>
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

<div class="flex flex-col lg:flex-row lg:items-end gap-3 mb-6 print:hidden">
	<div class="form-control w-full sm:w-56">
		<label class="label py-0" for="sort-select"><span class="label-text text-xs">Sorting</span></label>
		<select id="sort-select" class="select select-sm select-bordered w-full" bind:value={sortBy} onchange={() => { filterValue = ''; }}>
			   <option value="nama">Nama Santri</option>
			   <option value="nomorInduk">Nomor Induk</option>
			   <option value="tanggalMasukTerbaru">Tanggal Masuk Terbaru</option>
			   <option value="tanggalMasukTerlama">Tanggal Masuk Terlama</option>
			   <option value="tanggalKeluarTerbaru">Tanggal Keluar Terbaru</option>
			   <option value="tanggalKeluarTerlama">Tanggal Keluar Terlama</option>
			   <option value="kategori">Kategori Santri</option>
			   <option value="tahun_ajaran">Tahun Ajaran</option>
			   <option value="kabupaten">Alamat: Kabupaten</option>
			   <option value="kecamatan">Alamat: Kecamatan</option>
			   <option value="provinsi">Alamat: Provinsi</option>
		</select>
	</div>
	<div class="form-control w-full sm:w-56">
		<label class="label py-0" for="filter-select"><span class="label-text text-xs">Filter</span></label>
		<select id="filter-select" class="select select-sm select-bordered w-full" bind:value={filterValue}>
			<option value="">Semua</option>
			{#each filterOptions as opt}
				<option value={opt}>{opt}</option>
			{/each}
		</select>
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
	<div class="form-control w-full sm:w-48">
		<label class="label py-0" for="filter-status"><span class="label-text text-xs">Status Santri</span></label>
		<select id="filter-status" class="select select-sm select-bordered w-full" bind:value={statusFilter}>
			<option value="">Semua Status</option>
			<option value="aktif">Santri Aktif</option>
			<option value="nonaktif">Santri Nonaktif</option>
		</select>
	</div>
	<button type="button" class="btn btn-sm btn-outline btn-secondary w-full sm:w-auto" onclick={() => window.print()}>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
			<path d="M6 2a1 1 0 00-1 1v2h10V3a1 1 0 00-1-1H6z" />
			<path fill-rule="evenodd" d="M4 7a2 2 0 00-2 2v5a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2H4zm2 9v-4h8v4H6z" clip-rule="evenodd" />
		</svg>
		Cetak List
	</button>
	<button class="btn btn-sm btn-outline w-full sm:w-auto" onclick={() => my_modal_import_santri.showModal()}>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
			<path d="M3 14a1 1 0 011-1h3v-2H5a1 1 0 110-2h2V7a1 1 0 112 0v2h2a1 1 0 110 2H9v2h3a1 1 0 011 1v2H3v-2z" />
			<path d="M7 3a1 1 0 012 0v7H7V3z" />
		</svg>
		Import Excel
	</button>
	<div class="form-control w-full sm:w-56">
		<label class="label py-0" for="search-input"><span class="label-text text-xs">Cari Santri</span></label>
		<input id="search-input" type="text" placeholder="Cari santri..." class="input input-sm input-bordered w-full" bind:value={searchQuery} />
	</div>
	<button class="btn btn-sm btn-primary w-full sm:w-auto" onclick={() => my_modal_santri.showModal()}>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
			<path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
		</svg>
		Tambah Santri
	</button>
	{#if isAdmin && selectedSantris.length > 0}
		<form method="POST" action="?/bulkDelete" use:enhance={() => {
			return async ({ update, result }) => {
				await update();
				if (result?.type === 'success' || result?.data?.success) {
					selectedSantris = [];
				}
			};
		}} class="w-full sm:w-auto">
			<input type="hidden" name="ids" value={JSON.stringify(selectedSantris)} />
			<button type="submit" class="btn btn-sm btn-error w-full" onclick={(e) => { if(!confirm(`Yakin hapus ${selectedSantris.length} santri terpilih?`)) e.preventDefault() }}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
				Hapus ({selectedSantris.length})
			</button>
		</form>
	{/if}
</div>

{#if form?.type}
	<div class={`alert ${form.type === 'success' ? 'alert-success' : 'alert-error'} mb-4 shadow-sm print:hidden`}>
		<span>{form.message}</span>
	</div>
{/if}
{#if form?.success === false && form?.error}
	<div class="alert alert-error mb-4 shadow-sm print:hidden">
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
		<span>{form.error}</span>
	</div>
{/if}

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
			<h2 class="text-xl font-bold tracking-wide text-primary">LIST SANTRI</h2>
			{#if filterValue}
				<p class="text-xs text-base-content/60">Filter: {filterValue}</p>
			{/if}
			{#if searchQuery}
				<p class="text-xs text-base-content/60">Pencarian: "{searchQuery}"</p>
			{/if}
		</div>
	</div>
</div>

<div class="card bg-base-100 shadow-sm border border-base-200">
	<div class="overflow-x-auto">
		<table class="table table-zebra table-sm sm:table-md w-full">
			<thead>
				   <tr>
					   {#if isAdmin}
						   <th class="w-10 print:hidden">{''}</th>
					   {/if}
					   <th class="w-12">No</th>
					   <th class="w-32">Nomor Induk</th>
					   <th class="min-w-48">Nama Lengkap</th>
					   <th class="w-40">Kategori</th>
					   <th class="w-36">Tanggal Masuk</th>
					   <th class="w-36">Tanggal Keluar</th>
					   <th class="w-28">Status</th>
					   {#if !window?.matchMedia?.('print').matches}
						   <th class="w-48 print:hidden">Aksi</th>
					   {/if}
				   </tr>
			</thead>
			<tbody>
				{#if data.santris.length === 0}
					<tr>
						<td colspan={isAdmin ? 9 : 8} class="text-center py-4">Belum ada data santri.</td>
					</tr>
				{/if}
				   {#each sortedSantris as santri, i}
					   <tr>
						   {#if isAdmin}
							   <td class="w-10 print:hidden">
								   <input id={`selectSantri-${santri.id}`} type="checkbox" class="checkbox checkbox-sm checkbox-primary"
									   checked={selectedSantris.includes(santri.id)}
									   onchange={(e) => {
										   if (e.target.checked) selectedSantris = [...selectedSantris, santri.id];
										   else selectedSantris = selectedSantris.filter(id => id !== santri.id);
									   }} />
							   </td>
						   {/if}
						   <td class="w-12">{i + 1}</td>
						   <td class="w-32 font-medium text-base-content/80 text-sm">{santri.nomorInduk}</td>
						   <td class="min-w-48 font-semibold">{santri.namaLengkap}</td>
						   <td class="w-40">
						   {#if santri.kategoriTahun?.length}
							   {@const labels = getLatestKategoriLabels(santri)}
							   <div class="flex flex-wrap gap-1">
								   {#each labels as label}
									   <span class="badge badge-outline badge-sm">{label}</span>
								   {/each}
							   </div>
						   {:else if santri.kategoriId}
							   {@const kat = data.kategoris.find(k => k.id === santri.kategoriId)}
							   {#if kat}<span class="badge badge-outline badge-sm">{kat.namaKategori}</span>{/if}
						   {:else}
							   <span class="text-base-content/40 text-xs">-</span>
						   {/if}
					   </td>
						   <td class="w-36 text-sm">{santri.tanggalMasuk || '-'}</td>
						   <td class="w-36 text-sm">{santri.tanggalKeluar || '-'}</td>
						   <td class="w-28">
							   {#if santri.isActive}
								   <div class="badge badge-success badge-sm gap-1"><span class="w-1.5 h-1.5 rounded-full bg-white"></span> Aktif</div>
							   {:else}
								   <div class="badge badge-ghost badge-sm">Berhenti</div>
							   {/if}
						   </td>
						   {#if !window?.matchMedia?.('print').matches}
						   <td class="w-48 print:hidden">
							   <div class="flex gap-1 flex-wrap">
							   <button class="btn btn-xs btn-outline btn-primary" onclick={() => openEdit(santri)}>
								   <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
								   Edit
							   </button>
							   <a class="btn btn-xs btn-outline btn-secondary" href={`/master/santri/cetak/${santri.id}`} target="_blank" rel="noopener">
								   <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
								   Cetak
							   </a>
							   <form method="POST" action="?/toggleAktif" class="inline" use:enhance>
								   <input type="hidden" name="id" value={santri.id} />
								   {#if santri.isActive}
								   <button type="submit" class="btn btn-xs btn-outline btn-error" onclick={(e) => { if(!confirm('Keluarkan santri pada hari ini?')) e.preventDefault() }}>
									   Nonaktifkan
								   </button>
								   {:else}
								   <button type="submit" class="btn btn-xs btn-outline btn-success">
									   Aktifkan
								   </button>
								   {/if}
							   </form>
							   <form method="POST" action="?/delete" class="inline" use:enhance>
								   <input type="hidden" name="id" value={santri.id} />
								   <button type="submit" class="btn btn-xs btn-ghost text-error" onclick={(e) => { if(!confirm('Hapus santri ini?')) e.preventDefault() }}>Hapus</button>
							   </form>
							   </div>
						   </td>
						   {/if}
					   </tr>
				{/each}
			</tbody>
		</table>
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

<!-- Modal Import Santri -->
<dialog id="my_modal_import_santri" class="modal">
	<div class="modal-box max-w-lg">
		<h3 class="font-bold text-lg mb-2">Import Santri (Excel/CSV)</h3>
		<p class="text-sm text-base-content/60 mb-4">
			Pastikan file CSV/Excel memiliki header yang sesuai dengan template terbaru (mendukung kategori per tahun ajaran serta tanggal mulai SMP/SMK).
		</p>
		<div class="alert alert-info mb-4 flex items-center justify-between gap-3">
			<span>Unduh template contoh agar formatnya benar.</span>
			<div class="flex gap-3">
				<a href="/master/santri/sample.xlsx" class="link link-primary font-semibold" target="_blank" rel="noopener">Sample .xlsx</a>
				<a href="/master/santri/sample.csv" class="link link-primary font-semibold" target="_blank" rel="noopener">Sample .csv</a>
			</div>
		</div>
		<form method="POST" action="?/import" enctype="multipart/form-data" use:enhance>
			<div class="form-control w-full mb-4">
				<label class="label" for="importFile"><span class="label-text">File Excel/CSV</span></label>
				<input id="importFile" name="file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="file-input file-input-bordered w-full" required />
				<div class="label py-1">
					<span class="label-text-alt text-base-content/60">Tanggal gunakan format YYYY-MM-DD. Kolom kategori boleh kosong.</span>
				</div>
			</div>
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => my_modal_import_santri.close()}>Batal</button>
				<button type="submit" class="btn btn-primary">Import</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<!-- Modal Tambah Santri -->
<dialog id="my_modal_santri" class="modal">
	<div class="modal-box max-w-2xl">
		<h3 class="font-bold text-lg mb-4">Tambah Data Santri</h3>
		<form method="POST" action="?/create" use:enhance={() => {
			return async ({ update, result }) => {
				await update();
				if (result?.type === 'success' || result?.data?.success) {
					addKategoriRows = [{ tahunAjaranId: '', kategoriIds: [] }];
				}
				my_modal_santri.close();
			};
		}}>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-x-4">
				<div class="form-control w-full mb-3">
					<label class="label" for="nomorInduk"><span class="label-text">Nomor Induk</span></label>
					<input type="text" id="nomorInduk" name="nomorInduk" placeholder="Misal: 24005" class="input input-bordered w-full" required />
				</div>
				<div class="form-control w-full mb-3">
					<label class="label" for="namaLengkap"><span class="label-text">Nama Lengkap</span></label>
					<input type="text" id="namaLengkap" name="namaLengkap" placeholder="Masukkan nama santri" class="input input-bordered w-full" required />
				</div>
			</div>
			<!-- Kategori per Tahun Ajaran -->
		<input type="hidden" name="kategoriTahunJson" value={JSON.stringify(addKategoriRows.filter(r => r.tahunAjaranId && r.kategoriIds.length))} />
		<div class="mb-4">
			<div class="flex items-center justify-between mb-2">
				<p class="label-text font-semibold text-primary">Kategori per Tahun Ajaran</p>
				<button type="button" class="btn btn-xs btn-outline btn-primary" onclick={addKategoriRow}>+ Tambah Tahun</button>
			</div>
			{#each addKategoriRows as row, rowIdx}
				<div class="border border-base-200 rounded-lg p-3 mb-2">
					<div class="flex gap-2 items-center mb-2">
						<div class="form-control flex-1">
							<select id={`addKategoriTahun-${rowIdx}`} class="select select-sm select-bordered w-full" bind:value={row.tahunAjaranId}>
								<option value="">-- Pilih Tahun Ajaran --</option>
								<option value="all">Semua Tahun</option>
								{#each data.tahunAjarans as ta}
									<option value={ta.id}>{ta.nama}</option>
								{/each}
							</select>
						</div>
						{#if addKategoriRows.length > 1}
							<button type="button" class="btn btn-xs btn-ghost text-error" onclick={() => removeKategoriRow(rowIdx)}>✕</button>
						{/if}
					</div>
					<div class="flex flex-wrap gap-2">
						{#each data.kategoris as kat}
							<label class="flex items-center gap-1 cursor-pointer">
								<input id={`addKategori-${rowIdx}-${kat.id}`} type="checkbox"
									class="checkbox checkbox-sm checkbox-primary"
									checked={row.kategoriIds.includes(kat.id)}
									onchange={() => toggleAddKategori(rowIdx, kat.id)} />
								<span class="text-sm">{kat.namaKategori}</span>
							</label>
						{/each}
					</div>
				</div>
			{/each}
		</div>
		<div class="flex gap-4 mb-3">
			<div class="form-control w-1/2">
				<label class="label" for="tanggalMasuk"><span class="label-text">Tanggal Masuk</span></label>
				<input type="date" id="tanggalMasuk" name="tanggalMasuk" class="input input-bordered w-full" />
			</div>
			<div class="form-control w-1/2">
				<label class="label" for="tanggalKeluar"><span class="label-text">Tanggal Keluar (Opsional)</span></label>
				<input type="date" id="tanggalKeluar" name="tanggalKeluar" class="input input-bordered w-full" />
			</div>
		</div>
		<div class="form-control w-full mb-4">
			<label class="label cursor-pointer justify-start gap-4" for="isActiveCreate">
				<input type="checkbox" id="isActiveCreate" name="isActive" class="toggle toggle-primary" checked />
				<span class="label-text">Santri Aktif</span>
			</label>
		</div>


			<h4 class="text-base font-bold text-primary mt-2 mb-2 border-b border-primary/40 pb-1">I. Identitas Peserta Didik</h4>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="addTempatLahir"><span class="label-text">Tempat Lahir</span></label>
					<input type="text" id="addTempatLahir" name="tempatLahir" class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="addTanggalLahir"><span class="label-text">Tanggal Lahir</span></label>
					<input type="date" id="addTanggalLahir" name="tanggalLahir" class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="addJenisKelamin"><span class="label-text">Jenis Kelamin</span></label>
					<select id="addJenisKelamin" name="jenisKelamin" class="select select-bordered w-full">
						<option value="">Pilih...</option>
						<option value="Laki-Laki">Laki-Laki</option>
						<option value="Perempuan">Perempuan</option>
					</select>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="addGolonganDarah"><span class="label-text">Golongan Darah</span></label>
					<select id="addGolonganDarah" name="golonganDarah" class="select select-bordered w-full">
						<option value="">Pilih...</option>
						<option value="A">A</option>
						<option value="B">B</option>
						<option value="AB">AB</option>
						<option value="O">O</option>
						<option value="Tidak Tahu">Tidak Tahu</option>
					</select>
				</div>
				<div class="form-control w-full">
					<label class="label" for="addNik"><span class="label-text">NIK</span></label>
					<input type="text" id="addNik" name="nik" class="input input-bordered w-full" />
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="addNoKk"><span class="label-text">No. Kartu Keluarga</span></label>
					<input type="text" id="addNoKk" name="noKk" class="input input-bordered w-full" />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="form-control w-full">
						<label class="label" for="addAnakKe"><span class="label-text">Anak Ke-</span></label>
						<input type="number" id="addAnakKe" name="anakKe" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full">
						<label class="label" for="addJumlahSaudara"><span class="label-text">Jumlah Saudara</span></label>
						<input type="number" id="addJumlahSaudara" name="jumlahSaudara" class="input input-bordered w-full" />
					</div>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="addTinggiCm"><span class="label-text">Tinggi (cm)</span></label>
					<input type="number" id="addTinggiCm" name="tinggiCm" class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="addBeratKg"><span class="label-text">Berat (kg)</span></label>
					<input type="number" id="addBeratKg" name="beratKg" class="input input-bordered w-full" />
				</div>
			</div>
			<div class="form-control w-full mb-3">
				<label class="label" for="addAlamatLengkap"><span class="label-text">Alamat Lengkap (Jalan / Dusun)</span></label>
				<input type="text" id="addAlamatLengkap" name="alamatLengkap" class="input input-bordered w-full" />
			</div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="addRt"><span class="label-text">RT</span></label>
					<input type="text" id="addRt" name="rt" class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="addRw"><span class="label-text">RW</span></label>
					<input type="text" id="addRw" name="rw" class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="addDesaKelurahan"><span class="label-text">Desa/Kelurahan</span></label>
					<input type="text" id="addDesaKelurahan" name="desaKelurahan" class="input input-bordered w-full" />
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="addKecamatan"><span class="label-text">Kecamatan</span></label>
					<input type="text" id="addKecamatan" name="kecamatan" class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="addKabupaten"><span class="label-text">Kabupaten</span></label>
					<input type="text" id="addKabupaten" name="kabupaten" class="input input-bordered w-full" />
				</div>
			</div>
			<div class="form-control w-full mb-3">
				<label class="label" for="addProvinsi"><span class="label-text">Provinsi</span></label>
				<input type="text" id="addProvinsi" name="provinsi" class="input input-bordered w-full" />
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="addNoKip"><span class="label-text">No. Penerima KIP (Jika Ada)</span></label>
					<input type="text" id="addNoKip" name="noKip" class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="addNoKisKpsPkh"><span class="label-text">No. KIS/KPS/PKH (Jika Ada)</span></label>
					<input type="text" id="addNoKisKpsPkh" name="noKisKpsPkh" class="input input-bordered w-full" />
				</div>
			</div>
			<div class="form-control w-full mb-4">
				<label class="label" for="addKebutuhanKhusus"><span class="label-text">Kebutuhan Khusus</span></label>
				<select id="addKebutuhanKhusus" name="kebutuhanKhusus" class="select select-bordered w-full">
					<option value="">Pilih...</option>
					<option value="Tidak">Tidak</option>
					<option value="Netra">Netra</option>
					<option value="Rungu">Rungu</option>
					<option value="Grahita">Grahita</option>
					<option value="Daksa">Daksa</option>
					<option value="Laras">Laras</option>
					<option value="Wicara">Wicara</option>
					<option value="Autis">Autis</option>
					<option value="Lainnya">Lainnya</option>
				</select>
			</div>

			<h4 class="text-base font-bold text-primary mt-2 mb-2 border-b border-primary/40 pb-1">III. Data Orang Tua / Wali</h4>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<div class="border border-base-200 rounded-lg p-3">
					<h5 class="font-semibold text-sm text-primary mb-2">Data Ayah / Wali</h5>
					<div class="form-control w-full mb-2">
						<label class="label" for="addNamaAyah"><span class="label-text">Nama Ayah</span></label>
						<input type="text" id="addNamaAyah" name="namaAyah" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="addTanggalLahirAyah"><span class="label-text">Tanggal Lahir Ayah</span></label>
						<input type="date" id="addTanggalLahirAyah" name="tanggalLahirAyah" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="addPendidikanAyah"><span class="label-text">Pendidikan Terakhir</span></label>
						<select id="addPendidikanAyah" name="pendidikanAyah" class="select select-bordered w-full">
							<option value="">Pilih...</option>
							<option value="Tidak Sekolah">Tidak Sekolah</option>
							<option value="SD/MI">SD/MI</option>
							<option value="SMP/MTs">SMP/MTs</option>
							<option value="SMA/SMK/MA">SMA/SMK/MA</option>
							<option value="D1/D2/D3">D1/D2/D3</option>
							<option value="S1">S1</option>
							<option value="S2">S2</option>
							<option value="S3">S3</option>
						</select>
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="addNikAyah"><span class="label-text">NIK Ayah</span></label>
						<input type="text" id="addNikAyah" name="nikAyah" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="addAlamatAyah"><span class="label-text">Alamat</span></label>
						<input type="text" id="addAlamatAyah" name="alamatAyah" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="addNoHpAyah"><span class="label-text">No. HP</span></label>
						<input type="text" id="addNoHpAyah" name="noHpAyah" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="addPekerjaanAyah"><span class="label-text">Pekerjaan</span></label>
						<input type="text" id="addPekerjaanAyah" name="pekerjaanAyah" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full">
						<label class="label" for="addPenghasilanAyah"><span class="label-text">Penghasilan (Rp)</span></label>
						<input type="number" id="addPenghasilanAyah" name="penghasilanAyah" class="input input-bordered w-full" />
					</div>
				</div>
				<div class="border border-base-200 rounded-lg p-3">
					<h5 class="font-semibold text-sm text-primary mb-2">Data Ibu</h5>
					<div class="form-control w-full mb-2">
						<label class="label" for="addNamaIbu"><span class="label-text">Nama Ibu</span></label>
						<input type="text" id="addNamaIbu" name="namaIbu" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="addTanggalLahirIbu"><span class="label-text">Tanggal Lahir Ibu</span></label>
						<input type="date" id="addTanggalLahirIbu" name="tanggalLahirIbu" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="addPendidikanIbu"><span class="label-text">Pendidikan Terakhir</span></label>
						<select id="addPendidikanIbu" name="pendidikanIbu" class="select select-bordered w-full">
							<option value="">Pilih...</option>
							<option value="Tidak Sekolah">Tidak Sekolah</option>
							<option value="SD/MI">SD/MI</option>
							<option value="SMP/MTs">SMP/MTs</option>
							<option value="SMA/SMK/MA">SMA/SMK/MA</option>
							<option value="D1/D2/D3">D1/D2/D3</option>
							<option value="S1">S1</option>
							<option value="S2">S2</option>
							<option value="S3">S3</option>
						</select>
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="addNikIbu"><span class="label-text">NIK Ibu</span></label>
						<input type="text" id="addNikIbu" name="nikIbu" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="addAlamatIbu"><span class="label-text">Alamat</span></label>
						<input type="text" id="addAlamatIbu" name="alamatIbu" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="addPekerjaanIbu"><span class="label-text">Pekerjaan</span></label>
						<input type="text" id="addPekerjaanIbu" name="pekerjaanIbu" class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full">
						<label class="label" for="addPenghasilanIbu"><span class="label-text">Penghasilan (Rp)</span></label>
						<input type="number" id="addPenghasilanIbu" name="penghasilanIbu" class="input input-bordered w-full" />
					</div>
				</div>
			</div>
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => my_modal_santri.close()}>Batal</button>
				<button type="submit" class="btn btn-primary">Simpan</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<!-- Modal Edit Santri -->
<dialog id="my_modal_edit_santri" class="modal">
	<div class="modal-box max-w-5xl">
		<h3 class="font-bold text-lg mb-4">Edit Data Santri</h3>
		{#if editSantri}
		<form method="POST" action="?/update" use:enhance={() => {
			return async ({ update }) => { await update(); my_modal_edit_santri.close(); editSantri = null; };
		}}>
			<input type="hidden" name="id" value={editSantri.id} />
			<div class="form-control w-full mb-3">
				<label class="label" for="editNomorInduk"><span class="label-text">Nomor Induk</span></label>
				<input type="text" id="editNomorInduk" name="nomorInduk" value={editSantri.nomorInduk} class="input input-bordered w-full" required />
			</div>
			<div class="form-control w-full mb-3">
				<label class="label" for="editNamaLengkap"><span class="label-text">Nama Lengkap</span></label>
				<input type="text" id="editNamaLengkap" name="namaLengkap" value={editSantri.namaLengkap} class="input input-bordered w-full" required />
			</div>
			<!-- Kategori per Tahun Ajaran (Edit) -->
			<input type="hidden" name="kategoriTahunJson" value={JSON.stringify(editKategoriRows.filter(r => r.tahunAjaranId && r.kategoriIds.length))} />
			<div class="mb-4">
				<div class="flex items-center justify-between mb-2">
					<p class="label-text font-semibold text-primary">Kategori per Tahun Ajaran</p>
					<button type="button" class="btn btn-xs btn-outline btn-primary" onclick={addEditKategoriRow}>+ Tambah Tahun</button>
				</div>
				{#each editKategoriRows as row, rowIdx}
					<div class="border border-base-200 rounded-lg p-3 mb-2">
						<div class="flex gap-2 items-center mb-2">
							<div class="form-control flex-1">
								<select id={`editKategoriTahun-${rowIdx}`} class="select select-sm select-bordered w-full" bind:value={row.tahunAjaranId}>
									<option value="">-- Pilih Tahun Ajaran --</option>
									<option value="all">Semua Tahun</option>
									{#each data.tahunAjarans as ta}
										<option value={ta.id}>{ta.nama}</option>
									{/each}
								</select>
							</div>
							{#if editKategoriRows.length > 1}
								<button type="button" class="btn btn-xs btn-ghost text-error" onclick={() => removeEditKategoriRow(rowIdx)}>✕</button>
							{/if}
						</div>
						<div class="flex flex-wrap gap-2">
							{#each data.kategoris as kat}
								<label class="flex items-center gap-1 cursor-pointer">
									<input id={`editKategori-${rowIdx}-${kat.id}`} type="checkbox"
										class="checkbox checkbox-sm checkbox-primary"
										checked={row.kategoriIds.includes(kat.id)}
										onchange={() => toggleEditKategori(rowIdx, kat.id)} />
									<span class="text-sm">{kat.namaKategori}</span>
								</label>
							{/each}
						</div>
					</div>
				{/each}
			</div>
			<div class="flex gap-4 mb-3">
				<div class="form-control w-1/2">
					<label class="label" for="editTanggalMasuk"><span class="label-text">Tanggal Masuk</span></label>
					<input type="date" id="editTanggalMasuk" name="tanggalMasuk" bind:value={editSantri.tanggalMasuk} class="input input-bordered w-full" onchange={autoFillEditKategoriRows} />
				</div>
				<div class="form-control w-1/2">
					<label class="label" for="editTanggalKeluar"><span class="label-text">Tanggal Keluar (Opsional)</span></label>
					<input type="date" id="editTanggalKeluar" name="tanggalKeluar" bind:value={editSantri.tanggalKeluar} class="input input-bordered w-full" onchange={handleEditTanggalKeluarChange} />
				</div>
			</div>
			<div class="form-control w-full mb-4">
				<label class="label cursor-pointer justify-start gap-4" for="isActiveEdit">
					<input type="checkbox" id="isActiveEdit" name="isActive" class="toggle toggle-primary" bind:checked={editSantri.isActive} onchange={autoFillEditKategoriRows} />
					<span class="label-text">Santri Aktif</span>
				</label>
			</div>


			<h4 class="text-base font-bold text-primary mt-2 mb-2 border-b border-primary/40 pb-1">I. Identitas Peserta Didik</h4>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="tempatLahir"><span class="label-text">Tempat Lahir</span></label>
					<input type="text" id="tempatLahir" name="tempatLahir" value={editSantri.detail?.tempatLahir || ''} class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="tanggalLahir"><span class="label-text">Tanggal Lahir</span></label>
					<input type="date" id="tanggalLahir" name="tanggalLahir" value={editSantri.detail?.tanggalLahir || ''} class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="jenisKelamin"><span class="label-text">Jenis Kelamin</span></label>
					<select id="jenisKelamin" name="jenisKelamin" class="select select-bordered w-full">
						<option value="" selected={!editSantri.detail?.jenisKelamin}>Pilih...</option>
						<option value="Laki-Laki" selected={editSantri.detail?.jenisKelamin === 'Laki-Laki'}>Laki-Laki</option>
						<option value="Perempuan" selected={editSantri.detail?.jenisKelamin === 'Perempuan'}>Perempuan</option>
					</select>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="golonganDarah"><span class="label-text">Golongan Darah</span></label>
					<select id="golonganDarah" name="golonganDarah" class="select select-bordered w-full">
						<option value="" selected={!editSantri.detail?.golonganDarah}>Pilih...</option>
						<option value="A" selected={editSantri.detail?.golonganDarah === 'A'}>A</option>
						<option value="B" selected={editSantri.detail?.golonganDarah === 'B'}>B</option>
						<option value="AB" selected={editSantri.detail?.golonganDarah === 'AB'}>AB</option>
						<option value="O" selected={editSantri.detail?.golonganDarah === 'O'}>O</option>
						<option value="Tidak Tahu" selected={editSantri.detail?.golonganDarah === 'Tidak Tahu'}>Tidak Tahu</option>
					</select>
				</div>
				<div class="form-control w-full">
					<label class="label" for="nik"><span class="label-text">NIK</span></label>
					<input type="text" id="nik" name="nik" value={editSantri.detail?.nik || ''} class="input input-bordered w-full" />
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="noKk"><span class="label-text">No. Kartu Keluarga</span></label>
					<input type="text" id="noKk" name="noKk" value={editSantri.detail?.noKk || ''} class="input input-bordered w-full" />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="form-control w-full">
						<label class="label" for="anakKe"><span class="label-text">Anak Ke-</span></label>
						<input type="number" id="anakKe" name="anakKe" value={editSantri.detail?.anakKe ?? ''} class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full">
						<label class="label" for="jumlahSaudara"><span class="label-text">Jumlah Saudara</span></label>
						<input type="number" id="jumlahSaudara" name="jumlahSaudara" value={editSantri.detail?.jumlahSaudara ?? ''} class="input input-bordered w-full" />
					</div>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="tinggiCm"><span class="label-text">Tinggi (cm)</span></label>
					<input type="number" id="tinggiCm" name="tinggiCm" value={editSantri.detail?.tinggiCm ?? ''} class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="beratKg"><span class="label-text">Berat (kg)</span></label>
					<input type="number" id="beratKg" name="beratKg" value={editSantri.detail?.beratKg ?? ''} class="input input-bordered w-full" />
				</div>
			</div>
			<div class="form-control w-full mb-3">
				<label class="label" for="alamatLengkap"><span class="label-text">Alamat Lengkap (Jalan / Dusun)</span></label>
				<input type="text" id="alamatLengkap" name="alamatLengkap" value={editSantri.detail?.alamatLengkap || ''} class="input input-bordered w-full" />
			</div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="rt"><span class="label-text">RT</span></label>
					<input type="text" id="rt" name="rt" value={editSantri.detail?.rt || ''} class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="rw"><span class="label-text">RW</span></label>
					<input type="text" id="rw" name="rw" value={editSantri.detail?.rw || ''} class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="desaKelurahan"><span class="label-text">Desa/Kelurahan</span></label>
					<input type="text" id="desaKelurahan" name="desaKelurahan" value={editSantri.detail?.desaKelurahan || ''} class="input input-bordered w-full" />
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="kecamatan"><span class="label-text">Kecamatan</span></label>
					<input type="text" id="kecamatan" name="kecamatan" value={editSantri.detail?.kecamatan || ''} class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="kabupaten"><span class="label-text">Kabupaten</span></label>
					<input type="text" id="kabupaten" name="kabupaten" value={editSantri.detail?.kabupaten || ''} class="input input-bordered w-full" />
				</div>
			</div>
			<div class="form-control w-full mb-3">
				<label class="label" for="provinsi"><span class="label-text">Provinsi</span></label>
				<input type="text" id="provinsi" name="provinsi" value={editSantri.detail?.provinsi || ''} class="input input-bordered w-full" />
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
				<div class="form-control w-full">
					<label class="label" for="noKip"><span class="label-text">No. Penerima KIP (Jika Ada)</span></label>
					<input type="text" id="noKip" name="noKip" value={editSantri.detail?.noKip || ''} class="input input-bordered w-full" />
				</div>
				<div class="form-control w-full">
					<label class="label" for="noKisKpsPkh"><span class="label-text">No. KIS/KPS/PKH (Jika Ada)</span></label>
					<input type="text" id="noKisKpsPkh" name="noKisKpsPkh" value={editSantri.detail?.noKisKpsPkh || ''} class="input input-bordered w-full" />
				</div>
			</div>
			<div class="form-control w-full mb-4">
				<label class="label" for="kebutuhanKhusus"><span class="label-text">Kebutuhan Khusus</span></label>
				<select id="kebutuhanKhusus" name="kebutuhanKhusus" class="select select-bordered w-full">
					<option value="" selected={!editSantri.detail?.kebutuhanKhusus}>Pilih...</option>
					<option value="Tidak" selected={editSantri.detail?.kebutuhanKhusus === 'Tidak'}>Tidak</option>
					<option value="Netra" selected={editSantri.detail?.kebutuhanKhusus === 'Netra'}>Netra</option>
					<option value="Rungu" selected={editSantri.detail?.kebutuhanKhusus === 'Rungu'}>Rungu</option>
					<option value="Grahita" selected={editSantri.detail?.kebutuhanKhusus === 'Grahita'}>Grahita</option>
					<option value="Daksa" selected={editSantri.detail?.kebutuhanKhusus === 'Daksa'}>Daksa</option>
					<option value="Laras" selected={editSantri.detail?.kebutuhanKhusus === 'Laras'}>Laras</option>
					<option value="Wicara" selected={editSantri.detail?.kebutuhanKhusus === 'Wicara'}>Wicara</option>
					<option value="Autis" selected={editSantri.detail?.kebutuhanKhusus === 'Autis'}>Autis</option>
					<option value="Lainnya" selected={editSantri.detail?.kebutuhanKhusus === 'Lainnya'}>Lainnya</option>
				</select>
			</div>

			<h4 class="text-base font-bold text-primary mt-2 mb-2 border-b border-primary/40 pb-1">III. Data Orang Tua / Wali</h4>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<div class="border border-base-200 rounded-lg p-3">
					<h5 class="font-semibold text-sm text-primary mb-2">Data Ayah / Wali</h5>
					<div class="form-control w-full mb-2">
						<label class="label" for="namaAyah"><span class="label-text">Nama Ayah</span></label>
						<input type="text" id="namaAyah" name="namaAyah" value={editSantri.detail?.namaAyah || ''} class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="tanggalLahirAyah"><span class="label-text">Tanggal Lahir Ayah</span></label>
						<input type="date" id="tanggalLahirAyah" name="tanggalLahirAyah" value={editSantri.detail?.tanggalLahirAyah || ''} class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="pendidikanAyah"><span class="label-text">Pendidikan Terakhir</span></label>
						<select id="pendidikanAyah" name="pendidikanAyah" class="select select-bordered w-full">
							<option value="" selected={!editSantri.detail?.pendidikanAyah}>Pilih...</option>
							<option value="Tidak Sekolah" selected={editSantri.detail?.pendidikanAyah === 'Tidak Sekolah'}>Tidak Sekolah</option>
							<option value="SD/MI" selected={editSantri.detail?.pendidikanAyah === 'SD/MI'}>SD/MI</option>
							<option value="SMP/MTs" selected={editSantri.detail?.pendidikanAyah === 'SMP/MTs'}>SMP/MTs</option>
							<option value="SMA/SMK/MA" selected={editSantri.detail?.pendidikanAyah === 'SMA/SMK/MA'}>SMA/SMK/MA</option>
							<option value="D1/D2/D3" selected={editSantri.detail?.pendidikanAyah === 'D1/D2/D3'}>D1/D2/D3</option>
							<option value="S1" selected={editSantri.detail?.pendidikanAyah === 'S1'}>S1</option>
							<option value="S2" selected={editSantri.detail?.pendidikanAyah === 'S2'}>S2</option>
							<option value="S3" selected={editSantri.detail?.pendidikanAyah === 'S3'}>S3</option>
						</select>
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="nikAyah"><span class="label-text">NIK Ayah</span></label>
						<input type="text" id="nikAyah" name="nikAyah" value={editSantri.detail?.nikAyah || ''} class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="alamatAyah"><span class="label-text">Alamat</span></label>
						<input type="text" id="alamatAyah" name="alamatAyah" value={editSantri.detail?.alamatAyah || ''} class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="noHpAyah"><span class="label-text">No. HP</span></label>
						<input type="text" id="noHpAyah" name="noHpAyah" value={editSantri.detail?.noHpAyah || ''} class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="pekerjaanAyah"><span class="label-text">Pekerjaan</span></label>
						<input type="text" id="pekerjaanAyah" name="pekerjaanAyah" value={editSantri.detail?.pekerjaanAyah || ''} class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full">
						<label class="label" for="penghasilanAyah"><span class="label-text">Penghasilan (Rp)</span></label>
						<input type="number" id="penghasilanAyah" name="penghasilanAyah" value={editSantri.detail?.penghasilanAyah ?? ''} class="input input-bordered w-full" />
					</div>
				</div>
				<div class="border border-base-200 rounded-lg p-3">
					<h5 class="font-semibold text-sm text-primary mb-2">Data Ibu</h5>
					<div class="form-control w-full mb-2">
						<label class="label" for="namaIbu"><span class="label-text">Nama Ibu</span></label>
						<input type="text" id="namaIbu" name="namaIbu" value={editSantri.detail?.namaIbu || ''} class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="tanggalLahirIbu"><span class="label-text">Tanggal Lahir Ibu</span></label>
						<input type="date" id="tanggalLahirIbu" name="tanggalLahirIbu" value={editSantri.detail?.tanggalLahirIbu || ''} class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="pendidikanIbu"><span class="label-text">Pendidikan Terakhir</span></label>
						<select id="pendidikanIbu" name="pendidikanIbu" class="select select-bordered w-full">
							<option value="" selected={!editSantri.detail?.pendidikanIbu}>Pilih...</option>
							<option value="Tidak Sekolah" selected={editSantri.detail?.pendidikanIbu === 'Tidak Sekolah'}>Tidak Sekolah</option>
							<option value="SD/MI" selected={editSantri.detail?.pendidikanIbu === 'SD/MI'}>SD/MI</option>
							<option value="SMP/MTs" selected={editSantri.detail?.pendidikanIbu === 'SMP/MTs'}>SMP/MTs</option>
							<option value="SMA/SMK/MA" selected={editSantri.detail?.pendidikanIbu === 'SMA/SMK/MA'}>SMA/SMK/MA</option>
							<option value="D1/D2/D3" selected={editSantri.detail?.pendidikanIbu === 'D1/D2/D3'}>D1/D2/D3</option>
							<option value="S1" selected={editSantri.detail?.pendidikanIbu === 'S1'}>S1</option>
							<option value="S2" selected={editSantri.detail?.pendidikanIbu === 'S2'}>S2</option>
							<option value="S3" selected={editSantri.detail?.pendidikanIbu === 'S3'}>S3</option>
						</select>
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="nikIbu"><span class="label-text">NIK Ibu</span></label>
						<input type="text" id="nikIbu" name="nikIbu" value={editSantri.detail?.nikIbu || ''} class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="alamatIbu"><span class="label-text">Alamat</span></label>
						<input type="text" id="alamatIbu" name="alamatIbu" value={editSantri.detail?.alamatIbu || ''} class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full mb-2">
						<label class="label" for="pekerjaanIbu"><span class="label-text">Pekerjaan</span></label>
						<input type="text" id="pekerjaanIbu" name="pekerjaanIbu" value={editSantri.detail?.pekerjaanIbu || ''} class="input input-bordered w-full" />
					</div>
					<div class="form-control w-full">
						<label class="label" for="penghasilanIbu"><span class="label-text">Penghasilan (Rp)</span></label>
						<input type="number" id="penghasilanIbu" name="penghasilanIbu" value={editSantri.detail?.penghasilanIbu ?? ''} class="input input-bordered w-full" />
					</div>
				</div>
			</div>
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => { my_modal_edit_santri.close(); editSantri = null; }}>Batal</button>
				<button type="submit" class="btn btn-primary">Simpan Perubahan</button>
			</div>
		</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
