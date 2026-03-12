<script>
	import '../layout.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>Login - Aplikasi Pesantren</title>
</svelte:head>

<!-- Layout khusus login tanpa Sidebar dan Navbar -->
{@render children()}
