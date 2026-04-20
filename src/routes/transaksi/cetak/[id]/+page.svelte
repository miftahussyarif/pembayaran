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
</svelte:head>

<div class="cetak-page">
	<!-- Receipt Content -->
	<div class="receipt">
		<!-- Header -->
		<div class="receipt-header">
			<div class="header-left">
				<div class="logo-box">
					{#if $page.data.profilPesantren?.logoUrl}
						<img src={$page.data.profilPesantren.logoUrl} alt="Logo" />
					{:else}
						<span class="logo-fallback">{$page.data.profilPesantren?.namaPesantren?.charAt(0) || 'P'}</span>
					{/if}
				</div>
				<div class="header-info">
					<h1>{$page.data.profilPesantren?.namaPesantren || 'Aplikasi Pesantren'}</h1>
					<p class="alamat">{$page.data.profilPesantren?.alamat || 'Alamat Pesantren'}</p>
				</div>
			</div>
			<div class="header-right">
				<h2>KWITANSI</h2>
				<p class="nomor-kwitansi">{data.pembayaran.nomorKwitansi}</p>
			</div>
		</div>

		<!-- Info Pembayar -->
		<div class="info-grid">
			<div class="info-left">
				<span class="label">Telah Diterima Dari:</span>
				<span class="nama-pembayar">{data.santri?.namaLengkap || data.pembayarLain?.namaPembayar || '-'}</span>
				<div class="sub-info">
					{#if data.santri?.nomorInduk}
						No Induk: {data.santri.nomorInduk}
					{:else}
						Kategori: Pembayar Umum
					{/if}
				</div>
			</div>
			<div class="info-right">
				<span class="label">Tanggal Bayar:</span>
				<span class="tanggal">{new Date(data.pembayaran.tanggalBayar).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</span>
				<div class="sub-info">Tahun Ajaran: {data.tahunAjaran.nama}</div>
			</div>
		</div>

		<!-- Tabel Pembayaran -->
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Keterangan Pembayaran</th>
						<th class="text-right">Nominal</th>
					</tr>
				</thead>
				<tbody>
					{#each data.pembayaranList as item}
						<tr>
							<td>
								{#if item.keteranganKhusus}
									{item.keteranganKhusus}
								{:else}
									{item.namaPembayaran || 'Pembayaran'}
								{/if}
								{#if item.bulan}
									<span class="bulan-badge">
										Bulan: {item.bulan}{item.tahunTagihan ? ` ${item.tahunTagihan}` : ''}
									</span>
								{/if}
							</td>
							<td class="text-right nominal">Rp {item.nominalDibayar.toLocaleString('id-ID')}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="total-row">
						<td class="text-right">TOTAL</td>
						<td class="text-right total-nominal">Rp {data.totalNominal.toLocaleString('id-ID')}</td>
					</tr>
					<tr>
						<td colspan="2" class="terbilang">
							Terbilang: {terbilang(data.totalNominal)} rupiah
						</td>
					</tr>
				</tfoot>
			</table>
		</div>

		<!-- Tanda Tangan -->
		<div class="signature-section">
			<div class="signature-box">
				<p class="sign-label">Penerima / Bendahara</p>
				{#if $page.data.profilPesantren?.stampUrl}
					<img
						src={$page.data.profilPesantren.stampUrl}
						alt="Stempel lembaga"
						class="stamp-img"
					/>
				{/if}
				<div class="sign-area">
					{#if data.petugasSignatureUrl}
						<img
							src={data.petugasSignatureUrl}
							alt="Tanda tangan"
							class="signature-img"
						/>
					{/if}
				</div>
				<div class="sign-line"></div>
				<p class="sign-name">{data.petugas}</p>
			</div>
		</div>

		<!-- Garis potong -->
		<div class="cut-guide">
			<div class="cut-line"></div>
			<span class="cut-icon">✂</span>
		</div>
	</div>

	<!-- Action Buttons (hidden on print) -->
	<div class="action-buttons no-print">
		<a href="/transaksi/input" class="btn-back">Kembali</a>
		<button class="btn-print" onclick={() => window.print()}>
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
			Cetak Sekarang
		</button>
	</div>
</div>

<style>
	/* ==================== SCREEN STYLES ==================== */
	.cetak-page {
		min-height: 100vh;
		background: #e5e7eb;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 24px 12px;
		font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
	}

	.receipt {
		width: 100%;
		max-width: 640px;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 4px 24px rgba(0,0,0,0.10);
		padding: 28px 32px;
	}

	/* Header */
	.receipt-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 2px solid #d1d5db;
		padding-bottom: 12px;
		margin-bottom: 12px;
	}
	.header-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.logo-box {
		width: 52px;
		height: 52px;
		background: #eef2ff;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
	}
	.logo-box img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.logo-fallback {
		font-size: 22px;
		font-weight: 700;
		color: #4f46e5;
	}
	.header-info h1 {
		font-size: 18px;
		font-weight: 700;
		margin: 0;
		line-height: 1.3;
	}
	.header-info .alamat {
		font-size: 12px;
		color: #6b7280;
		margin: 2px 0 0;
	}
	.header-right {
		text-align: right;
	}
	.header-right h2 {
		font-size: 16px;
		font-weight: 700;
		letter-spacing: 3px;
		color: #4f46e5;
		margin: 0;
	}
	.nomor-kwitansi {
		font-size: 11px;
		font-family: monospace;
		margin: 3px 0 0;
		color: #374151;
	}

	/* Info Grid */
	.info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 12px;
		font-size: 13px;
	}
	.label {
		display: block;
		color: #9ca3af;
		font-size: 11px;
		margin-bottom: 2px;
	}
	.nama-pembayar {
		font-weight: 700;
		font-size: 15px;
	}
	.tanggal {
		font-weight: 700;
		font-size: 13px;
	}
	.info-right {
		text-align: right;
	}
	.sub-info {
		color: #6b7280;
		font-size: 11px;
		margin-top: 2px;
	}

	/* Table */
	.table-wrapper {
		margin-bottom: 10px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	thead {
		background: #f3f4f6;
	}
	th, td {
		padding: 6px 8px;
		border: 1px solid #d1d5db;
		line-height: 1.3;
	}
	th {
		font-weight: 600;
		font-size: 12px;
		text-align: left;
	}
	.text-right {
		text-align: right;
	}
	.nominal {
		font-weight: 700;
		white-space: nowrap;
	}
	.bulan-badge {
		display: inline-block;
		font-size: 10px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		padding: 1px 5px;
		margin-left: 6px;
		color: #6b7280;
	}
	.total-row {
		background: #f0f0ff;
	}
	.total-row td {
		font-weight: 700;
		font-size: 14px;
		color: #4f46e5;
	}
	.total-nominal {
		font-size: 15px !important;
	}
	.terbilang {
		font-style: italic;
		font-size: 11px;
		color: #6b7280;
		text-align: left;
	}
	tfoot {
		font-weight: 600;
	}

	/* Signature */
	.signature-section {
		display: flex;
		justify-content: flex-end;
		margin-top: 8px;
		padding-top: 4px;
	}
	.signature-box {
		text-align: center;
		position: relative;
		width: 200px;
	}
	.sign-label {
		font-size: 11px;
		color: #6b7280;
		margin: 0 0 4px;
	}
	.stamp-img {
		width: 105px;
		height: 105px;
		object-fit: contain;
		opacity: 0.8;
		position: absolute;
		left: -24px;
		top: 8px;
		mix-blend-mode: multiply;
		pointer-events: none;
		z-index: 20;
	}
	.sign-area {
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 4px;
		position: relative;
		z-index: 10;
	}
	.signature-img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		mix-blend-mode: multiply;
		pointer-events: none;
	}
	.sign-line {
		width: 140px;
		border-bottom: 1px solid #374151;
		margin: 0 auto;
		position: relative;
		z-index: 10;
	}
	.sign-name {
		margin: 3px 0 0;
		font-size: 12px;
		font-weight: 600;
		position: relative;
		z-index: 10;
	}

	/* Cut Guide */
	.cut-guide {
		position: relative;
		width: 100%;
		margin-top: 16px;
		padding-top: 4px;
		display: flex;
		align-items: center;
	}
	.cut-line {
		flex: 1;
		border-top: 2px dashed #c0c0c0;
	}
	.cut-icon {
		position: absolute;
		left: -4px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 14px;
		color: #9ca3af;
		line-height: 1;
	}

	/* Action Buttons */
	.action-buttons {
		display: flex;
		gap: 12px;
		margin-top: 20px;
		justify-content: center;
	}
	.btn-back {
		padding: 8px 20px;
		border-radius: 8px;
		border: 1px solid #d1d5db;
		background: #fff;
		color: #374151;
		font-size: 14px;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.15s;
	}
	.btn-back:hover {
		background: #f3f4f6;
	}
	.btn-print {
		padding: 8px 24px;
		border-radius: 8px;
		border: none;
		background: #4f46e5;
		color: #fff;
		font-size: 14px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: background 0.15s;
	}
	.btn-print:hover {
		background: #4338ca;
	}

	/* ==================== PRINT STYLES ==================== */
	@media print {
		/* Hide non-print elements */
		.no-print {
			display: none !important;
		}

		/* Reset page */
		@page {
			margin: 5mm;
			size: A4 portrait;
		}

		.cetak-page {
			min-height: auto;
			background: white;
			padding: 0;
		}

		.receipt {
			max-width: 100%;
			box-shadow: none;
			border-radius: 0;
			padding: 0;
		}

		/* ---- Font sizing: 50% reduction ---- */
		.header-info h1 {
			font-size: 9pt;
		}
		.header-info .alamat {
			font-size: 5.5pt;
		}
		.header-right h2 {
			font-size: 8pt;
		}
		.nomor-kwitansi {
			font-size: 5.5pt;
		}
		.label {
			font-size: 5pt;
		}
		.nama-pembayar {
			font-size: 7pt;
		}
		.tanggal {
			font-size: 6pt;
		}
		.sub-info {
			font-size: 5pt;
		}
		table {
			font-size: 6pt;
		}
		th {
			font-size: 5.5pt;
		}
		th, td {
			padding: 1.5pt 3pt;
			line-height: 1.15;
		}
		.bulan-badge {
			font-size: 5pt;
			padding: 0.5pt 2pt;
			margin-left: 3px;
		}
		.total-row td {
			font-size: 7pt;
		}
		.total-nominal {
			font-size: 7.5pt !important;
		}
		.terbilang {
			font-size: 5.5pt;
		}
		.sign-label {
			font-size: 5pt;
		}
		.sign-name {
			font-size: 5.5pt;
		}

		/* ---- Spacing: 50% reduction ---- */
		.receipt-header {
			padding-bottom: 4pt;
			margin-bottom: 4pt;
			border-bottom-width: 0.5px;
		}
		.logo-box {
			width: 28px;
			height: 28px;
			border-radius: 4px;
		}
		.logo-fallback {
			font-size: 12px;
		}
		.header-left {
			gap: 4pt;
		}
		.info-grid {
			gap: 3pt;
			margin-bottom: 4pt;
		}
		.label {
			margin-bottom: 1pt;
		}
		.sub-info {
			margin-top: 1pt;
		}
		.table-wrapper {
			margin-bottom: 4pt;
		}
		.signature-section {
			margin-top: 3pt;
			padding-top: 2pt;
		}
		.sign-area {
			height: 30px;
			margin-bottom: 2pt;
		}
		.stamp-img {
			width: 54px;
			height: 54px;
			left: -12px;
			top: 4px;
		}
		.sign-line {
			width: 70px;
		}
		.sign-name {
			margin-top: 1pt;
		}
		.signature-box {
			width: 100px;
		}

		/* Cut guide print */
		.cut-guide {
			margin-top: 8pt;
			padding-top: 2pt;
		}
		.cut-line {
			border-top: 1px dashed #999;
		}
		.cut-icon {
			font-size: 8pt;
			color: #999;
		}

		/* Colors for print */
		.total-row {
			background: #f0f0f0 !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
		thead {
			background: #f0f0f0 !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
		.total-row td {
			color: #333;
		}
	}
</style>
