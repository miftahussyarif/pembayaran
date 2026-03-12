<script>
	import { enhance } from '$app/forms';
	let { data } = $props();

	let hapusJp = $state(null);

	const tipeBadge = {
		bulanan: { label: 'Bulanan', cls: 'badge-primary' },
		tahunan: { label: 'Tahunan', cls: 'badge-accent' },
		sekali:  { label: 'Sekali Bayar', cls: 'badge-secondary' },
		smk_bulanan: { label: 'SMK Bulanan', cls: 'badge-info' },
		smk_tahunan: { label: 'SMK Tahunan', cls: 'badge-warning' },
		smk_sekali: { label: 'SMK Sekali', cls: 'badge-neutral' },
		smp_bulanan: { label: 'SMP Bulanan', cls: 'badge-info' },
		smp_tahunan: { label: 'SMP Tahunan', cls: 'badge-warning' },
		smp_sekali: { label: 'SMP Sekali', cls: 'badge-neutral' }
	};

	const tipeKeterangan = {
		bulanan: 'Dibayarkan setiap bulan selama tahun aktif',
		tahunan: 'Dibayarkan satu kali per tahun',
		sekali:  'Hanya dibayarkan satu kali (insidental)',
		smk_bulanan: 'SMK: dibayarkan setiap bulan',
		smk_tahunan: 'SMK: dibayarkan satu kali per tahun',
		smk_sekali: 'SMK: hanya satu kali (insidental)',
		smp_bulanan: 'SMP: dibayarkan setiap bulan',
		smp_tahunan: 'SMP: dibayarkan satu kali per tahun',
		smp_sekali: 'SMP: hanya satu kali (insidental)'
	};
</script>

<div class="flex justify-between items-center mb-6">
	<div>
		<h2 class="text-2xl font-bold">Jenis Pembayaran</h2>
		<p class="text-sm text-base-content/60 mt-1">Kelola jenis tagihan dan nominal standarnya</p>
	</div>
	<button class="btn btn-primary" onclick={() => modal_jenis_pembayaran.showModal()}>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
			<path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
		</svg>
		Tambah Jenis
	</button>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
	{#each data.jenisPembayarans as jp}
		<div class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
			<div class="card-body p-5">
				<div class="flex justify-between items-start">
					<h3 class="card-title text-lg">{jp.namaPembayaran}</h3>
					<div class="badge {tipeBadge[jp.tipe]?.cls || 'badge-ghost'} badge-sm">
						{tipeBadge[jp.tipe]?.label || jp.tipe}
					</div>
				</div>
				<p class="text-2xl font-bold mt-2 text-base-content/80">Rp {jp.nominalDefault.toLocaleString('id-ID')}</p>
				<p class="text-xs text-base-content/50 mt-1">{tipeKeterangan[jp.tipe] || ''}</p>
				<div class="card-actions justify-end mt-4">
					<button class="btn btn-xs btn-outline btn-error"
						onclick={() => { hapusJp = jp; modal_hapus_jp.showModal(); }}>
						Hapus
					</button>
				</div>
			</div>
		</div>
	{/each}

	{#if data.jenisPembayarans.length === 0}
		<div class="col-span-full text-center py-10 text-base-content/50 border-2 border-dashed border-base-300 rounded-xl">
			Belum ada data jenis pembayaran.
		</div>
	{/if}
</div>

<!-- Modal Konfirmasi Hapus -->
<dialog id="modal_hapus_jp" class="modal">
	<div class="modal-box max-w-sm">
		<h3 class="font-bold text-lg text-error mb-3">Hapus Jenis Pembayaran</h3>
		{#if hapusJp}
			<div class="bg-base-200 rounded-lg p-3 my-3 text-sm">
				<div class="font-bold">{hapusJp.namaPembayaran}</div>
				<div class="text-base-content/60 text-xs mt-1">Rp {hapusJp.nominalDefault.toLocaleString('id-ID')} · {tipeBadge[hapusJp.tipe]?.label}</div>
			</div>
			<p class="text-xs text-error mb-4">⚠️ Data transaksi yang terkait juga mungkin terpengaruh.</p>
		{/if}
		<div class="modal-action justify-between">
			<button class="btn" type="button" onclick={() => { modal_hapus_jp.close(); hapusJp = null; }}>Batal</button>
			<form method="POST" action="?/delete"
				use:enhance={() => {
					return async ({ update }) => { await update(); modal_hapus_jp.close(); hapusJp = null; };
				}}>
				<input type="hidden" name="id" value={hapusJp?.id} />
				<button type="submit" class="btn btn-error">Ya, Hapus</button>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<!-- Modal Tambah Jenis Pembayaran -->
<dialog id="modal_jenis_pembayaran" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Tambah Jenis Pembayaran</h3>
		<form method="POST" action="?/create" use:enhance={() => {
			return async ({ update }) => { await update(); modal_jenis_pembayaran.close(); };
		}}>
			<div class="form-control w-full mb-3">
				<label class="label" for="namaTagihan"><span class="label-text">Nama Tagihan</span></label>
				<input type="text" id="namaTagihan" name="namaPembayaran" placeholder="Contoh: Uang Gedung, Syahriyah..." class="input input-bordered w-full" required />
			</div>

			<div class="form-control w-full mb-3">
				<label class="label" for="tipeTagihan"><span class="label-text">Tipe Pembayaran</span></label>
				<select id="tipeTagihan" name="tipe" class="select select-bordered w-full" required>
					<option value="" disabled selected>Pilih Tipe</option>
					<option value="bulanan">Bulanan — Berulang tiap bulan dalam setahun</option>
					<option value="tahunan">Tahunan — Satu kali per tahun</option>
					<option value="sekali">Sekali Bayar — Hanya satu kali (insidental)</option>
					<option value="smk_bulanan">SMK Bulanan — Pembayaran SMK tiap bulan</option>
					<option value="smk_tahunan">SMK Tahunan — Pembayaran SMK tiap tahun</option>
					<option value="smk_sekali">SMK Sekali — Pembayaran SMK sekali bayar</option>
					<option value="smp_bulanan">SMP Bulanan — Pembayaran SMP tiap bulan</option>
					<option value="smp_tahunan">SMP Tahunan — Pembayaran SMP tiap tahun</option>
					<option value="smp_sekali">SMP Sekali — Pembayaran SMP sekali bayar</option>
				</select>
			</div>

			<div class="form-control w-full mb-6">
				<label class="label" for="nominalTagihan"><span class="label-text">Nominal Standar (Rp)</span></label>
				<input type="number" id="nominalTagihan" name="nominalDefault" placeholder="Contoh: 150000" min="0" class="input input-bordered w-full" required />
			</div>

			<div class="modal-action">
				<button type="button" class="btn" onclick={() => modal_jenis_pembayaran.close()}>Batal</button>
				<button type="submit" class="btn btn-primary">Simpan Tagihan</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
