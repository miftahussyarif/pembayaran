<script>
	const downloadUrl = '/pengaturan/backup-database/download.json';
</script>

<div class="mb-6">
	<h2 class="text-2xl font-bold">Backup Database</h2>
	<p class="text-sm text-base-content/60">Backup data master, transaksi, mutasi saldo, dan system log.</p>
</div>

<div class="card bg-base-100 shadow-sm border border-base-200">
	<div class="card-body">
		<div class="alert alert-info mb-4">
			<span>File backup berisi data master, transaksi, mutasi saldo, dan system log.</span>
		</div>
		<a class="btn btn-primary" href={downloadUrl} target="_blank" rel="noopener">Download Backup</a>
	</div>
</div>
