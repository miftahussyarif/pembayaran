<script>
	import { page } from '$app/stores';
	let { children } = $props();
</script>

<div class="p-6">
	<!-- Tab Navigasi Pengaturan -->
	<div role="tablist" class="tabs tabs-lifted tabs-lg mb-8">
		<a href="/pengaturan/profil" role="tab" class={`tab ${$page.url.pathname.includes('/pengaturan/profil') ? 'tab-active text-primary font-bold' : ''}`}>Profil Instansi</a>
		<a href="/pengaturan/user" role="tab" class={`tab ${$page.url.pathname.includes('/pengaturan/user') ? 'tab-active text-primary font-bold' : ''}`}>Manajemen User</a>
		{#if $page.data.user?.role === 'admin' || $page.data.user?.role === 'bendahara'}
			<a href="/pengaturan/saldo-keuangan" role="tab" class={`tab ${$page.url.pathname.includes('/pengaturan/saldo-keuangan') ? 'tab-active text-primary font-bold' : ''}`}>Saldo Keuangan</a>
		{/if}
		{#if $page.data.user?.role === 'admin'}
			<a href="/pengaturan/system-full-log" role="tab" class={`tab ${$page.url.pathname.includes('/pengaturan/system-full-log') ? 'tab-active text-primary font-bold' : ''}`}>System Full Log</a>
			<a href="/pengaturan/reset-database" role="tab" class={`tab ${$page.url.pathname.includes('/pengaturan/reset-database') ? 'tab-active text-primary font-bold' : ''}`}>Reset Database</a>
			<a href="/pengaturan/backup-database" role="tab" class={`tab ${$page.url.pathname.includes('/pengaturan/backup-database') ? 'tab-active text-primary font-bold' : ''}`}>Backup Database</a>
			<a href="/pengaturan/restore-database" role="tab" class={`tab ${$page.url.pathname.includes('/pengaturan/restore-database') ? 'tab-active text-primary font-bold' : ''}`}>Restore Database</a>
		{/if}
	</div>
	
	<!-- Konten -->
	{@render children()}
</div>
