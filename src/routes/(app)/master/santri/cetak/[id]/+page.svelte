<script>
	import { page } from '$app/stores';
	let { data } = $props();

	const formatDate = (value) => {
		if (!value) return '-';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
	};

	const formatNumber = (value) => {
		if (value === null || value === undefined || value === '') return '-';
		const num = Number(value);
		return Number.isFinite(num) ? num.toLocaleString('id-ID') : value;
	};
</script>

<svelte:head>
	<title>Data Santri - {data.santri.namaLengkap}</title>
	<style>
		@page {
			size: A4;
			margin: 8mm;
		}
		@media print {
			.navbar { display: none !important; }
			.drawer, .drawer-content, main { background: white !important; }
			.min-h-screen { min-height: auto !important; }
			.card-body { padding: 0 !important; }
			table th, table td { padding-top: 0.2rem !important; padding-bottom: 0.2rem !important; }
			h1 { font-size: 18px !important; }
			h2 { font-size: 14px !important; }
			h3 { font-size: 12px !important; }
			p { font-size: 11px !important; }
			.print-page { font-size: 11px !important; }
			.print-page .border { padding: 0.5rem !important; }
			.print-page .mb-6 { margin-bottom: 0.5rem !important; }
			.print-page .mb-4 { margin-bottom: 0.35rem !important; }
			.print-page .gap-4 { gap: 0.5rem !important; }
			.print-page .gap-3 { gap: 0.4rem !important; }
			.card { max-width: none !important; box-shadow: none !important; }
			.badge { font-size: 9px !important; padding-left: 0.35rem !important; padding-right: 0.35rem !important; }
		}
	</style>
</svelte:head>

