<script>
	let { data } = $props();

	const formatRupiah = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');
	const formatTanggal = (t) => t
		? new Date(t).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
		: '-';

	const badgeClass = (status) => {
		if (status === 'Sudah termutasi') return 'badge-success';
		if (status === 'Sebagian termutasi') return 'badge-warning';
		return 'badge-error';
	};
</script>

<div class="mb-6">
	<h2 class="text-2xl font-bold">Rekap Petugas Pembayaran</h2>
	<p class="text-sm text-base-content/60">Daftar pembayaran yang diterima tiap petugas beserta status apakah saldo sudah dimutasi atau masih dibawa petugas.</p>
</div>

<div class="card bg-base-100 shadow-sm border border-base-200 mb-6">
	<div class="card-body py-4">
		<form method="GET" class="flex flex-wrap gap-3 items-end">
			{#if !data.isPetugas}
				<div class="form-control">
					<label class="label py-1" for="petugas"><span class="label-text text-xs font-medium">Petugas</span></label>
					<select id="petugas" name="petugas" class="select select-sm select-bordered">
						<option value="">Semua Petugas</option>
						{#each data.petugasList as petugas}
							<option value={petugas.id} selected={String(petugas.id) === data.filterPetugasId}>
								{petugas.namaLengkap} (@{petugas.username})
							</option>
						{/each}
					</select>
				</div>
			{/if}
			<div class="form-control">
				<label class="label py-1" for="bulan"><span class="label-text text-xs font-medium">Bulan</span></label>
				<select id="bulan" name="bulan" class="select select-sm select-bordered">
					<option value="all" selected={data.filterBulan === 'all'}>Semua Bulan</option>
					{#each data.bulanList as bulan}
						<option value={bulan} selected={bulan === data.filterBulan}>{bulan}</option>
					{/each}
				</select>
			</div>
			<div class="form-control">
				<label class="label py-1" for="tahun"><span class="label-text text-xs font-medium">Tahun</span></label>
				<select id="tahun" name="tahun" class="select select-sm select-bordered">
					<option value="all" selected={data.filterTahun === 'all'}>Semua Tahun</option>
					{#each data.tahunList as tahun}
						<option value={tahun} selected={tahun === data.filterTahun}>{tahun}</option>
					{/each}
				</select>
			</div>
			<div class="form-control">
				<label class="label py-1" for="status"><span class="label-text text-xs font-medium">Status Dana</span></label>
				<select id="status" name="status" class="select select-sm select-bordered">
					<option value="all" selected={data.filterStatus === 'all'}>Semua Pembayaran</option>
					<option value="belum" selected={data.filterStatus === 'belum'}>Masih di Petugas</option>
					<option value="sudah" selected={data.filterStatus === 'sudah'}>Sudah Dimutasi</option>
				</select>
			</div>
			<button type="submit" class="btn btn-sm btn-primary">Tampilkan</button>
		</form>
	</div>
</div>

{#if data.rekapPetugas.length === 0}
	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body py-12 text-center text-base-content/50">
			Tidak ada data pembayaran petugas untuk filter yang dipilih.
		</div>
	</div>
{:else}
	<div class="space-y-6">
		{#each data.rekapPetugas as petugas}
			<div class="card bg-base-100 shadow-sm border border-base-200">
				<div class="card-body">
					<div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
						<div>
							<h3 class="text-lg font-bold">{petugas.namaLengkap}</h3>
							<p class="text-sm text-base-content/60">@{petugas.username} · {petugas.role}</p>
						</div>
						<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:w-auto">
							<div class="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
								<div class="text-xs text-base-content/60">Total Masuk</div>
								<div class="font-bold text-primary">{formatRupiah(petugas.totalMasuk)}</div>
							</div>
							<div class="rounded-xl bg-error/10 border border-error/20 px-4 py-3">
								<div class="text-xs text-base-content/60">Sudah Termutasi</div>
								<div class="font-bold text-error">{formatRupiah(petugas.totalMutasi)}</div>
							</div>
							<div class="rounded-xl bg-success/10 border border-success/20 px-4 py-3">
								<div class="text-xs text-base-content/60">Saldo Tersisa</div>
								<div class="font-bold text-success">{formatRupiah(petugas.saldo)}</div>
							</div>
							<div class="rounded-xl bg-base-200/70 border border-base-300 px-4 py-3">
								<div class="text-xs text-base-content/60">Jumlah Transaksi</div>
								<div class="font-bold">{petugas.jumlahTransaksi}</div>
							</div>
						</div>
					</div>

					<div class="overflow-x-auto">
						<table class="table table-sm w-full">
							<thead>
								<tr class="bg-base-200/60">
									<th>Tanggal</th>
									<th>No. Kwitansi</th>
									<th>Pembayar</th>
									<th>Pembayaran</th>
									<th class="text-right">Nominal</th>
									<th class="text-right">Sudah Dimutasi</th>
									<th class="text-right">Masih Dibawa</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{#each petugas.pembayaran as trx}
									<tr>
										<td class="whitespace-nowrap text-xs">{formatTanggal(trx.tanggalBayar)}</td>
										<td class="font-mono text-xs text-base-content/70">{trx.nomorKwitansi}</td>
										<td>
											<div class="font-medium text-sm">{trx.namaPembayar}</div>
											<div class="text-xs text-base-content/50">{trx.nomorInduk || 'Pembayar umum'}</div>
										</td>
										<td>
											<div class="text-sm">{trx.keteranganKhusus || trx.namaPembayaran || '-'}</div>
											<div class="text-xs text-base-content/50">{trx.bulan ? `Bulan ${trx.bulan}` : '-'}</div>
										</td>
										<td class="text-right font-semibold">{formatRupiah(trx.nominalDibayar)}</td>
										<td class="text-right text-success">{formatRupiah(trx.nominalTermutasi)}</td>
										<td class="text-right text-error">{formatRupiah(trx.sisaDiPetugas)}</td>
										<td>
											<span class={`badge badge-outline ${badgeClass(trx.statusMutasi)}`}>
												{trx.statusMutasi}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
