<script>
	let { data, form } = $props();
</script>

<svelte:head>
	<title>Profil Pesantren - Aplikasi Pesantren</title>
</svelte:head>

<div class="card bg-base-100 shadow-xl max-w-2xl border border-base-200">
	<div class="card-body">
		<h2 class="card-title text-2xl font-bold mb-6">Profil Pesantren & Instansi</h2>

		{#if form?.success}
			<div class="alert alert-success mb-6">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				<span>{form.message}</span>
			</div>
		{/if}

		<form method="POST" action="?/updateProfil" enctype="multipart/form-data">
			<input type="hidden" name="id" value={data.profilPesantren?.id || 1} />

			<div class="form-control w-full mb-4">
				<label class="label"><span class="label-text font-bold uppercase text-xs tracking-wider">Nama Pesantren/Instansi</span></label>
				<input type="text" name="namaPesantren" value={data.profilPesantren?.namaPesantren || ''} class="input input-bordered w-full" required />
			</div>

			<div class="form-control w-full mb-4">
				<label class="label"><span class="label-text font-bold uppercase text-xs tracking-wider">Logo Lembaga (Upload)</span></label>
				<input type="file" name="logoFile" accept="image/*" class="file-input file-input-bordered w-full" />
				{#if data.profilPesantren?.logoUrl}
					<div class="mt-3 flex items-center gap-3">
						<img src={data.profilPesantren.logoUrl} alt="Logo saat ini" class="w-12 h-12 rounded-md object-cover border" />
						<span class="text-xs text-base-content/60">Logo saat ini</span>
					</div>
				{/if}
			</div>

			<div class="form-control w-full mb-4">
				<label class="label"><span class="label-text font-bold uppercase text-xs tracking-wider">Alamat Lengkap</span></label>
				<textarea name="alamat" class="textarea textarea-bordered h-24" required>{data.profilPesantren?.alamat || ''}</textarea>
			</div>

			<div class="form-control w-full mb-6">
				<label class="label"><span class="label-text font-bold uppercase text-xs tracking-wider">No. Telepon / WhatsApp</span></label>
				<input type="text" name="noTelp" value={data.profilPesantren?.noTelp || ''} class="input input-bordered w-full" required />
			</div>

			<div class="divider"></div>

			<div class="card-actions justify-end mt-4">
				<button type="submit" class="btn btn-primary px-8">Simpan Perubahan</button>
			</div>
		</form>
	</div>
</div>
