<script>
	import { page } from '$app/stores';
	let { pageTitle } = $props();
</script>

<div class="sticky top-0 z-30 w-full print:hidden" style="font-family: 'Inter', sans-serif;">
	<div class="topbar-gradient flex items-center gap-3 px-4 md:px-6 h-16 shadow-md border-b border-emerald-700/40">
		<!-- Hamburger (mobile) -->
		<label for="my-drawer-2" class="btn btn-square btn-ghost drawer-button lg:hidden text-white hover:bg-white/10">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
			</svg>
		</label>

		<!-- Page Title -->
		<div class="flex-1 min-w-0">
			<h1 class="text-base md:text-lg font-bold text-white truncate tracking-tight">{pageTitle || 'Dashboard'}</h1>
		</div>

		<!-- Right side -->
		<div class="flex items-center gap-3">
			<!-- Tahun Aktif Badge -->
			<span class="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-medium">
				<span class="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
				{$page.data.tahunAjaranAktif?.nama || 'Belum ada tahun aktif'}
			</span>

			<!-- User Dropdown -->
			<div class="dropdown dropdown-end">
				<button type="button" class="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/10 transition-colors duration-200" aria-label="Buka menu pengguna">
					<div class="w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm shadow-sm">
						{$page.data.user?.namaLengkap?.charAt(0) || 'U'}
					</div>
					<div class="hidden md:block text-left">
						<div class="text-xs font-semibold text-white leading-tight truncate max-w-[100px]">{$page.data.user?.namaLengkap || 'Pengguna'}</div>
						<div class="text-[10px] text-white/60 uppercase tracking-wide">{$page.data.user?.role || ''}</div>
					</div>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-white/60 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				<ul class="mt-2 z-[1] p-2 shadow-xl menu menu-sm dropdown-content bg-white rounded-xl w-52 border border-gray-100">
					<li class="px-3 py-2 border-b border-gray-100 mb-1">
						<div class="block">
							<div class="font-semibold text-gray-800 text-sm">Halo, {$page.data.user?.namaLengkap || 'Pengguna'}!</div>
							<span class="inline-block mt-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full tracking-wide">{$page.data.user?.role || ''}</span>
						</div>
					</li>
					<li><a href="/pengaturan/profil" class="text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-sm">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
						Profil Pesantren
					</a></li>
					<li><a href="/pengaturan/user" class="text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-sm">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
						Manajemen User
					</a></li>
					<li class="mt-1 pt-1 border-t border-gray-100">
						<form method="POST" action="/logout">
							<button type="submit" class="w-full text-left flex items-center gap-2 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"/></svg>
								Logout
							</button>
						</form>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	.topbar-gradient {
		background: linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%);
	}
</style>
