<script>
	let { data, form } = $props();

	const formatRupiah = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');
</script>

<div class="mb-6">
	<h2 class="text-2xl font-bold">Saldo Keuangan</h2>
	<p class="text-sm text-base-content/60">Rekap total uang diterima per penerima dan mutasi saldo.</p>
</div>

{#if form?.type}
	<div class={`alert ${form.type === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
		<span>{form.message}</span>
	</div>
{/if}

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
	<div class="lg:col-span-2">
		<div class="card bg-base-100 shadow-sm border border-base-200">
			<div class="card-body">
				<h3 class="font-semibold mb-3">Rekap Saldo per Penerima</h3>
				<div class="overflow-x-auto">
					<table class="table table-sm w-full">
						<thead>
							<tr class="bg-base-200/60">
								<th>Nama</th>
								<th class="text-right">Total Masuk</th>
								<th class="text-right">Total Mutasi</th>
								<th class="text-right">Saldo</th>
							</tr>
						</thead>
						<tbody>
							{#if data.rekap.length === 0}
								<tr>
									<td colspan="4" class="text-center text-base-content/50 py-6">Belum ada bendahara.</td>
								</tr>
							{:else}
								{#each data.rekap as r}
									<tr>
										<td>
									<div class="font-medium">{r.namaLengkap}</div>
									<div class="text-xs text-base-content/60">@{r.username} · {r.role}</div>
										</td>
										<td class="text-right">{formatRupiah(r.totalMasuk)}</td>
										<td class="text-right text-error">{formatRupiah(r.totalMutasi)}</td>
										<td class="text-right font-bold text-success">{formatRupiah(r.saldo)}</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>

	<div class="lg:col-span-1">
		<div class="card bg-base-100 shadow-sm border border-base-200">
			<div class="card-body">
				<h3 class="font-semibold mb-3">Input Mutasi Saldo</h3>
				<form method="POST" action="?/createMutasi" class="space-y-3">
					<div class="form-control">
						<label class="label" for="bendaharaId"><span class="label-text">Penerima</span></label>
						<select id="bendaharaId" name="bendaharaId" class="select select-sm select-bordered w-full" required>
							<option value="" disabled selected>Pilih Penerima...</option>
							{#each data.bendaharaList as b}
								<option value={b.id}>{b.namaLengkap} (@{b.username})</option>
							{/each}
						</select>
					</div>
					<div class="form-control">
						<label class="label" for="nominal"><span class="label-text">Nominal Mutasi (Rp)</span></label>
						<input id="nominal" type="number" name="nominal" min="1" class="input input-sm input-bordered w-full" placeholder="Contoh: 250000" required />
						<div class="label pt-1">
							<span class="label-text-alt text-base-content/60">Nominal ini akan mengurangi saldo bendahara.</span>
						</div>
					</div>
					<div class="form-control">
						<label class="label" for="catatan"><span class="label-text">Catatan</span></label>
						<textarea id="catatan" name="catatan" rows="3" class="textarea textarea-bordered w-full" placeholder="Contoh: Setor ke admin / Belanja ATK"></textarea>
					</div>
					<button class="btn btn-primary w-full">Simpan Mutasi</button>
				</form>
			</div>
		</div>
	</div>
</div>

<div class="card bg-base-100 shadow-sm border border-base-200">
	<div class="card-body">
		<h3 class="font-semibold mb-3">Riwayat Mutasi</h3>
		<div class="overflow-x-auto">
			<table class="table table-sm w-full">
				<thead>
					<tr class="bg-base-200/60">
						<th>Tanggal</th>
						<th>Bendahara</th>
						<th class="text-right">Nominal</th>
						<th>Catatan</th>
					</tr>
				</thead>
				<tbody>
					{#if data.mutasiList.length === 0}
						<tr>
							<td colspan="4" class="text-center text-base-content/50 py-6">Belum ada mutasi.</td>
						</tr>
					{:else}
						{#each data.mutasiList as m}
							<tr>
								<td class="text-xs">{new Date(m.tanggal).toLocaleDateString('id-ID')}</td>
								<td class="text-sm">{m.bendaharaNama || '-'}</td>
								<td class="text-right font-semibold text-error">{formatRupiah(m.nominal)}</td>
								<td class="text-sm">{m.catatan || '-'}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
