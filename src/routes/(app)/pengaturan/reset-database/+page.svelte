<script>
	let { form } = $props();
</script>

<div class="mb-6">
	<h2 class="text-2xl font-bold">Reset Database</h2>
	<p class="text-sm text-base-content/60">Hanya menghapus riwayat pembayaran, mutasi saldo, dan system log.</p>
</div>

{#if form?.type}
	<div class={`alert ${form.type === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
		<span>{form.message}</span>
	</div>
{/if}

<div class="card bg-base-100 shadow-sm border border-base-200">
	<div class="card-body">
		<div class="alert alert-warning mb-4">
			<span>Tindakan ini tidak dapat dibatalkan. Pastikan benar-benar diperlukan.</span>
		</div>
		<form method="POST" action="?/reset" class="space-y-4">
			<div class="form-control">
				<label class="label" for="password"><span class="label-text">Konfirmasi Password Admin</span></label>
				<input id="password" name="password" type="password" class="input input-bordered w-full" placeholder="Masukkan password admin" required />
			</div>
			<button class="btn btn-error">Reset Database</button>
		</form>
	</div>
</div>
