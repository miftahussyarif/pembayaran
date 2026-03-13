<script>
	import { page } from '$app/stores';
	let { data } = $props();

	const angka = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
	function terbilang(n) {
		const x = Math.floor(Number(n || 0));
		if (x < 12) return angka[x];
		if (x < 20) return `${angka[x - 10]} belas`;
		if (x < 100) return `${angka[Math.floor(x / 10)]} puluh${x % 10 ? ` ${terbilang(x % 10)}` : ''}`;
		if (x < 200) return `seratus${x % 100 ? ` ${terbilang(x - 100)}` : ''}`;
		if (x < 1000) return `${terbilang(Math.floor(x / 100))} ratus${x % 100 ? ` ${terbilang(x % 100)}` : ''}`;
		if (x < 2000) return `seribu${x % 1000 ? ` ${terbilang(x - 1000)}` : ''}`;
		if (x < 1000000) return `${terbilang(Math.floor(x / 1000))} ribu${x % 1000 ? ` ${terbilang(x % 1000)}` : ''}`;
		if (x < 1000000000) return `${terbilang(Math.floor(x / 1000000))} juta${x % 1000000 ? ` ${terbilang(x % 1000000)}` : ''}`;
		if (x < 1000000000000) return `${terbilang(Math.floor(x / 1000000000))} miliar${x % 1000000000 ? ` ${terbilang(x % 1000000000)}` : ''}`;
		return `${terbilang(Math.floor(x / 1000000000000))} triliun${x % 1000000000000 ? ` ${terbilang(x % 1000000000000)}` : ''}`;
	}
</script>

<svelte:head>
	<title>Kwitansi - {data.pembayaran.nomorKwitansi}</title>
	<style>
		@media print {
			.navbar { display: none !important; }
			.drawer, .drawer-content, main { background: white !important; }
			.min-h-screen { min-height: auto !important; }
			.card-body { padding-bottom: 8mm !important; }
			table th, table td { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
			h1, h2 { margin-top: 0 !important; margin-bottom: 0 !important; }
		}
	</style>
</svelte:head>

<div class="min-h-screen bg-base-200 flex justify-center items-start p-2 md:p-5 font-sans print:bg-white print:p-0">
	<div class="card w-full max-w-2xl bg-base-100 shadow-xl print:shadow-none print:rounded-none">
		<div class="card-body print:px-8 print:py-4">
			
			<div class="flex justify-between items-center border-b-2 border-base-300 pb-2 mb-2">
				<div class="flex items-center gap-4">
					<div class="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-2xl overflow-hidden">
						{#if $page.data.profilPesantren?.logoUrl}
							<img src={$page.data.profilPesantren.logoUrl} alt="Logo" class="w-full h-full object-cover" />
						{:else}
							{$page.data.profilPesantren?.namaPesantren?.charAt(0) || 'P'}
						{/if}
					</div>
					<div>
						<h1 class="text-2xl font-bold">{$page.data.profilPesantren?.namaPesantren || 'Aplikasi Pesantren'}</h1>
						<p class="text-base-content/60 text-sm">{$page.data.profilPesantren?.alamat || 'Alamat Pesantren'}</p>
					</div>
				</div>
				<div class="text-right">
					<h2 class="text-xl font-bold tracking-widest text-primary">KWITANSI</h2>
					<p class="text-sm font-mono mt-1">{data.pembayaran.nomorKwitansi}</p>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-y-2 mb-2 text-sm">
				<div>
					<span class="text-base-content/50 block mb-1">Telah Diterima Dari:</span>
					<span class="font-bold text-lg">{data.santri.namaLengkap}</span>
					<div class="text-base-content/70 mt-1">No Induk: {data.santri.nomorInduk}</div>
				</div>
				<div class="text-right">
					<span class="text-base-content/50 block mb-1">Tanggal Bayar:</span>
					<span class="font-bold">{new Date(data.pembayaran.tanggalBayar).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</span>
					<div class="text-base-content/70 mt-1">Tahun Ajaran: {data.tahunAjaran.nama}</div>
				</div>
			</div>

			<div class="overflow-x-auto border border-base-200 rounded-lg mb-2">
				<table class="table w-full">
					<thead class="bg-base-200/50">
						<tr>
							<th>Keterangan Pembayaran</th>
							<th class="text-right">Nominal</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="font-medium text-base">
								{data.jenisPembayaran.namaPembayaran}
								{#if data.pembayaran.bulan}
									<span class="badge badge-sm badge-outline ml-2">Bulan: {data.pembayaran.bulan}</span>
								{/if}
							</td>
							<td class="text-right text-lg font-bold">Rp {data.pembayaran.nominalDibayar.toLocaleString('id-ID')}</td>
						</tr>
					</tbody>
					<tfoot>
						<tr class="bg-primary/5 text-primary">
							<td class="text-right font-bold text-lg">TOTAL</td>
							<td class="text-right font-bold text-xl">Rp {data.pembayaran.nominalDibayar.toLocaleString('id-ID')}</td>
						</tr>
						<tr>
							<td colspan="2" class="text-left text-sm italic text-base-content/70 py-1">
								Terbilang: {terbilang(data.pembayaran.nominalDibayar)} rupiah
							</td>
						</tr>
					</tfoot>
				</table>
			</div>

			<div class="grid grid-cols-2 mt-3 pt-2">
				<div>
					<!-- Kosong di kiri -->
				</div>
				<div class="text-center relative">
					<p class="mb-16 text-base-content/70">Penerima / Bendahara</p>
					{#if $page.data.profilPesantren?.stampUrl}
						<img
							src={$page.data.profilPesantren.stampUrl}
							alt="Stempel lembaga"
							class="w-28 h-28 object-contain opacity-80 absolute left-1/2 -translate-x-1/2 -top-2"
						/>
					{/if}
					{#if data.petugasSignatureUrl}
						<img
							src={data.petugasSignatureUrl}
							alt="Tanda tangan"
							class="w-32 h-16 object-contain mx-auto mb-2 relative"
						/>
					{/if}
					<div class="w-32 border-b border-base-content mx-auto"></div>
					<p class="mt-2 font-semibold">{data.petugas}</p>
				</div>
			</div>

			<!-- Action Buttons (Hides in Print) -->
			<div class="card-actions justify-center mt-12 print:hidden border-t border-base-200 pt-6">
				<a href="/transaksi/input" class="btn btn-ghost">Kembali</a>
				<button class="btn btn-primary px-8" onclick={() => window.print()}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
					Cetak Sekarang
				</button>
			</div>

		</div>
	</div>
</div>
