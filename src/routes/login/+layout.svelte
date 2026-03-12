<script>
	import '../layout.css';
	import { page } from '$app/state';
	let { children } = $props();
	let faviconUrl = $derived(page.data?.profilPesantren?.logoUrl || '/favicon.svg');
	let faviconType = $derived.by(() => {
		const url = faviconUrl || '/favicon.svg';
		const lower = url.toLowerCase();
		if (lower.endsWith('.png')) return 'image/png';
		if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
		if (lower.endsWith('.webp')) return 'image/webp';
		return 'image/svg+xml';
	});
</script>

<svelte:head>
	<title>Login - Aplikasi Pesantren</title>
	<link rel="icon" href={faviconUrl} type={faviconType} />
</svelte:head>

<!-- Layout khusus login tanpa Sidebar dan Navbar -->
{@render children()}
