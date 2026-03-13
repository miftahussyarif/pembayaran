<script>
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	let editSantri = $state(null);
	let sortBy = $state('kategori');
	let filterValue = $state('');

	const getKategoriName = (kategoriId) => {
		if (!kategoriId) return '';
		const kat = data.kategoris.find((k) => k.id === kategoriId);
		return kat?.namaKategori || '';
	};

	const getSortValue = (santri) => {
		if (sortBy === 'kategori') return getKategoriName(santri.kategoriId);
		if (sortBy === 'kabupaten') return santri.detail?.kabupaten || '';
		if (sortBy === 'kecamatan') return santri.detail?.kecamatan || '';
		if (sortBy === 'provinsi') return santri.detail?.provinsi || '';
		return '';
	};

	const filterOptions = $derived.by(() => {
		if (sortBy === 'kategori') {
			return data.kategoris.map((k) => k.namaKategori).filter(Boolean);
		}
		const key = sortBy;
		const values = new Set();
		for (const santri of data.santris) {
			const value = santri.detail?.[key];
			if (value) values.add(value);
		}
		return Array.from(values).sort((a, b) => a.localeCompare(b, 'id'));
	});

	const filteredSantris = $derived.by(() => {
		if (!filterValue) return data.santris;
		const needle = filterValue.toString().toLowerCase();
		return data.santris.filter((s) => {
			const value = getSortValue(s);
			return value && value.toString().toLowerCase() === needle;
		});
	});

	const sortedSantris = $derived.by(() => {
		const list = [...filteredSantris];
		list.sort((a, b) => {
			const av = getSortValue(a).toString().toLowerCase();
			const bv = getSortValue(b).toString().toLowerCase();
			if (!av && bv) return 1;
			if (av && !bv) return -1;
			return av.localeCompare(bv, 'id');
		});
		return list;
	});
</script>

<div class="flex flex-col lg:flex-row lg:items-end gap-3 mb-6">
	<div class="form-control w-full sm:w-56">
		<label class="label py-0"><span class="label-text text-xs">Sorting</span></label>
		<select class="select select-sm select-bordered w-full" bind:value={sortBy} onchange={() => { filterValue = ''; }}>
			<option value="kategori">Kategori Santri</option>
			<option value="kabupaten">Alamat: Kabupaten</option>
			<option value="kecamatan">Alamat: Kecamatan</option>
			<option value="provinsi">Alamat: Provinsi</option>
		</select>
	</div>
	<div class="form-control w-full sm:w-56">
		<label class="label py-0"><span class="label-text text-xs">Filter</span></label>
		<select class="select select-sm select-bordered w-full" bind:value={filterValue}>
			<option value="">Semua</option>
			{#each filterOptions as opt}
				<option value={opt}>{opt}</option>
			{/each}
		</select>
	</div>
	<a class="btn btn-sm btn-outline btn-secondary w-full sm:w-auto" href={`/master/santri/cetak-list?sortBy=${sortBy}&filter=${encodeURIComponent(filterValue)}`} target="_blank" rel="noopener">
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
			<path d="M6 2a1 1 0 00-1 1v2h10V3a1 1 0 00-1-1H6z" />
			<path fill-rule="evenodd" d="M4 7a2 2 0 00-2 2v5a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2H4zm2 9v-4h8v4H6z" clip-rule="evenodd" />
		</svg>
		Cetak List
	</a>
	<button class="btn btn-sm btn-outline w-full sm:w-auto" onclick={() => my_modal_import_santri.showModal()}>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
			<path d="M3 14a1 1 0 011-1h3v-2H5a1 1 0 110-2h2V7a1 1 0 112 0v2h2a1 1 0 110 2H9v2h3a1 1 0 011 1v2H3v-2z" />
			<path d="M7 3a1 1 0 012 0v7H7V3z" />
		</svg>
		Import Excel
	</button>
	<div class="form-control w-full sm:w-56">
		<label class="label py-0"><span class="label-text text-xs">Cari Santri</span></label>
		<input type="text" placeholder="Cari santri..." class="input input-sm input-bordered w-full" />
	</div>
	<button class="btn btn-sm btn-primary w-full sm:w-auto" onclick={() => my_modal_santri.showModal()}>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
			<path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
		</svg>
		Tambah Santri
	</button>
</div>

{#if form?.type}
	<div class={`alert ${form.type === 'success' ? 'alert-success' : 'alert-error'} mb-4 shadow-sm`}>
		<span>{form.message}</span>
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
				{#each sortedSantris as santri, i}
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
							<button class="btn btn-xs btn-outline btn-primary" onclick={() => { editSantri = { ...santri, detail: santri.detail || {} }; my_modal_edit_santri.showModal(); }}>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
								Edit
							</button>
							<a class="btn btn-xs btn-outline btn-secondary" href={`/master/santri/cetak/${santri.id}`} target="_blank" rel="noopener">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
								Cetak
							</a>
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

<!-- Modal Import Santri -->
<dialog id="my_modal_import_santri" class="modal">
	<div class="modal-box max-w-lg">
		<h3 class="font-bold text-lg mb-2">Import Santri (Excel/CSV)</h3>
		<p class="text-sm text-base-content/60 mb-4">
			Pastikan file CSV/Excel memiliki header yang sesuai dengan template (termasuk data detail alamat & orang tua).
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
				<label class="label" for="importFile"><span class="label-text">File CSV</span></label>
				<input id="importFile" name="file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="file-input file-input-bordered w-full" required />
				<label class="label">
					<span class="label-text-alt text-base-content/60">Tanggal gunakan format YYYY-MM-DD. Kolom kategori boleh kosong.</span>
				</label>
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
			return async ({ update }) => { await update(); my_modal_santri.close(); };
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
