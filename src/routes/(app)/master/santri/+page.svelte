<script>
	import { enhance } from '$app/forms';
	let { data } = $props();
	let editSantri = $state(null);
</script>

<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
	<h2 class="text-2xl font-bold">Data Santri</h2>
	<div class="flex gap-2 w-full sm:w-auto">
		<div class="form-control flex-1 sm:w-64">
			<input type="text" placeholder="Cari santri..." class="input input-sm input-bordered w-full" />
		</div>
		<button class="btn btn-sm btn-primary" onclick={() => my_modal_santri.showModal()}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
			</svg>
			Tambah Santri
		</button>
	</div>
</div>

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
					<th>Tanggal Keluar</th>
					<th>Status</th>
					<th>Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#if data.santris.length === 0}
					<tr>
						<td colspan="8" class="text-center py-4">Belum ada data santri.</td>
					</tr>
				{/if}
				{#each data.santris as santri, i}
					<tr>
						<td>{i + 1}</td>
						<td class="font-medium text-base-content/80 text-sm">{santri.nomorInduk}</td>
						<td class="font-semibold">{santri.namaLengkap}</td>
						<td>
							{#if santri.kategoriId}
								{@const kat = data.kategoris.find(k => k.id === santri.kategoriId)}
								{#if kat}
									<span class="badge badge-outline badge-sm">{kat.namaKategori}</span>
								{/if}
							{:else}
								<span class="text-base-content/40 text-xs">-</span>
							{/if}
						</td>
						<td class="text-sm">{santri.tanggalMasuk || '-'}</td>
						<td class="text-sm">{santri.tanggalKeluar || '-'}</td>
						<td>
							{#if santri.isActive}
								<div class="badge badge-success badge-sm gap-1"><span class="w-1.5 h-1.5 rounded-full bg-white"></span> Aktif</div>
							{:else}
								<div class="badge badge-ghost badge-sm">Berhenti</div>
							{/if}
						</td>
						<td class="flex gap-1 flex-wrap">
							<button class="btn btn-xs btn-outline btn-primary" onclick={() => { editSantri = {...santri}; my_modal_edit_santri.showModal(); }}>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
								Edit
							</button>
							<form method="POST" action="?/toggleAktif" class="inline">
								<input type="hidden" name="id" value={santri.id} />
								<button type="submit" class="btn btn-xs btn-outline {santri.isActive ? 'btn-error' : 'btn-success'}">
									{santri.isActive ? 'Nonaktifkan' : 'Aktifkan'}
								</button>
							</form>
							<form method="POST" action="?/delete" class="inline">
								<input type="hidden" name="id" value={santri.id} />
								<button type="submit" class="btn btn-xs btn-ghost text-error" onclick={(e) => { if(!confirm('Hapus santri ini?')) e.preventDefault() }}>Hapus</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Modal Tambah Santri -->
<dialog id="my_modal_santri" class="modal">
	<div class="modal-box max-w-lg">
		<h3 class="font-bold text-lg mb-4">Tambah Data Santri</h3>
		<form method="POST" action="?/create" use:enhance>
			<div class="form-control w-full mb-3">
				<label class="label" for="nomorInduk"><span class="label-text">Nomor Induk</span></label>
				<input type="text" id="nomorInduk" name="nomorInduk" placeholder="Misal: 24005" class="input input-bordered w-full" required />
			</div>
			<div class="form-control w-full mb-3">
				<label class="label" for="namaLengkap"><span class="label-text">Nama Lengkap</span></label>
				<input type="text" id="namaLengkap" name="namaLengkap" placeholder="Masukkan nama santri" class="input input-bordered w-full" required />
			</div>
			<div class="form-control w-full mb-3">
				<label class="label" for="kategoriId"><span class="label-text">Kategori Santri</span></label>
				<select id="kategoriId" name="kategoriId" class="select select-bordered w-full">
					<option value="">-- Pilih Kategori --</option>
					{#each data.kategoris as kat}
						<option value={kat.id}>{kat.namaKategori} — {kat.nominalSyahriyah === 0 ? 'GRATIS' : `Rp ${kat.nominalSyahriyah.toLocaleString('id-ID')}/bln`}</option>
					{/each}
				</select>
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
	<div class="modal-box max-w-lg">
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
			<div class="form-control w-full mb-3">
				<label class="label" for="editKategoriId"><span class="label-text">Kategori Santri</span></label>
				<select id="editKategoriId" name="kategoriId" class="select select-bordered w-full">
					<option value="">-- Pilih Kategori --</option>
					{#each data.kategoris as kat}
						<option value={kat.id} selected={kat.id === editSantri.kategoriId}>{kat.namaKategori} — {kat.nominalSyahriyah === 0 ? 'GRATIS' : `Rp ${kat.nominalSyahriyah.toLocaleString('id-ID')}/bln`}</option>
					{/each}
				</select>
			</div>
			<div class="flex gap-4 mb-3">
				<div class="form-control w-1/2">
					<label class="label" for="editTanggalMasuk"><span class="label-text">Tanggal Masuk</span></label>
					<input type="date" id="editTanggalMasuk" name="tanggalMasuk" value={editSantri.tanggalMasuk || ''} class="input input-bordered w-full" />
				</div>
				<div class="form-control w-1/2">
					<label class="label" for="editTanggalKeluar"><span class="label-text">Tanggal Keluar (Opsional)</span></label>
					<input type="date" id="editTanggalKeluar" name="tanggalKeluar" value={editSantri.tanggalKeluar || ''} class="input input-bordered w-full" />
				</div>
			</div>
			<div class="form-control w-full mb-4">
				<label class="label cursor-pointer justify-start gap-4" for="isActiveEdit">
					<input type="checkbox" id="isActiveEdit" name="isActive" class="toggle toggle-primary" checked={editSantri.isActive} />
					<span class="label-text">Santri Aktif</span>
				</label>
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