<div class="min-h-screen bg-base-200 flex justify-center items-start p-2 md:p-5 font-sans print:bg-white print:p-0 print-page">
	<div class="card w-full max-w-4xl bg-base-100 shadow-xl print:shadow-none print:rounded-none">
		<div class="card-body print:px-8 print:py-4">
			<div class="flex justify-between items-center border-b-2 border-base-300 pb-2 mb-4">
				<div class="flex items-center gap-4">
					<div class="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xl overflow-hidden">
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
					<h2 class="text-xl font-bold tracking-wide text-primary">DATA SANTRI</h2>
					<p class="text-sm text-base-content/70">No. Induk: {data.santri.nomorInduk}</p>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<div class="border border-base-200 rounded-lg p-3">
					<h3 class="font-semibold text-sm text-primary mb-2">Ringkasan Santri</h3>
					<table class="table w-full">
						<tbody>
							<tr><td class="text-base-content/60">Nama Lengkap</td><td class="font-semibold">{data.santri.namaLengkap}</td></tr>
							<tr><td class="text-base-content/60">Kategori</td><td>{data.kategori?.namaKategori || '-'}</td></tr>
							<tr><td class="text-base-content/60">Tanggal Masuk</td><td>{formatDate(data.santri.tanggalMasuk)}</td></tr>
							<tr><td class="text-base-content/60">Tanggal Keluar</td><td>{formatDate(data.santri.tanggalKeluar)}</td></tr>
							<tr><td class="text-base-content/60">Status</td><td>{data.santri.isActive ? 'Aktif' : 'Berhenti'}</td></tr>
						</tbody>
					</table>
				</div>
				<div class="border border-base-200 rounded-lg p-3">
					<h3 class="font-semibold text-sm text-primary mb-2">Identitas Peserta Didik</h3>
					<table class="table w-full">
						<tbody>
							<tr><td class="text-base-content/60">Tempat Lahir</td><td>{data.detail.tempatLahir || '-'}</td></tr>
							<tr><td class="text-base-content/60">Tanggal Lahir</td><td>{formatDate(data.detail.tanggalLahir)}</td></tr>
							<tr><td class="text-base-content/60">Jenis Kelamin</td><td>{data.detail.jenisKelamin || '-'}</td></tr>
							<tr><td class="text-base-content/60">Golongan Darah</td><td>{data.detail.golonganDarah || '-'}</td></tr>
							<tr><td class="text-base-content/60">NIK</td><td>{data.detail.nik || '-'}</td></tr>
							<tr><td class="text-base-content/60">No. KK</td><td>{data.detail.noKk || '-'}</td></tr>
							<tr><td class="text-base-content/60">Anak Ke-</td><td>{formatNumber(data.detail.anakKe)}</td></tr>
							<tr><td class="text-base-content/60">Jumlah Saudara</td><td>{formatNumber(data.detail.jumlahSaudara)}</td></tr>
						</tbody>
					</table>
				</div>
			</div>

			<div class="border border-base-200 rounded-lg p-3 mb-4">
				<h3 class="font-semibold text-sm text-primary mb-2">Alamat & Kesehatan</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<table class="table w-full">
						<tbody>
							<tr><td class="text-base-content/60">Alamat Lengkap</td><td>{data.detail.alamatLengkap || '-'}</td></tr>
							<tr><td class="text-base-content/60">RT/RW</td><td>{data.detail.rt || '-'} / {data.detail.rw || '-'}</td></tr>
							<tr><td class="text-base-content/60">Desa/Kelurahan</td><td>{data.detail.desaKelurahan || '-'}</td></tr>
							<tr><td class="text-base-content/60">Kecamatan</td><td>{data.detail.kecamatan || '-'}</td></tr>
							<tr><td class="text-base-content/60">Kabupaten</td><td>{data.detail.kabupaten || '-'}</td></tr>
						</tbody>
					</table>
					<table class="table w-full">
						<tbody>
							<tr><td class="text-base-content/60">Provinsi</td><td>{data.detail.provinsi || '-'}</td></tr>
							<tr><td class="text-base-content/60">Tinggi / Berat</td><td>{formatNumber(data.detail.tinggiCm)} cm / {formatNumber(data.detail.beratKg)} kg</td></tr>
							<tr><td class="text-base-content/60">No. KIP</td><td>{data.detail.noKip || '-'}</td></tr>
							<tr><td class="text-base-content/60">No. KIS/KPS/PKH</td><td>{data.detail.noKisKpsPkh || '-'}</td></tr>
							<tr><td class="text-base-content/60">Kebutuhan Khusus</td><td>{data.detail.kebutuhanKhusus || '-'}</td></tr>
						</tbody>
					</table>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<div class="border border-base-200 rounded-lg p-3">
					<h3 class="font-semibold text-sm text-primary mb-2">Data Ayah / Wali</h3>
					<table class="table w-full">
						<tbody>
							<tr><td class="text-base-content/60">Nama Ayah</td><td>{data.detail.namaAyah || '-'}</td></tr>
							<tr><td class="text-base-content/60">Tanggal Lahir</td><td>{formatDate(data.detail.tanggalLahirAyah)}</td></tr>
							<tr><td class="text-base-content/60">Pendidikan</td><td>{data.detail.pendidikanAyah || '-'}</td></tr>
							<tr><td class="text-base-content/60">NIK</td><td>{data.detail.nikAyah || '-'}</td></tr>
							<tr><td class="text-base-content/60">Alamat</td><td>{data.detail.alamatAyah || '-'}</td></tr>
							<tr><td class="text-base-content/60">No. HP</td><td>{data.detail.noHpAyah || '-'}</td></tr>
							<tr><td class="text-base-content/60">Pekerjaan</td><td>{data.detail.pekerjaanAyah || '-'}</td></tr>
							<tr><td class="text-base-content/60">Penghasilan</td><td>Rp {formatNumber(data.detail.penghasilanAyah)}</td></tr>
						</tbody>
					</table>
				</div>
				<div class="border border-base-200 rounded-lg p-3">
					<h3 class="font-semibold text-sm text-primary mb-2">Data Ibu</h3>
					<table class="table w-full">
						<tbody>
							<tr><td class="text-base-content/60">Nama Ibu</td><td>{data.detail.namaIbu || '-'}</td></tr>
							<tr><td class="text-base-content/60">Tanggal Lahir</td><td>{formatDate(data.detail.tanggalLahirIbu)}</td></tr>
							<tr><td class="text-base-content/60">Pendidikan</td><td>{data.detail.pendidikanIbu || '-'}</td></tr>
							<tr><td class="text-base-content/60">NIK</td><td>{data.detail.nikIbu || '-'}</td></tr>
							<tr><td class="text-base-content/60">Alamat</td><td>{data.detail.alamatIbu || '-'}</td></tr>
							<tr><td class="text-base-content/60">Pekerjaan</td><td>{data.detail.pekerjaanIbu || '-'}</td></tr>
							<tr><td class="text-base-content/60">Penghasilan</td><td>Rp {formatNumber(data.detail.penghasilanIbu)}</td></tr>
						</tbody>
					</table>
				</div>
			</div>

			<div class="card-actions justify-center mt-8 print:hidden border-t border-base-200 pt-6">
				<a href="/master/santri" class="btn btn-ghost">Kembali</a>
				<button class="btn btn-primary px-8" onclick={() => window.print()}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
					Cetak Sekarang
				</button>
			</div>
		</div>
	</div>
</div>
