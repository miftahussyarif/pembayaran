<script>
	import '../layout.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import { page } from '$app/state';

	// Page Title Management
	let pageTitle = $derived(
		page.url.pathname === '/' ? 'Dashboard' :
		page.url.pathname.includes('/master/tahun-ajaran') ? 'Master Tahun' :
		page.url.pathname.includes('/master/santri') ? 'Data Santri' :
		page.url.pathname.includes('/master/jenis-pembayaran') ? 'Jenis Pembayaran' :
		page.url.pathname.includes('/transaksi/input') ? 'Input Pembayaran' :
		page.url.pathname.includes('/transaksi/riwayat') ? 'Riwayat Pembayaran' :
		page.url.pathname.includes('/transaksi/rekapitulasi') ? 'Rekapitulasi Pembayaran' :
		page.url.pathname.includes('/transaksi/rekap-individu') ? 'Rekapitulasi Individu' :
		'Pembayaran App'
	);
	const currentYear = new Date().getFullYear();
	let faviconUrl = $derived(page.data?.profilPesantren?.logoUrl || '/favicon.svg');
	let faviconType = $derived.by(() => {
		const url = faviconUrl || '/favicon.svg';
		const lower = url.toLowerCase();
		if (lower.endsWith('.png')) return 'image/png';
		if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
		if (lower.endsWith('.webp')) return 'image/webp';
		return 'image/svg+xml';
	});
	
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={faviconUrl} type={faviconType} />
</svelte:head>

<div class="drawer lg:drawer-open bg-base-200 min-h-screen">
	<input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
	
	<div class="drawer-content flex flex-col items-center justify-start overflow-hidden">
		<!-- Page content here -->
		<Topbar {pageTitle} />
		<main class="w-full flex-1 p-4 md:p-6 lg:p-8 max-w-7xl">
			{@render children()}
		</main>
		{#if !page.url.pathname.includes('/transaksi/cetak')}
		<footer class="w-full text-center text-xs text-base-content/50 pb-4">
			Proudly presented by Miftahussyarif @{currentYear}
		</footer>
		{/if}
	</div> 
	
	<Sidebar />
</div>
