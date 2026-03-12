<script>
	import { page } from '$app/stores';
	let { pageTitle } = $props();
</script>

<div class="navbar bg-base-100 border-b border-base-200 z-30 sticky top-0 md:px-6 shadow-sm">
	<div class="flex-none">
		<label for="my-drawer-2" class="btn btn-square btn-ghost drawer-button lg:hidden">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
		</label>
	</div>
	<div class="flex-1 px-2 mx-2">
		<h1 class="text-xl font-bold truncate">{pageTitle || 'Dashboard'}</h1>
	</div>
	<div class="flex-none hidden md:flex items-center gap-4">
		<span class="text-sm font-medium mr-4 badge badge-success badge-outline">Tahun Aktif: {$page.data.tahunAjaranAktif?.nama || '-'}</span>
		<div class="dropdown dropdown-end">
			<div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar border border-base-200">
				<div class="w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
					{$page.data.user?.namaLengkap?.charAt(0) || 'U'}
				</div>
			</div>
			<ul tabindex="0" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
				<li class="menu-title px-4 py-2 text-xs font-bold text-base-content/50">
					Halo, {$page.data.user?.namaLengkap || 'Pengguna'}!
					<div class="badge badge-sm badge-primary badge-outline mt-1 uppercase text-[10px]">{$page.data.user?.role || ''}</div>
				</li>
				<li><a href="/pengaturan/profil">Profil Pesantren</a></li>
				<li><a href="/pengaturan/user">Manajemen User</a></li>
				<div class="divider my-0"></div>
				<li>
					<form method="POST" action="/logout">
						<button type="submit" class="text-error w-full text-left">Logout</button>
					</form>
				</li>
			</ul>
		</div>
	</div>
</div>
