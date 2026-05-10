<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	let { data, form } = $props();

	let hapusRiwayat = $state(null); // transaksi yang akan dihapus
	let expandedKwitansi = $state(new Set()); // track which kwitansi rows are expanded

	const formatRupiah = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');
	const formatTanggal = (t) => t ? new Date(t).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

	function toggleKwitansi(nomorKwitansi) {
		if (expandedKwitansi.has(nomorKwitansi)) {
			expandedKwitansi.delete(nomorKwitansi);
		} else {
			expandedKwitansi.add(nomorKwitansi);
		}
		expandedKwitansi = expandedKwitansi; // trigger reactivity
	}

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
	<title>Riwayat Pembayaran</title>
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

<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 print:hidden">
	<div>
		<h2 class="text-2xl font-bold">Riwayat Pembayaran</h2>
		<p class="text-sm text-base-content/60 mt-1">Total {data.riwayat.length} {data.mode === 'per-kwitansi' ? 'kwitansi' : 'transaksi'} ditemukan</p>
	</div>
	{#if data.isAdmin}
		<div class="badge badge-warning badge-outline gap-1 py-3 px-3 text-xs">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
			Mode Super Admin — Hapus riwayat aktif
		</div>
	{/if}
</div>

{#if form?.message}
	<div class="alert {form.type === 'error' ? 'alert-error' : 'alert-success'} mb-4 py-2 text-sm rounded-lg no-print">
		<span>{form.message}</span>
	</div>
{/if}

<!-- Filter -->
<div class="card bg-base-100 shadow-sm border border-base-200 mb-4 print:hidden">
	<div class="card-body py-3 px-4">
		<form method="GET" action="/transaksi/riwayat" class="flex flex-wrap gap-3 items-end">
			<div class="form-control flex-1 min-w-48">
				<label class="label py-1" for="cariSantri"><span class="label-text text-xs">Cari Nama / No. Induk Santri</span></label>
				<input type="text" id="cariSantri" name="santri" value={data.filterSantri}
					placeholder="Ketik nama atau nomor induk..." class="input input-sm input-bordered w-full" />
			</div>
			<div class="form-control">
				<label class="label py-1" for="filterTahun"><span class="label-text text-xs">Tahun</span></label>
				<select id="filterTahun" name="tahun" class="select select-sm select-bordered">
					<option value="">Semua Tahun</option>
					{#each data.tahunList as ta}
						<option value={ta.nama} selected={ta.nama === data.filterTahun}>{ta.nama}</option>
					{/each}
				</select>
			</div>
			<div class="form-control">
				<label class="label py-1" for="filterMode"><span class="label-text text-xs">Tampilan</span></label>
				<select id="filterMode" name="mode" class="select select-sm select-bordered">
					<option value="detail" selected={data.mode === 'detail'}>Detail</option>
					<option value="per-kwitansi" selected={data.mode === 'per-kwitansi'}>Per Kwitansi</option>
				</select>
			</div>
			<div class="flex gap-2">
				<button type="submit" class="btn btn-sm btn-primary">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
					Filter
				</button>
				{#if data.filterSantri || data.filterTahun}
					<a href="/transaksi/riwayat?mode={data.mode}" class="btn btn-sm btn-ghost">Reset</a>
				{/if}
				<button type="button" class="btn btn-sm btn-outline" onclick={() => window.print()}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
					Cetak
				</button>
			</div>
		</form>
	</div>
</div>

<!-- Print Header -->
<div class="print-only mb-4 text-center">
	<h2 class="text-xl font-bold">Riwayat Pembayaran</h2>
	<p class="font-medium mt-1">Santri: {data.filterSantri || 'Semua Santri'}</p>
</div>

<!-- Tabel Riwayat -->
<div class="card bg-base-100 shadow-sm border border-base-200">
	<div class="overflow-x-auto">
		{#if data.mode === 'per-kwitansi'}
		<!-- Per Kwitansi View -->
		<table class="table table-zebra table-sm w-full">
			<thead>
				<tr>
					<th>No</th>
					<th>Tgl Bayar</th>
					<th>No. Kwitansi</th>
					<th>Detail Pembayaran</th>
					<th>Tahun</th>
					<th class="text-right">Total Nominal</th>
					<th class="text-center no-print">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#if data.riwayat.length === 0}
					<tr>
						<td colspan="7" class="text-center py-8 text-base-content/50">
							<div class="flex flex-col items-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
								<span>Belum ada data pembayaran</span>
							</div>
						</td>
					</tr>
				{/if}
				{#each data.riwayat as r, i}
					<tr class="cursor-pointer hover:bg-base-200/30" onclick={() => toggleKwitansi(r.nomorKwitansi)}>
						<td class="text-base-content/50">{i + 1}</td>
						<td class="text-sm whitespace-nowrap">{formatTanggal(r.tanggalBayar)}</td>
						<td class="font-mono text-xs text-base-content/70">{r.nomorKwitansi}</td>
						<td class="text-sm">
							<div class="font-semibold">{r.items?.length || 0} item{(r.items?.length || 0) !== 1 ? 's' : ''}</div>
							<div class="text-xs text-base-content/50 max-w-xs truncate">{r.items?.map(item => item.namaPembayaran).join(', ') || '-'}</div>
						</td>
						<td class="text-sm font-medium">{r.tahunNama || '-'}</td>
						<td class="text-right font-bold text-sm text-success">{formatRupiah(r.totalNominal)}</td>
						<td class="text-center print:hidden">
							<button type="button" class="btn btn-xs btn-ghost" aria-label={`Toggle detail kwitansi ${r.nomorKwitansi}`} title="Lihat detail kwitansi"
								onclick={(e) => { e.stopPropagation(); toggleKwitansi(r.nomorKwitansi); }}>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform" class:rotate-180={expandedKwitansi.has(r.nomorKwitansi)} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
							</button>
						</td>
					</tr>
					{#if expandedKwitansi.has(r.nomorKwitansi)}
						{#each r.items as item}
							<tr class="bg-base-200/30 text-sm">
								<td colspan="2"></td>
								<td class="font-mono text-xs text-base-content/50"></td>
								<td class="pl-8">
									<div class="font-semibold text-xs">{item.namaPembayaran}</div>
									{#if item.bulan}
										<div class="text-xs text-base-content/60">{item.bulan}{item.tahunTagihan ? ` ${item.tahunTagihan}` : ''}</div>
									{/if}
								</td>
								<td class="text-xs text-base-content/60"></td>
								<td class="text-right font-semibold text-sm text-success">{formatRupiah(item.nominalDibayar)}</td>
								<td class="text-center print:hidden">
									{#if data.isAdmin}
										<button class="btn btn-xs btn-ghost text-error"
											onclick={() => { hapusRiwayat = item; modal_hapus_riwayat.showModal(); }}
											title="Hapus item ini">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					{/if}
				{/each}
			</tbody>
			{#if data.riwayat.length > 0}
				<tfoot>
					<tr class="font-bold bg-base-200/50">
						<td colspan="5" class="text-right">Total Pemasukan:</td>
						<td class="text-right text-success">
							{formatRupiah(data.riwayat.reduce((sum, r) => sum + (r.totalNominal || 0), 0))}
						</td>
						<td></td>
					</tr>
				</tfoot>
			{/if}
		</table>
		{:else}
		<!-- Detail View (Original) -->
		<table class="table table-zebra table-sm w-full">
			<thead>
				<tr>
					<th>No</th>
					<th>Tgl Bayar</th>
					<th>No. Kwitansi</th>
					<th>Santri</th>
					<th>Jenis Pembayaran</th>
					<th>Bulan</th>
					<th>Tahun</th>
					<th>Status</th>
					<th class="text-right">Nominal</th>
					<th class="text-center no-print">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#if data.riwayat.length === 0}
					<tr>
						<td colspan="10" class="text-center py-8 text-base-content/50">
							<div class="flex flex-col items-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
								<span>Belum ada data pembayaran</span>
							</div>
						</td>
					</tr>
				{/if}
				{#each data.riwayat as r, i}
					<tr>
						<td class="text-base-content/50">{i + 1}</td>
						<td class="text-sm whitespace-nowrap">{formatTanggal(r.tanggalBayar)}</td>
						<td class="font-mono text-xs text-base-content/70">{r.nomorKwitansi}</td>
						<td>
							<div class="font-semibold text-sm">{r.namaPembayar || '-'}</div>
							<div class="text-xs text-base-content/50">{r.nomorInduk || ''}</div>
						</td>
						<td class="text-sm">{r.namaPembayaran || '-'}</td>
						<td>
							{#if r.bulan}
								<span class="badge badge-outline badge-sm">{r.bulan}{r.tahunTagihan ? ` ${r.tahunTagihan}` : ''}</span>
							{:else}
								<span class="text-base-content/40 text-xs">-</span>
							{/if}
						</td>
						<td class="text-sm font-medium">{r.tahunNama || '-'}</td>
						<td>
							<span class={`badge badge-sm ${r.statusPelunasan === 'Lunas' ? 'badge-success' : 'badge-warning badge-outline'}`}>
								{r.statusPelunasan}
							</span>
						</td>
						<td class="text-right font-bold text-sm text-success">{formatRupiah(r.nominalDibayar)}</td>
						<td class="text-center no-print">
							<div class="flex gap-1 justify-center">
								<a href="/transaksi/cetak/{r.id}"
									class="btn btn-xs btn-outline btn-primary gap-1" title="Cetak Ulang Kwitansi">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
									</svg>
									Kwitansi
								</a>
								{#if data.isAdmin}
									<button class="btn btn-xs btn-ghost text-error"
										onclick={() => { hapusRiwayat = r; modal_hapus_riwayat.showModal(); }}
										title="Hapus riwayat ini">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
			{#if data.riwayat.length > 0}
				<tfoot>
					<tr class="font-bold bg-base-200/50">
						<td colspan="8" class="text-right">Total Pemasukan:</td>
						<td class="text-right text-success">
							{formatRupiah(data.riwayat.reduce((sum, r) => sum + (r.nominalDibayar || 0), 0))}
						</td>
						<td></td>
					</tr>
				</tfoot>
			{/if}
		</table>
		{/if}
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

<!-- Modal Konfirmasi Hapus Riwayat (Admin Only) -->
<dialog id="modal_hapus_riwayat" class="modal">
	<div class="modal-box max-w-sm">
		<div class="flex items-center gap-2 mb-3">
			<div class="p-2 bg-error/10 rounded-full">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
			</div>
			<h3 class="font-bold text-lg text-error">Hapus Riwayat Pembayaran</h3>
		</div>
		{#if hapusRiwayat}
			<p class="text-sm mb-3">Yakin ingin menghapus transaksi ini secara permanen?</p>
			<div class="bg-base-200 rounded-lg p-3 my-3 text-sm space-y-1">
				<div><span class="font-semibold">Pembayar:</span> {hapusRiwayat.namaPembayar}</div>
				<div><span class="font-semibold">No. Kwitansi:</span> <span class="font-mono text-xs">{hapusRiwayat.nomorKwitansi}</span></div>
				<div><span class="font-semibold">Pembayaran:</span> {hapusRiwayat.namaPembayaran} {hapusRiwayat.bulan ? `— ${hapusRiwayat.bulan}${hapusRiwayat.tahunTagihan ? ` ${hapusRiwayat.tahunTagihan}` : ''}` : ''}</div>
				<div><span class="font-semibold">Nominal:</span> <span class="text-error font-bold">{formatRupiah(hapusRiwayat.nominalDibayar)}</span></div>
			</div>
			<p class="text-xs text-error mb-4">⚠️ Data yang sudah dihapus tidak dapat dikembalikan.</p>
			<div class="modal-action justify-between">
				<button class="btn" type="button"
					onclick={() => { modal_hapus_riwayat.close(); hapusRiwayat = null; }}>
					Batal
				</button>
				<form method="POST" action="?/deleteRiwayat"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							modal_hapus_riwayat.close();
							hapusRiwayat = null;
						};
					}}>
					<input type="hidden" name="id" value={hapusRiwayat.id} />
					<button type="submit" class="btn btn-error gap-1">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
						Ya, Hapus
					</button>
				</form>
			</div>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
