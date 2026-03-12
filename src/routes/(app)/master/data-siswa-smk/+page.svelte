<script>
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	const bulanList = [
		'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
		'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
	];

	let searchSantri = $state('');
	let editSmk = $state(null);
	let filteredSantri = $derived.by(() => {
		const q = searchSantri.trim().toLowerCase();
		if (!q) return data.santriList;
		return data.santriList.filter((s) => {
			const nama = (s.namaLengkap || '').toLowerCase();
			const induk = (s.nomorInduk || '').toLowerCase();
			return nama.includes(q) || induk.includes(q);
		});
	});
</script>

<div class="card bg-base-100 shadow-xl border border-base-200 mb-8">
	<div class="card-body">
		<div class="flex justify-between items-center mb-4">
			<h2 class="card-title text-2xl font-bold">Data Siswa SMK</h2>
			<button class="btn btn-primary btn-sm" onclick={() => modal_add_smk.showModal()}>
				+ Tambah Siswa SMK
			</button>
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
						<th class="text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#if data.dataSmk.length === 0}
						<tr>
							<td colspan="5" class="text-center text-base-content/50 py-6">Belum ada data siswa SMK.</td>
						</tr>
					{:else}
						{#each data.dataSmk as s}
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
								</td>
								<td class="text-right">
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

<dialog id="modal_add_smk" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Tambah Siswa SMK</h3>
		<form method="POST" action="?/create" use:enhance={() => {
			return async ({ update }) => { await update(); modal_add_smk.close(); };
		}}>
			<div class="form-control w-full mb-3">
				<label class="label" for="santriId"><span class="label-text">Pilih Santri</span></label>
				<input type="text" class="input input-sm input-bordered mb-2" placeholder="Cari nama / NIS..." bind:value={searchSantri} />
				<select id="santriId" name="santriId" class="select select-sm select-bordered w-full" required>
					<option value="" disabled selected>Pilih Santri...</option>
					{#each filteredSantri as s}
						<option value={s.id}>{s.nomorInduk} - {s.namaLengkap}</option>
					{/each}
				</select>
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
				<label class="label"><span class="label-text">Santri</span></label>
				<input type="text" class="input input-sm input-bordered w-full bg-base-200" value={`${editSmk.nomorInduk} - ${editSmk.namaLengkap}`} disabled />
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
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => { modal_edit_smk.close(); editSmk = null; }}>Batal</button>
				<button type="submit" class="btn btn-primary">Simpan Perubahan</button>
			</div>
		</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
