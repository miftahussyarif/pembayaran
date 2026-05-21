<script>
	import { page } from "$app/stores";
	import { onMount } from "svelte";

	let openMaster = false;
	let openTransaksi = false;
	let openAdmin = false;

	const storageKey = "sidebar_sections_v1";

	function saveState() {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(
			storageKey,
			JSON.stringify({
				openMaster,
				openTransaksi,
				openAdmin,
			}),
		);
	}

	onMount(() => {
		if (typeof localStorage === "undefined") return;
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

	function isMenuAllowed(routeId) {
		if ($page.data.user?.role === 'admin') return true;
		const accessList = $page.data.roleAccessList || [];

		// Kalau ada record di DB, gunakan nilai dari DB (respects admin toggle)
		const dbRule = accessList.find(r => r.routeId === routeId);
		if (dbRule) return dbRule.isAllowed;

		// Tidak ada di DB → gunakan hardcoded default per role
		if ($page.data.user?.role === 'petugas') {
			if (routeId === '/master/tahun-ajaran' || routeId === '/master/kategori-santri' || routeId === '/master/jenis-pembayaran') return false;
			if (routeId.startsWith('/pengaturan')) return false;
			if (routeId === '/transaksi/tambah-tagihan-khusus') return false;
			if (routeId === '/transaksi/daftar-tagihan-khusus') return false;
			if (routeId === '/transaksi/saldo-keuangan') return false;
		}
		if ($page.data.user?.role === 'bendahara') {
			if (routeId.startsWith('/pengaturan')) return false;
		}

		return true;
	}
</script>

<div class="drawer-side z-40 print:hidden">
	<label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"
	></label>
	<ul
		class="menu p-0 w-72 min-h-full sidebar-bg text-white shadow-xl border-r border-emerald-800/50 gap-0 rounded-r-3xl md:rounded-r-none flex flex-col"
	>
		<!-- Sidebar content here -->
		<li class="mb-2">
			<div class="px-5 pt-6 pb-4 border-b border-white/10">
				<div class="flex items-center gap-3">
					<div
						class="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-bold text-xl shadow-md overflow-hidden shrink-0"
					>
						{#if $page.data.profilPesantren?.logoUrl}
							<img
								src={$page.data.profilPesantren.logoUrl}
								alt="Logo Lembaga"
								class="w-full h-full object-cover"
							/>
						{:else}
							{$page.data.profilPesantren?.namaPesantren?.charAt(0) || "P"}
						{/if}
					</div>
					<div class="min-w-0">
						<h2
							class="font-bold text-sm leading-tight tracking-tight max-w-[160px] truncate text-white"
							title={$page.data.profilPesantren?.namaPesantren || "Aplikasi Pesantren"}
						>
							{$page.data.profilPesantren?.namaPesantren || "Aplikasi Pesantren"}
						</h2>
						<p class="text-xs text-emerald-300/80 font-medium mt-0.5">
							Sistem Pembayaran
						</p>
					</div>
				</div>
			</div>
		</li>
		<li class="px-3 py-1">
			<a
				href="/"
				class={$page.url.pathname === "/"
					? "active-menu"
					: "inactive-menu"}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/></svg
				>
				Dashboard
			</a>
		</li>
		<!-- Data Master Section -->
		<div class="sidebar-divider"></div>
		<li class="px-3">
			<button
				type="button"
				class="section-btn"
				onclick={() => {
					openMaster = !openMaster;
					saveState();
				}}
			>
				<span class="section-label">Data Master</span>
				<span class="section-chevron">{openMaster ? "−" : "+"}</span>
			</button>
		</li>
		{#if openMaster}
			<!-- For Admin & Bendahara: Show all master data -->
			{#if isMenuAllowed('/master/tahun-ajaran')}
				<li>
					<a
						href="/master/tahun-ajaran"
						class={$page.url.pathname.includes(
							"/master/tahun-ajaran",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/></svg
						>
						Tahun
					</a>
				</li>
			{/if}
			{#if isMenuAllowed('/master/kategori-santri')}
				<li>
					<a
						href="/master/kategori-santri"
						class={$page.url.pathname.includes(
							"/master/kategori-santri",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/></svg
						>
						Kategori Santri
					</a>
				</li>
			{/if}
			{#if isMenuAllowed('/master/jenis-pembayaran')}
				<li>
					<a
						href="/master/jenis-pembayaran"
						class={$page.url.pathname.includes(
							"/master/jenis-pembayaran",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
							/></svg
						>
						Jenis Pembayaran
					</a>
				</li>
			{/if}
			<!-- For All Users: Show Data Santri -->
			{#if isMenuAllowed('/master/santri')}
				<li>
					<a
						href="/master/santri"
						class={$page.url.pathname.includes("/master/santri")
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
							/></svg
						>
						Data Santri
					</a>
				</li>
			{/if}
			{#if isMenuAllowed('/master/keaktifan-santri')}
				<li>
					<a
						href="/master/keaktifan-santri"
						class={$page.url.pathname.includes(
							"/master/keaktifan-santri",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
						Keaktifan Santri
					</a>
				</li>
			{/if}
			<!-- For All Users: Show Data Siswa SMK & SMP -->
			{#if isMenuAllowed('/master/data-siswa-smk')}
				<li>
					<a
						href="/master/data-siswa-smk"
						class={$page.url.pathname.includes("/master/data-siswa-smk")
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6L3 9m9 5l9-5"
							/></svg
						>
						Data Siswa SMK
					</a>
				</li>
			{/if}
			{#if isMenuAllowed('/master/data-siswa-smp')}
				<li>
					<a
						href="/master/data-siswa-smp"
						class={$page.url.pathname.includes("/master/data-siswa-smp")
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6L3 9m9 5l9-5"
							/></svg
						>
						Data Siswa SMP
					</a>
				</li>
			{/if}
		{/if}
		<div class="sidebar-divider"></div>
		<li class="px-3">
			<button
				type="button"
				class="section-btn"
				onclick={() => {
					openTransaksi = !openTransaksi;
					saveState();
				}}
			>
				<span class="section-label">Transaksi Pembayaran</span>
				<span class="section-chevron">{openTransaksi ? "−" : "+"}</span>
			</button>
		</li>
		{#if openTransaksi}
			{#if isMenuAllowed('/transaksi/input')}
				<li>
					<a
						href="/transaksi/input"
						class={$page.url.pathname.includes("/transaksi/input")
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
						Input Pembayaran
					</a>
				</li>
			{/if}
			{#if isMenuAllowed('/transaksi/rekap-individu')}
				<li>
					<a
						href="/transaksi/rekap-individu"
						class={$page.url.pathname.includes(
							"/transaksi/rekap-individu",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
						Rekap Individu Santri
					</a>
				</li>
			{/if}
			{#if isMenuAllowed('/transaksi/riwayat')}
				<li>
					<a
						href="/transaksi/riwayat"
						class={$page.url.pathname.includes("/transaksi/riwayat")
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/></svg
						>
						Riwayat Pembayaran
					</a>
				</li>
			{/if}
			{#if isMenuAllowed('/transaksi/tambah-tagihan-khusus')}
				<li>
					<a
						href="/transaksi/tambah-tagihan-khusus"
						class={$page.url.pathname === "/transaksi/tambah-tagihan-khusus"
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4m3-7h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z"
							/></svg
						>
						Input Tagihan Khusus
					</a>
				</li>
			{/if}
			{#if isMenuAllowed('/transaksi/daftar-tagihan-khusus')}
				<li>
					<a
						href="/transaksi/daftar-tagihan-khusus"
						class={$page.url.pathname.includes("/transaksi/daftar-tagihan-khusus")
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 10h16M4 14h16M4 18h16"
							/></svg
						>
						Daftar Tagihan Khusus
					</a>
				</li>
			{/if}
			{#if isMenuAllowed('/transaksi/rekapitulasi')}
				<li>
					<a
						href="/transaksi/rekapitulasi"
						class={$page.url.pathname.includes(
							"/transaksi/rekapitulasi",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/></svg
						>
						Rekapitulasi Pembayaran
					</a>
				</li>
			{/if}
			{#if isMenuAllowed('/transaksi/rekap-petugas')}
				<li>
					<a
						href="/transaksi/rekap-petugas"
						class={$page.url.pathname.includes(
							"/transaksi/rekap-petugas",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5V4H2v16h5m10 0v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4m10 0H7m5-10a2 2 0 100-4 2 2 0 000 4z"
							/></svg
						>
						Rekap Individu Petugas
					</a>
				</li>
			{/if}

			{#if isMenuAllowed('/transaksi/saldo-keuangan')}
				<li>
					<a
						href="/transaksi/saldo-keuangan"
						class={$page.url.pathname.includes(
							"/transaksi/saldo-keuangan",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
						Saldo Keuangan Masuk
					</a>
				</li>
			{/if}
		{/if}

		{#if $page.data.user?.role === "admin"}
			<div class="sidebar-divider"></div>
			<li class="px-3">
				<button
					type="button"
					class="section-btn"
					onclick={() => {
						openAdmin = !openAdmin;
						saveState();
					}}
				>
					<span class="section-label">Pengaturan Administrator</span>
					<span class="section-chevron">{openAdmin ? "−" : "+"}</span>
				</button>
			</li>
			{#if openAdmin}
				<li>
					<a
						href="/pengaturan/profil"
						class={$page.url.pathname.includes("/pengaturan/profil")
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							/></svg
						>
						Profil Pesantren
					</a>
				</li>
				<li>
					<a
						href="/pengaturan/user"
						class={$page.url.pathname.includes("/pengaturan/user")
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
							/></svg
						>
						Manajemen User
					</a>
				</li>
				<li>
					<a
						href="/pengaturan/import-tunggakan"
						class={$page.url.pathname.includes(
							"/pengaturan/import-tunggakan",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 20h10"
							/></svg
						>
						Import Tunggakan
					</a>
				</li>
				<li>
					<a
						href="/pengaturan/system-full-log"
						class={$page.url.pathname.includes(
							"/pengaturan/system-full-log",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/></svg
						>
						System Full Log
					</a>
				</li>
				<li>
					<a
						href="/pengaturan/reset-database"
						class={$page.url.pathname.includes(
							"/pengaturan/reset-database",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 7h16M6 7l1 12h10l1-12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"
							/></svg
						>
						Reset Database
					</a>
				</li>
				<li>
					<a
						href="/pengaturan/backup-database"
						class={$page.url.pathname.includes(
							"/pengaturan/backup-database",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v7m0 0l-3-3m3 3l3-3M8 7h8m-8 0a4 4 0 018 0"
							/></svg
						>
						Backup Database
					</a>
				</li>
				<li>
					<a
						href="/pengaturan/restore-database"
						class={$page.url.pathname.includes(
							"/pengaturan/restore-database",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 19V8m0 0l-3 3m3-3l3 3M8 7h8m-8 0a4 4 0 018 0"
							/></svg
						>
						Restore Database
					</a>
				</li>
				<li>
					<a
						href="/pengaturan/akses-halaman"
						class={$page.url.pathname.includes(
							"/pengaturan/akses-halaman",
						)
							? "active-menu"
							: "inactive-menu"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 opacity-70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/></svg
						>
						Pengaturan Halaman
					</a>
				</li>
			{/if}
		{/if}
		<div class="mt-auto"></div>
		<div class="sidebar-divider"></div>
		<li class="px-3 py-2 mb-2">
			<form method="POST" action="/logout" class="w-full">
				<button
					type="submit"
					class="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200 text-sm font-medium"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
						/></svg
					>
					Logout
				</button>
			</form>
		</li>
	</ul>
</div>

<style>
	.sidebar-bg {
		background: linear-gradient(180deg, #064e3b 0%, #065f46 50%, #047857 100%);
	}
	.active-menu {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.625rem 0.875rem;
		border-radius: 0.75rem;
		background: rgba(255,255,255,0.18);
		color: white;
		font-weight: 600;
		font-size: 0.875rem;
		transition: all 0.2s;
	}
	.inactive-menu {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.625rem 0.875rem;
		border-radius: 0.75rem;
		background: transparent;
		color: rgba(255,255,255,0.75);
		font-size: 0.875rem;
		transition: all 0.2s;
	}
	.inactive-menu:hover {
		background: rgba(255,255,255,0.1);
		color: white;
	}
	.sidebar-divider {
		height: 1px;
		background: rgba(255,255,255,0.08);
		margin: 0.375rem 1rem;
	}
	.section-btn {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 0.375rem 0.5rem;
		text-align: left;
		gap: 0.5rem;
		border-radius: 0.5rem;
		background: transparent;
		transition: background 0.2s;
		cursor: pointer;
		border: none;
	}
	.section-btn:hover {
		background: rgba(255,255,255,0.06);
	}
	.section-label {
		font-weight: 700;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgba(110,231,183,0.8);
	}
	.section-chevron {
		margin-left: auto;
		font-size: 0.75rem;
		color: rgba(255,255,255,0.4);
	}
</style>
