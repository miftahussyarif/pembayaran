<script>
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	let hapusRiwayat = $state(null); // transaksi yang akan dihapus

	const formatRupiah = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');
	const formatTanggal = (t) => t ? new Date(t).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
</script>

<svelte:head>
	<title>Riwayat Pembayaran</title>
</svelte:head>

<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
	<div>
		<h2 class="text-2xl font-bold">Riwayat Pembayaran</h2>
		<p class="text-sm text-base-content/60 mt-1">Total {data.riwayat.length} transaksi ditemukan</p>
	</div>
	{#if data.isAdmin}
		<div class="badge badge-warning badge-outline gap-1 py-3 px-3 text-xs">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
			Mode Super Admin — Hapus riwayat aktif
		</div>
	{/if}
</div>

{#if form?.message}
	<div class="alert {form.type === 'error' ? 'alert-error' : 'alert-success'} mb-4 py-2 text-sm rounded-lg">
		<span>{form.message}</span>
	</div>
{/if}

<!-- Filter -->
<div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
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
			<div class="flex gap-2">
				<button type="submit" class="btn btn-sm btn-primary">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
					Filter
				</button>
				{#if data.filterSantri || data.filterTahun}
					<a href="/transaksi/riwayat" class="btn btn-sm btn-ghost">Reset</a>
				{/if}
			</div>
		</form>
	</div>
</div>

<!-- Tabel Riwayat -->
<div class="card bg-base-100 shadow-sm border border-base-200">
	<div class="overflow-x-auto">
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
					<th class="text-right">Nominal</th>
					<th class="text-center">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#if data.riwayat.length === 0}
					<tr>
						<td colspan="9" class="text-center py-8 text-base-content/50">
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
							<div class="font-semibold text-sm">{r.namaLengkap || '-'}</div>
							<div class="text-xs text-base-content/50">{r.nomorInduk || ''}</div>
						</td>
						<td class="text-sm">{r.namaPembayaran || '-'}</td>
						<td>
							{#if r.bulan}
								<span class="badge badge-outline badge-sm">{r.bulan}</span>
							{:else}
								<span class="text-base-content/40 text-xs">-</span>
							{/if}
						</td>
						<td class="text-sm font-medium">{r.tahunNama || '-'}</td>
						<td class="text-right font-bold text-sm text-success">{formatRupiah(r.nominalDibayar)}</td>
						<td class="text-center">
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
						<td colspan="7" class="text-right">Total Pemasukan:</td>
						<td class="text-right text-success">
							{formatRupiah(data.riwayat.reduce((sum, r) => sum + (r.nominalDibayar || 0), 0))}
						</td>
						<td></td>
					</tr>
				</tfoot>
			{/if}
		</table>
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
				<div><span class="font-semibold">Santri:</span> {hapusRiwayat.namaLengkap}</div>
				<div><span class="font-semibold">No. Kwitansi:</span> <span class="font-mono text-xs">{hapusRiwayat.nomorKwitansi}</span></div>
				<div><span class="font-semibold">Pembayaran:</span> {hapusRiwayat.namaPembayaran} {hapusRiwayat.bulan ? '— ' + hapusRiwayat.bulan : ''}</div>
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
