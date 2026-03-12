<script>
	let { data } = $props();

	const formatTanggal = (t) =>
		t ? new Date(t).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

	const exportUrl = `/pengaturan/system-full-log/export.csv?start=${encodeURIComponent(data.filters.start || '')}&end=${encodeURIComponent(data.filters.end || '')}&userId=${encodeURIComponent(data.filters.userId || '')}`;
</script>

<div class="mb-6">
	<h2 class="text-2xl font-bold">System Full Log</h2>
	<p class="text-sm text-base-content/60">Log aktivitas user dan sistem (tanpa log cetak).</p>
</div>

<div class="card bg-base-100 shadow-sm border border-base-200 mb-6">
	<div class="card-body">
		<form method="GET" class="flex flex-wrap gap-3 items-end">
			<div class="form-control">
				<label class="label py-1" for="filterStart"><span class="label-text text-xs font-medium">Tanggal Mulai</span></label>
				<input id="filterStart" name="start" type="date" class="input input-sm input-bordered" value={data.filters.start} />
			</div>
			<div class="form-control">
				<label class="label py-1" for="filterEnd"><span class="label-text text-xs font-medium">Tanggal Akhir</span></label>
				<input id="filterEnd" name="end" type="date" class="input input-sm input-bordered" value={data.filters.end} />
			</div>
			<div class="form-control min-w-[220px]">
				<label class="label py-1" for="filterUser"><span class="label-text text-xs font-medium">User</span></label>
				<select id="filterUser" name="userId" class="select select-sm select-bordered">
					<option value="" selected={data.filters.userId === ''}>Semua User</option>
					{#each data.users as u}
						<option value={u.id} selected={String(u.id) === data.filters.userId}>
							{u.namaLengkap} (@{u.username}) — {u.role}
						</option>
					{/each}
				</select>
			</div>
			<button type="submit" class="btn btn-sm btn-primary">Terapkan</button>
			<a class="btn btn-sm btn-outline" href={exportUrl} target="_blank" rel="noopener">Export CSV</a>
		</form>
	</div>
</div>

<div class="card bg-base-100 shadow-sm border border-base-200">
	<div class="card-body">
		<div class="flex items-center justify-between mb-3">
			<h3 class="font-semibold">Riwayat Log Terakhir</h3>
			<span class="badge badge-outline">{data.logs.length} data</span>
		</div>
		<div class="overflow-x-auto">
			<table class="table table-sm w-full">
				<thead>
					<tr class="bg-base-200/60">
						<th>Waktu</th>
						<th>User</th>
						<th>Role</th>
						<th>Aksi</th>
						<th>Modul</th>
						<th>Keterangan</th>
						<th>IP</th>
					</tr>
				</thead>
				<tbody>
					{#if data.logs.length === 0}
						<tr>
							<td colspan="7" class="text-center text-base-content/50 py-6">Belum ada log.</td>
						</tr>
					{:else}
						{#each data.logs as l}
							<tr>
								<td class="text-xs">{formatTanggal(l.createdAt)}</td>
								<td class="text-sm">{l.username || '-'}</td>
								<td class="text-xs uppercase">{l.role || '-'}</td>
								<td class="text-sm">{l.aksi}</td>
								<td class="text-sm">{l.modul}</td>
								<td class="text-sm">{l.keterangan || '-'}</td>
								<td class="text-xs">{l.ip || '-'}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
