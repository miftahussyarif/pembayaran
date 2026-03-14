<script>
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	let editKategori = $state(null);

	const formatRupiah = (n) => n === 0 ? 'GRATIS' : `Rp ${n.toLocaleString('id-ID')}`;
</script>

<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
	<div>
		<h2 class="text-2xl font-bold">Kategori Santri</h2>
		<p class="text-sm text-base-content/60 mt-1">Kelola kategori santri dan tentukan jenis pembayaran yang GRATIS</p>
	</div>
	<button class="btn btn-sm btn-primary" onclick={() => my_modal_tambah_kategori.showModal()}>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
			<path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
		</svg>
		Tambah Kategori
	</button>
</div>

{#if form?.error}
	<div class="alert alert-error mb-4 shadow-sm"><span>{form.error}</span></div>
{/if}

<div class="card bg-base-100 shadow-sm border border-base-200">
	<div class="overflow-x-auto">
		<table class="table table-zebra w-full">
			<thead>
				<tr>
					<th class="w-20">No</th>
					<th>Nama Kategori</th>
					<th class="w-32">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#if data.kategoris.length === 0}
					<tr><td colspan="3" class="text-center py-6 text-base-content/50">Belum ada kategori. Silakan tambahkan kategori baru.</td></tr>
				{/if}
				{#each data.kategoris as k, i}
					<tr>
						<td>{i + 1}</td>
						<td>
							<span class="font-semibold">{k.namaKategori}</span>
						</td>
						<td class="flex gap-2">
							<button class="btn btn-xs btn-outline btn-primary" onclick={() => { editKategori = {...k}; my_modal_edit_kategori.showModal(); }}>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
								Edit
							</button>
							<form method="POST" action="?/delete" use:enhance class="inline">
								<input type="hidden" name="id" value={k.id} />
								<button type="submit" class="btn btn-xs btn-ghost text-error" onclick={(e) => { if(!confirm(`Hapus kategori "${k.namaKategori}"?`)) e.preventDefault(); }}>
									Hapus
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Modal Tambah Kategori -->
<dialog id="my_modal_tambah_kategori" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Tambah Kategori Santri</h3>
		<form method="POST" action="?/create" use:enhance>
			<div class="form-control w-full mb-4">
				<label class="label" for="namaKategori"><span class="label-text font-semibold">Nama Kategori</span></label>
				<input type="text" id="namaKategori" name="namaKategori" placeholder="Contoh: Reguler, Yatim, Dhuafa..." class="input input-bordered w-full" required />
			</div>
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => my_modal_tambah_kategori.close()}>Batal</button>
				<button type="submit" class="btn btn-primary">Simpan</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<!-- Modal Edit Kategori -->
<dialog id="my_modal_edit_kategori" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Edit Kategori Santri</h3>
		{#if editKategori}
		<form method="POST" action="?/update" use:enhance={() => {
			return async ({ update }) => { await update(); my_modal_edit_kategori.close(); editKategori = null; };
		}}>
			<input type="hidden" name="id" value={editKategori.id} />
			<div class="form-control w-full mb-4">
				<label class="label" for="editNamaKategori"><span class="label-text font-semibold">Nama Kategori</span></label>
				<input type="text" id="editNamaKategori" name="namaKategori" value={editKategori.namaKategori} class="input input-bordered w-full" required />
			</div>
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => { my_modal_edit_kategori.close(); editKategori = null; }}>Batal</button>
				<button type="submit" class="btn btn-primary">Simpan Perubahan</button>
			</div>
		</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
