<script>
	import { page } from '$app/stores';
	let { data } = $props();

	const sortLabel = (value) => {
		if (value === 'kategori') return 'Kategori Santri';
		if (value === 'kabupaten') return 'Alamat: Kabupaten';
		if (value === 'kecamatan') return 'Alamat: Kecamatan';
		if (value === 'provinsi') return 'Alamat: Provinsi';
		return 'Kategori Santri';
	};

	const valueLabel = (santri) => {
		if (data.sortBy === 'kategori') return santri.kategoriNama || '-';
		if (data.sortBy === 'kabupaten') return santri.detail?.kabupaten || '-';
		if (data.sortBy === 'kecamatan') return santri.detail?.kecamatan || '-';
		if (data.sortBy === 'provinsi') return santri.detail?.provinsi || '-';
		return '-';
	};
</script>

<svelte:head>
	<title>Cetak List Santri</title>
	<style>
		@media print {
			.navbar { display: none !important; }
			.drawer, .drawer-content, main { background: white !important; }
			.min-h-screen { min-height: auto !important; }
			.card-body { padding-bottom: 8mm !important; }
			table th, table td { padding-top: 0.35rem !important; padding-bottom: 0.35rem !important; }
			h1, h2 { margin-top: 0 !important; margin-bottom: 0 !important; }
		}
	</style>
</svelte:head>

<div class="min-h-screen bg-base-200 flex justify-center items-start p-2 md:p-5 font-sans print:bg-white print:p-0">
	<div class="card w-full max-w-5xl bg-base-100 shadow-xl print:shadow-none print:rounded-none">
		<div class="card-body print:px-8 print:py-4">
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
					<p class="text-sm text-base-content/70">Sort: {sortLabel(data.sortBy)}</p>
					{#if data.filter}
						<p class="text-xs text-base-content/60">Filter: {data.filter}</p>
					{/if}
				</div>
			</div>

			<div class="overflow-x-auto border border-base-200 rounded-lg">
				<table class="table w-full">
					<thead class="bg-base-200/50">
						<tr>
							<th>No</th>
							<th>Nomor Induk</th>
							<th>Nama Lengkap</th>
							<th>{sortLabel(data.sortBy)}</th>
						</tr>
					</thead>
					<tbody>
						{#if data.santris.length === 0}
							<tr>
								<td colspan="4" class="text-center py-4">Belum ada data santri.</td>
							</tr>
						{/if}
						{#each data.santris as santri, i}
							<tr>
								<td>{i + 1}</td>
								<td class="text-sm">{santri.nomorInduk}</td>
								<td class="font-semibold">{santri.namaLengkap}</td>
								<td>{valueLabel(santri)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="card-actions justify-center mt-8 print:hidden border-t border-base-200 pt-6">
				<a href="/master/santri" class="btn btn-ghost">Kembali</a>
				<button class="btn btn-primary px-8" onclick={() => window.print()}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
					Cetak Sekarang
				</button>
			</div>
		</div>
	</div>
</div>
