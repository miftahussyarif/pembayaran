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
	<link rel="icon" href={faviconUrl} type={faviconType} />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen" style="font-family: 'Inter', sans-serif;" data-theme="corporate">
	{@render children()}
</div>
