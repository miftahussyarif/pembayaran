<script>
	import { enhance } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';

	let { data, form } = $props();
	
	let selectedJenisId = $state('');
	let selectedSantriId = $state('');
	let selectedTahunAjaranId = $state('');
	let selectedBulan = $state('');
	let isSubmitting = $state(false);
	let santriSearch = $state('');
	
	let selectedJenis = $derived(data.jenisPembayarans.find(j => j.id == selectedJenisId) || null);
	let selectedSantri = $derived(data.santris.find(s => s.id == selectedSantriId) || null);
	let filteredSantris = $derived.by(() => {
		const query = santriSearch.trim().toLowerCase();
		let list = data.santris;
		if (query) {
			list = data.santris.filter((s) => {
				const nomor = String(s.nomorInduk || '').toLowerCase();
				const nama = String(s.namaLengkap || '').toLowerCase();
				return nomor.includes(query) || nama.includes(query);
			});
		}
		if (selectedSantriId && !list.some((s) => s.id == selectedSantriId)) {
			const selected = data.santris.find((s) => s.id == selectedSantriId);
			if (selected) list = [selected, ...list];
		}
		return list;
	});
	
	let nominal = $state(0);
	let isBulanan = $derived(
		selectedJenis?.tipe === 'bulanan' ||
		selectedJenis?.tipe === 'smk_bulanan' ||
		selectedJenis?.tipe === 'smp_bulanan'
	);
	let isSyahriyah = $derived(
		!!selectedJenis && /syahriyah|spp/i.test(selectedJenis.namaPembayaran || '')
	);
	let isSantriGratisSyahriyah = $derived(selectedSantri?.nominalSyahriyah === 0);
	let isSantriYatim = $derived(!!selectedSantri?.namaKategori && /yatim/i.test(selectedSantri.namaKategori));
	let isSmkSmpBulanan = $derived(
		selectedJenis?.tipe === 'smk_bulanan' || selectedJenis?.tipe === 'smp_bulanan'
	);
	let isYatimGratisSmkSmp = $derived(isSantriYatim && isSyahriyah && isSmkSmpBulanan);
	let isFormValid = $derived(
		selectedSantriId &&
		selectedTahunAjaranId &&
		selectedJenisId &&
		(isYatimGratisSmkSmp ? nominal >= 0 : nominal > 0) &&
		(!isBulanan || selectedBulan) &&
		!(isBulanan && isSantriGratisSyahriyah && !isYatimGratisSmkSmp)
	);

	// Cek apakah bulan sudah lunas
	let isBulanLunas = $derived.by(() => {
		if (!selectedBulan || !selectedSantriId || !selectedTahunAjaranId || !selectedJenisId) return false;
		return data.pembayaranBulanan.some(p => 
			p.santriId == selectedSantriId && 
			p.tahunAjaranId == selectedTahunAjaranId && 
			p.jenisPembayaranId == selectedJenisId &&
			p.bulan === selectedBulan
		);
	});

	$effect(() => {
		if (!selectedJenis) return;
		if (isSyahriyah) {
			nominal = selectedSantri?.nominalSyahriyah ?? 0;
			if (isYatimGratisSmkSmp) nominal = 0;
			return;
		}
		nominal = selectedJenis.nominalDefault;
	});

