<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let openMaster = false;
	let openTransaksi = false;
	let openAdmin = false;

	const storageKey = 'sidebar_sections_v1';

	function saveState() {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(storageKey, JSON.stringify({
			openMaster,
			openTransaksi,
			openAdmin
		}));
	}

	onMount(() => {
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem(storageKey);
		if (!raw) return;
		try {
			const saved = JSON.parse(raw);
			openMaster = !!saved.openMaster;
			openTransaksi = !!saved.openTransaksi;
			openAdmin = !!saved.openAdmin;
		} catch {
			// ignore invalid storage
		}
	});
</script>

<div class="drawer-side z-40">
	<label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
	<ul class="menu p-4 w-72 min-h-full bg-base-100 text-base-content shadow-lg border-r border-base-200 gap-1 rounded-r-3xl md:rounded-r-none flex flex-col">
		<!-- Sidebar content here -->
		<li class="mb-4">
	<div class="p-6 pb-2">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg bg-primary text-primary-content flex items-center justify-center font-bold text-xl shadow-md overflow-hidden">
				{#if $page.data.profilPesantren?.logoUrl}
					<img src={$page.data.profilPesantren.logoUrl} alt="Logo Lembaga" class="w-full h-full object-cover" />
				{:else}
					{$page.data.profilPesantren?.namaPesantren?.charAt(0) || 'P'}
				{/if}
			</div>
			<div>
				<h2 class="font-bold text-lg leading-tight tracking-tight max-w-[160px] truncate" title={$page.data.profilPesantren?.namaPesantren || 'Aplikasi Pesantren'}>
					{$page.data.profilPesantren?.namaPesantren || 'Aplikasi Pesantren'}
				</h2>
				<p class="text-xs text-base-content/60 font-medium">Sistem Pembayaran</p>
			</div>
		</div>
	</div>
		</li>
		<li>
			<a href="/" class={$page.url.pathname === '/' ? 'active bg-primary text-primary-content' : ''}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
				Dashboard
			</a>
		</li>
		{#if $page.data.user?.role !== 'petugas'}
			<div class="divider my-0"></div>
			<li>
				<button
					type="button"
					class="flex items-center w-full px-4 py-2 text-left gap-2 hover:bg-base-200 rounded-lg"
					onclick={() => { openMaster = !openMaster; saveState(); }}>
					<span class="font-semibold text-xs uppercase text-base-content/60">Data Master</span>
					<span class="ml-auto text-xs text-base-content/50">{openMaster ? '−' : '+'}</span>
				</button>
			</li>
			{#if openMaster}
			<li>
				<a href="/master/tahun-ajaran" class={$page.url.pathname.includes('/master/tahun-ajaran') ? 'active bg-primary text-primary-content' : ''}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
					Tahun
				</a>
			</li>
			<li>
				<a href="/master/santri" class={$page.url.pathname.includes('/master/santri') ? 'active bg-primary text-primary-content' : ''}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
					Data Santri
				</a>
			</li>
			<li>
				<a href="/master/kategori-santri" class={$page.url.pathname.includes('/master/kategori-santri') ? 'active bg-primary text-primary-content' : ''}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
					Kategori Santri
				</a>
			</li>
			<li>
				<a href="/master/jenis-pembayaran" class={$page.url.pathname.includes('/master/jenis-pembayaran') ? 'active bg-primary text-primary-content' : ''}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
					Jenis Pembayaran
				</a>
			</li>
			<li>
				<a href="/master/data-siswa-smk" class={$page.url.pathname.includes('/master/data-siswa-smk') ? 'active bg-primary text-primary-content' : ''}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6L3 9m9 5l9-5" /></svg>
					Data Siswa SMK
				</a>
			</li>
			<li>
				<a href="/master/data-siswa-smp" class={$page.url.pathname.includes('/master/data-siswa-smp') ? 'active bg-primary text-primary-content' : ''}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6L3 9m9 5l9-5" /></svg>
					Data Siswa SMP
				</a>
			</li>
			{/if}
		{/if}
		<div class="divider my-0"></div>
		<li>
			<button
				type="button"
				class="flex items-center w-full px-4 py-2 text-left gap-2 hover:bg-base-200 rounded-lg"
				onclick={() => { openTransaksi = !openTransaksi; saveState(); }}>
				<span class="font-semibold text-xs uppercase text-base-content/60">Transaksi Pembayaran</span>
				<span class="ml-auto text-xs text-base-content/50">{openTransaksi ? '−' : '+'}</span>
			</button>
		</li>
		{#if openTransaksi}
		<li>
			<a href="/transaksi/input" class={$page.url.pathname.includes('/transaksi/input') ? 'active bg-primary text-primary-content' : ''}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				Input Pembayaran
			</a>
		</li>
		<li>
			<a href="/transaksi/riwayat" class={$page.url.pathname.includes('/transaksi/riwayat') ? 'active bg-primary text-primary-content' : ''}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
				Riwayat Pembayaran
			</a>
		</li>
		<li>
			<a href="/transaksi/rekapitulasi" class={$page.url.pathname.includes('/transaksi/rekapitulasi') ? 'active bg-primary text-primary-content' : ''}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
				Rekapitulasi
			</a>
		</li>
		<li>
			<a href="/transaksi/rekap-individu" class={$page.url.pathname.includes('/transaksi/rekap-individu') ? 'active bg-primary text-primary-content' : ''}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				Rekap Individu
			</a>
		</li>

		{#if $page.data.user?.role === 'admin' || $page.data.user?.role === 'bendahara'}
		<li>
			<a href="/pengaturan/saldo-keuangan" class={$page.url.pathname.includes('/pengaturan/saldo-keuangan') ? 'active bg-primary text-primary-content' : ''}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				Saldo Keuangan
			</a>
		</li>
		{/if}
		{/if}
		
		{#if $page.data.user?.role === 'admin'}
		<div class="divider my-0"></div>
		<li>
			<button
				type="button"
				class="flex items-center w-full px-4 py-2 text-left gap-2 hover:bg-base-200 rounded-lg"
				onclick={() => { openAdmin = !openAdmin; saveState(); }}>
				<span class="font-semibold text-xs uppercase text-base-content/60">Pengaturan Administrator</span>
				<span class="ml-auto text-xs text-base-content/50">{openAdmin ? '−' : '+'}</span>
			</button>
		</li>
		{#if openAdmin}
		<li>
			<a href="/pengaturan/profil" class={$page.url.pathname.includes('/pengaturan/profil') ? 'active bg-primary text-primary-content' : ''}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
				Profil Pesantren
			</a>
		</li>
		<li>
			<a href="/pengaturan/user" class={$page.url.pathname.includes('/pengaturan/user') ? 'active bg-primary text-primary-content' : ''}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
				Manajemen User
			</a>
		</li>
		<li>
			<a href="/pengaturan/system-full-log" class={$page.url.pathname.includes('/pengaturan/system-full-log') ? 'active bg-primary text-primary-content' : ''}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
				System Full Log
			</a>
		</li>
		<li>
			<a href="/pengaturan/reset-database" class={$page.url.pathname.includes('/pengaturan/reset-database') ? 'active bg-primary text-primary-content' : ''}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M6 7l1 12h10l1-12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
				Reset Database
			</a>
		</li>
		<li>
			<a href="/pengaturan/backup-database" class={$page.url.pathname.includes('/pengaturan/backup-database') ? 'active bg-primary text-primary-content' : ''}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v7m0 0l-3-3m3 3l3-3M8 7h8m-8 0a4 4 0 018 0" /></svg>
				Backup Database
			</a>
		</li>
		<li>
			<a href="/pengaturan/restore-database" class={$page.url.pathname.includes('/pengaturan/restore-database') ? 'active bg-primary text-primary-content' : ''}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 19V8m0 0l-3 3m3-3l3 3M8 7h8m-8 0a4 4 0 018 0" /></svg>
				Restore Database
			</a>
		</li>
		{/if}
		{/if}
		<div class="mt-auto"></div>
		<div class="divider my-0"></div>
		<li>
			<form method="POST" action="/logout" class="w-full">
				<button type="submit" class="btn btn-ghost justify-start text-error w-full">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
					Logout
				</button>
			</form>
		</li>
	</ul>
</div>
