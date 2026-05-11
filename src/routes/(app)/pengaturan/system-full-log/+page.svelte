<script>
	let { data } = $props();

	const formatTanggal = (t) =>
		t ? new Date(t).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

	let exportUrl = $derived(
		`/pengaturan/system-full-log/export.csv?start=${encodeURIComponent(data.filters.start || '')}&end=${encodeURIComponent(data.filters.end || '')}&userId=${encodeURIComponent(data.filters.userId || '')}`
	);

	import { enhance } from '$app/forms';
</script>

<svelte:head>
	<title>System Full Log</title>
</svelte:head>

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
		
		<form method="POST" action="?/deleteAll" use:enhance class="mt-4 border-t pt-4 border-base-200" onsubmit={() => confirm('Yakin ingin menghapus seluruh log sistem secara permanen? Tindakan ini tidak dapat dibatalkan.')}>
			<button type="submit" class="btn btn-sm btn-error text-white">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
				Hapus Semua Log
			</button>
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