</script>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
	<!-- Form Input Start -->
	<div class="lg:col-span-2">
		<div class="card bg-base-100 shadow-sm border border-base-200">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-6 flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
					Input Pembayaran Baru
				</h2>

				{#if form?.success === false}
					<div class="alert alert-error mb-4">
						<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m2-2l2 2M19 6a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						<span>{form.message}</span>
					</div>
				{/if}
				
				<form method="POST" action="?/create" use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						console.log('Form submission result:', result);
						isSubmitting = false;
						
						if (result.type === 'success' && result.data?.id) {
							await goto(`/transaksi/cetak/${result.data.id}`, { replaceState: true });
							return;
						}

						if (result.type === 'success') {
							// Jika sukses tapi tanpa id, bersihkan state & refresh data
							selectedSantriId = '';
							selectedTahunAjaranId = '';
							selectedBulan = '';
							selectedJenisId = '';
							nominal = 0;
							await invalidateAll();
							return;
						}

						await update();
					};
				}}>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<!-- Pilih Santri -->
						<div class="form-control w-full">
							<label for="santriId" class="label"><span class="label-text font-medium">Santri</span></label>
							<input type="text" placeholder="Cari nama atau nomor induk..." class="input input-bordered w-full mb-2" bind:value={santriSearch} />
							<select id="santriId" name="santriId" class="select select-bordered w-full" bind:value={selectedSantriId} required>
								<option value="" disabled selected>Pilih Santri...</option>
								{#each filteredSantris as santri}
									<option value={santri.id}>
										{santri.nomorInduk} - {santri.namaLengkap}
										{santri.nominalSyahriyah === 0 ? ' (GRATIS SPP)' : ''}
									</option>
								{/each}
							</select>
							{#if santriSearch && filteredSantris.length === 0}
								<div class="label pt-2 pb-0">
									<span class="label-text-alt text-base-content/60">Tidak ada santri yang cocok.</span>
								</div>
							{/if}
						</div>

						<!-- Pilih Tahun -->
						<div class="form-control w-full">
							<label for="tahunAjaranId" class="label"><span class="label-text font-medium">Tahun</span></label>
							<select id="tahunAjaranId" name="tahunAjaranId" class="select select-bordered w-full" bind:value={selectedTahunAjaranId} required>
								{#each data.tahunAjarans as ta}
									<option value={ta.id} selected={ta.isActive}>{ta.nama}</option>
								{/each}
							</select>
						</div>

						<!-- Pilih Jenis Tagihan -->
						<div class="form-control w-full md:col-span-2">
							<label for="jenisPembayaranId" class="label"><span class="label-text font-medium">Jenis Pembayaran</span></label>
							<select id="jenisPembayaranId" name="jenisPembayaranId" class="select select-bordered w-full" bind:value={selectedJenisId} required>
								<option value="" disabled selected>Pilih Tagihan...</option>
								{#each data.jenisPembayarans as jp}
									<option value={jp.id}>
										{jp.namaPembayaran} (
											{jp.tipe === 'bulanan' ? 'Bulanan' :
											jp.tipe === 'tahunan' ? 'Tahunan' :
											jp.tipe === 'sekali' ? 'Sekali' :
											jp.tipe === 'smk_bulanan' ? 'SMK Bulanan' :
											jp.tipe === 'smk_tahunan' ? 'SMK Tahunan' :
											jp.tipe === 'smk_sekali' ? 'SMK Sekali' :
											jp.tipe === 'smp_bulanan' ? 'SMP Bulanan' :
											jp.tipe === 'smp_tahunan' ? 'SMP Tahunan' :
											jp.tipe === 'smp_sekali' ? 'SMP Sekali' : jp.tipe}
										)
									</option>
								{/each}
							</select>
						</div>

						<!-- Pilihan Bulan (Jika Bulanan) -->
						{#if isBulanan}
							<div class="form-control w-full md:col-span-2 bg-primary/5 p-4 rounded-xl border border-primary/20">
							<label for="bulan" class="label"><span class="label-text font-medium text-primary">Bayar Untuk Bulan</span></label>
							<select id="bulan" name="bulan" class="select select-bordered w-full" bind:value={selectedBulan} required>
									<option value="" disabled selected>Pilih Bulan...</option>
									<option value="Januari">Januari</option>
									<option value="Februari">Februari</option>
									<option value="Maret">Maret</option>
									<option value="April">April</option>
									<option value="Mei">Mei</option>
									<option value="Juni">Juni</option>
									<option value="Juli">Juli</option>
									<option value="Agustus">Agustus</option>
									<option value="September">September</option>
									<option value="Oktober">Oktober</option>
									<option value="November">November</option>
									<option value="Desember">Desember</option>
								</select>
								{#if selectedBulan && (selectedSantriId && selectedTahunAjaranId && selectedJenisId)}
									{#if isBulanLunas}
										<div class="label pt-2 pb-0">
											<span class="label-text-alt text-success font-medium">✓ Bulan ini sudah lunas</span>
										</div>
									{:else}
										<div class="label pt-2 pb-0">
											<span class="label-text-alt text-base-content/60">Status pembayaran: Belum dibayar</span>
										</div>
									{/if}
								{:else}
									<div class="label pt-2 pb-0">
										<span class="label-text-alt text-base-content/60">Sistem akan memvalidasi apakah bulan ini sudah lunas atau belum (Fitur lanjutan).</span>
									</div>
								{/if}
							</div>
						{/if}

						<div class="form-control w-full md:col-span-2">
							<label for="nominalDibayar" class="label"><span class="label-text font-medium">Nominal Pembayaran (Rp)</span></label>
							<input id="nominalDibayar" type="number" name="nominalDibayar" bind:value={nominal} class="input input-bordered w-full font-bold text-lg" min={isYatimGratisSmkSmp ? 0 : 1} required />
							{#if nominal <= 0 && !isYatimGratisSmkSmp}
								<div class="label pt-2 pb-0">
									<span class="label-text-alt text-error">Nominal harus lebih dari 0</span>
								</div>
							{/if}
							{#if isBulanan && isSantriGratisSyahriyah && !isYatimGratisSmkSmp}
								<div class="label pt-2 pb-0">
									<span class="label-text-alt text-error">Santri kategori gratis tidak dapat membayar SPP/Syahriyah.</span>
								</div>
							{/if}
						</div>
					</div>

					<div class="divider"></div>
					
					<div class="flex justify-end gap-3 mt-4">
						<button type="reset" class="btn btn-ghost" disabled={isSubmitting}>Reset Form</button>
						<button type="submit" class="btn btn-primary px-8" disabled={!isFormValid || isSubmitting}>
							{#if isSubmitting}
								<span class="loading loading-spinner loading-sm"></span>
								Memproses...
							{:else}
								Simpan & Cetak Kwitansi
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>

	<!-- Sidebar Kanan (Riwayat Singkat) -->
	<div class="lg:col-span-1">
		<div class="card bg-base-100 shadow-sm border border-base-200 sticky top-24">
			<div class="card-body">
				<h3 class="card-title text-lg mb-4">Riwayat Terakhir</h3>
				<ul class="steps steps-vertical space-y-4">
					{#each data.riwayatData.slice(0, 5) as r}
						<li class="step step-primary">
							<div class="text-left py-1">
								<div class="font-bold text-sm">{r.nomorKwitansi}</div>
								<div class="text-xs text-base-content/70 mt-1 mb-1">Rp {r.nominalDibayar.toLocaleString('id')}</div>
								<div class="text-xs font-mono">{new Date(r.tanggalBayar).toLocaleDateString()}</div>
							</div>
						</li>
					{/each}
					{#if data.riwayatData.length === 0}
						<div class="text-sm text-center text-base-content/50 py-4">Belum ada transaksi</div>
					{/if}
				</ul>
			</div>
		</div>
	</div>
</div>
