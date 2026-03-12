<script>
	import { enhance } from '$app/forms';
	let { data } = $props();

	let hapusTahun = $state(null);
</script>

<div class="flex justify-between items-center mb-6">
	<div>
		<h2 class="text-2xl font-bold">Data Tahun</h2>
		<p class="text-sm text-base-content/60 mt-1">Tahun aktif mencakup periode Januari — Desember tahun tersebut</p>
	</div>
	<button class="btn btn-primary" onclick={() => my_modal_tambah.showModal()}>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
			<path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 011-1z" clip-rule="evenodd" />
		</svg>
		Tambah Data
	</button>
</div>

<div class="card bg-base-100 shadow-sm border border-base-200">
	<div class="overflow-x-auto">
		<table class="table table-zebra w-full">
			<thead>
				<tr>
					<th>No</th>
					<th>Tahun</th>
					<th>Periode Pencatatan</th>
					<th>Status</th>
					<th>Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#if data.tahunAjarans.length === 0}
					<tr>
						<td colspan="5" class="text-center py-4">Belum ada data.</td>
					</tr>
				{/if}
				{#each data.tahunAjarans as ta, i}
					<tr>
						<td>{i + 1}</td>
						<td class="font-bold text-xl">{ta.nama}</td>
						<td class="text-sm text-base-content/60">1 Januari {ta.nama} — 31 Desember {ta.nama}</td>
						<td>
							{#if ta.isActive}
								<div class="badge badge-success gap-1"><span class="w-2 h-2 rounded-full bg-white"></span> Aktif</div>
							{:else}
								<div class="badge badge-ghost">Tidak Aktif</div>
							{/if}
						</td>
						<td class="flex gap-2 flex-wrap">
							<!-- Toggle Aktif/Nonaktif langsung via form -->
							<form method="POST" action="?/toggleAktif" class="inline" use:enhance>
								<input type="hidden" name="id" value={ta.id} />
								<button type="submit" class="btn btn-sm btn-outline {ta.isActive ? 'btn-error' : 'btn-success'}">
									{ta.isActive ? 'Nonaktifkan' : 'Set Aktif'}
								</button>
							</form>
							<!-- Tombol Hapus → buka modal konfirmasi -->
							<button class="btn btn-sm btn-ghost text-error"
								onclick={() => { hapusTahun = ta; modal_konfirmasi_hapus_ta.showModal(); }}>
								Hapus
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Modal Konfirmasi Hapus — form DELETE ada di dalam modal ini -->
<dialog id="modal_konfirmasi_hapus_ta" class="modal">
	<div class="modal-box max-w-sm">
		<h3 class="font-bold text-lg text-error mb-2">Hapus Tahun</h3>
		{#if hapusTahun}
			<p class="text-sm mb-3">Yakin ingin menghapus tahun ini?</p>
			<div class="bg-base-200 rounded-lg p-3 my-3 text-center">
				<div class="font-bold text-2xl">{hapusTahun.nama}</div>
				<div class="text-xs text-base-content/60 mt-1">1 Januari {hapusTahun.nama} — 31 Desember {hapusTahun.nama}</div>
			</div>
			{#if hapusTahun.isActive}
				<div class="alert alert-warning text-xs py-2 mb-3">
					⚠️ Ini adalah tahun <strong>sedang aktif</strong>. Pastikan ada tahun lain yang diaktifkan setelah penghapusan.
				</div>
			{/if}
			<p class="text-xs text-error mb-4">Tindakan ini tidak dapat dibatalkan.</p>
			<div class="modal-action justify-between">
				<button class="btn" type="button"
					onclick={() => { modal_konfirmasi_hapus_ta.close(); hapusTahun = null; }}>
					Batal
				</button>
				<!-- Form DELETE langsung di dalam modal, ID diambil dari hapusTahun reactive -->
				<form method="POST" action="?/delete"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							modal_konfirmasi_hapus_ta.close();
							hapusTahun = null;
						};
					}}>
					<input type="hidden" name="id" value={hapusTahun.id} />
					<button type="submit" class="btn btn-error">Ya, Hapus</button>
				</form>
			</div>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<!-- Modal Tambah Tahun -->
<dialog id="my_modal_tambah" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Tambah Tahun</h3>
		<form method="POST" action="?/create" use:enhance={() => {
			return async ({ update }) => { await update(); my_modal_tambah.close(); };
		}}>
			<div class="form-control w-full mb-2">
				<label class="label" for="tahunInput"><span class="label-text font-semibold">Tahun</span></label>
				<input type="number" id="tahunInput" name="nama" placeholder="Contoh: 2026" min="2000" max="2100"
					class="input input-bordered w-full" required />
			</div>
			<p class="text-xs text-base-content/50 mb-4">
				Periode pencatatan: <strong>1 Januari — 31 Desember</strong> tahun tersebut.
			</p>
			<div class="form-control w-full mb-4">
				<label class="label cursor-pointer justify-start gap-4" for="isActiveTa">
					<input type="checkbox" id="isActiveTa" name="isActive" class="toggle toggle-primary" />
					<span class="label-text">Jadikan sebagai tahun aktif sekarang</span>
				</label>
			</div>
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => my_modal_tambah.close()}>Batal</button>
				<button type="submit" class="btn btn-primary">Simpan</button>
			</div>
		</form>
	</div>
</dialog>
